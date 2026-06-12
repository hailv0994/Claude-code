import type {
  MaterialInput, JointInput, EquipmentInput,
  WeldingParameters, PreheatResult, ParameterRange, HeatInputStatus,
} from '../types';
import { getGradeById } from './tables/materialGrades';
import {
  CURRENT_RANGES, THERMAL_EFFICIENCY, VOLTAGE_FORMULA,
} from './tables/processDefaults';
import {
  AWS_D1_1_PREHEAT, INTERPASS_MAX, HEAT_INPUT_LIMITS,
} from './tables/preheatTables';

// ──────────────────────────────────────────────────────────────
// Voltage from current
// ──────────────────────────────────────────────────────────────
function calcVoltage(process: string, current: number): ParameterRange {
  const f = VOLTAGE_FORMULA[process as keyof typeof VOLTAGE_FORMULA]
    ?? { a: 0.04, b: 16, spread: 2 };
  const rec = Math.round(f.a * current + f.b);
  return { min: rec - f.spread, recommended: rec, max: rec + f.spread };
}

// ──────────────────────────────────────────────────────────────
// Heat Input  HI = (I × U × 60) / (v × 1000) × k   [kJ/mm]
// Solve for travel speed given target HI
// ──────────────────────────────────────────────────────────────
function calcTravelSpeed(
  current: number, voltage: number, targetHI: number, process: string
): number {
  const k = THERMAL_EFFICIENCY[process as keyof typeof THERMAL_EFFICIENCY] ?? 0.8;
  // v = (I × U × 60 × k) / (HI × 1000)   mm/min
  return Math.round((current * voltage * 60 * k) / (targetHI * 1000));
}

function calcHeatInput(current: number, voltage: number, travelSpeed: number, process: string): number {
  const k = THERMAL_EFFICIENCY[process as keyof typeof THERMAL_EFFICIENCY] ?? 0.8;
  return (current * voltage * 60 * k) / (travelSpeed * 1000);
}

// ──────────────────────────────────────────────────────────────
// Wire Feed Speed (GMAW/FCAW)
// Empirical burnoff model: WFS = I × 27.5 × (1.2/d)²  [mm/min]
// Calibrated: d=1.2mm, I=200A → ~5500 mm/min (≈5.5 m/min) ✓
// ──────────────────────────────────────────────────────────────
function calcWireFeedSpeed(process: string, current: number, diameter: number): number | null {
  if (process !== 'GMAW' && process !== 'FCAW') return null;
  const k = 27.5 * (1.2 / diameter) ** 2;
  return Math.round(current * k);
}

// ──────────────────────────────────────────────────────────────
// Deposit rate (kg/hr)
// Based on WFS and wire cross-section area
// ──────────────────────────────────────────────────────────────
function calcDepositRate(process: string, current: number, diameter: number): number | null {
  if (process === 'GTAW') return null;
  const wfs = calcWireFeedSpeed(process, current, diameter);
  if (!wfs) {
    // SMAW/SAW: approximate from current
    const smawEff = process === 'SMAW' ? 0.65 : 1.0;
    return Math.round(current * 0.012 * smawEff * 10) / 10;
  }
  // kg/hr = WFS (mm/min) × area (mm²) × density (g/mm³) × 60 × eff / 1e6
  const area = Math.PI * (diameter / 2) ** 2; // mm²
  const density = 7.85e-3; // g/mm³ = 7.85 g/cm³
  const eff = process === 'FCAW' ? 0.85 : 0.95;
  const rate = wfs * area * density * 60 * eff / 1000; // kg/hr
  return Math.round(rate * 10) / 10;
}

// ──────────────────────────────────────────────────────────────
// Estimated pass count
// ──────────────────────────────────────────────────────────────
function estimatePassCount(
  joint: JointInput, material: MaterialInput, diameter: number
): number {
  const T = material.thickness;
  if (joint.type === 'fillet') {
    const size = joint.filletSize || T / 2;
    const area = 0.5 * size * size;
    const passArea = Math.PI * (diameter / 2) ** 2 * 4;
    return Math.max(1, Math.ceil(area / passArea));
  }
  if (T <= 6) return 1;
  if (T <= 12) return 2;
  if (T <= 20) return 3;
  if (T <= 32) return Math.ceil(T / 8);
  return Math.ceil(T / 7);
}

// ──────────────────────────────────────────────────────────────
// Main parameter calculation
// ──────────────────────────────────────────────────────────────
export function calculateWeldingParameters(
  material: MaterialInput,
  joint: JointInput,
  equipment: EquipmentInput,
): WeldingParameters | null {
  if (!material.gradeId || !material.thickness || !equipment.wireDiameter) return null;

  const processRanges = CURRENT_RANGES[equipment.process];
  if (!processRanges) return null;

  // Find nearest available diameter
  const availDiameters = Object.keys(processRanges).map(Number).sort((a, b) => a - b);
  const nearestD = availDiameters.reduce((prev, curr) =>
    Math.abs(curr - equipment.wireDiameter) < Math.abs(prev - equipment.wireDiameter) ? curr : prev
  );
  const rangeKey = String(nearestD);
  const [cMin, cRec, cMax] = processRanges[rangeKey] ?? [100, 150, 200];

  // Clamp to machine limits
  const current: ParameterRange = {
    min: Math.min(cMin, equipment.maxCurrent),
    recommended: Math.min(cRec, equipment.maxCurrent),
    max: Math.min(cMax, equipment.maxCurrent),
  };

  const voltage = calcVoltage(equipment.process, current.recommended);
  // Clamp voltage to machine limits
  voltage.max = Math.min(voltage.max, equipment.maxVoltage);
  voltage.recommended = Math.min(voltage.recommended, equipment.maxVoltage);

  const hiLimits = HEAT_INPUT_LIMITS[material.type] ?? { min: 0.5, max: 3.5 };
  const targetHI = (hiLimits.min + hiLimits.max) / 2;

  const tsRec = calcTravelSpeed(current.recommended, voltage.recommended, targetHI, equipment.process);
  const tsMin = calcTravelSpeed(current.recommended, voltage.recommended, hiLimits.max, equipment.process);
  const tsMax = calcTravelSpeed(current.recommended, voltage.recommended, hiLimits.min, equipment.process);

  const heatInput = calcHeatInput(current.recommended, voltage.recommended, tsRec, equipment.process);
  let heatInputStatus: HeatInputStatus = 'ok';
  if (heatInput > hiLimits.max) heatInputStatus = 'too_high';
  else if (heatInput < hiLimits.min) heatInputStatus = 'too_low';

  return {
    current,
    voltage,
    travelSpeed: { min: Math.max(50, tsMin), recommended: tsRec, max: Math.min(1000, tsMax) },
    wireFeedSpeed: calcWireFeedSpeed(equipment.process, current.recommended, equipment.wireDiameter),
    arcEnergy: Math.round(heatInput * 100) / 100,
    heatInput: Math.round(heatInput * 100) / 100,
    heatInputStatus,
    heatInputLimit: hiLimits,
    passCount: estimatePassCount(joint, material, equipment.wireDiameter),
    depositRate: calcDepositRate(equipment.process, current.recommended, equipment.wireDiameter),
  };
}

// ──────────────────────────────────────────────────────────────
// Preheat calculation
// ──────────────────────────────────────────────────────────────
export function calculatePreheat(material: MaterialInput): PreheatResult {
  const grade = getGradeById(material.gradeId);
  const t = material.thickness;

  if (!grade) {
    return { preheatMin: 10, interpassMin: 10, interpassMax: 250, ceIIW: 0, cet: 0, method: 'Default' };
  }

  const ceIIW = grade.ceIIW;
  const cet = grade.cet;

  if (material.type === 'stainless_austenitic') {
    return {
      preheatMin: 10,
      interpassMin: 10,
      interpassMax: INTERPASS_MAX.stainless_austenitic,
      ceIIW: 0, cet: 0,
      method: 'Austenitic SS: No preheat required (control interpass temp)'
    };
  }
  if (material.type === 'aluminum') {
    return {
      preheatMin: t > 12 ? 60 : 10,
      interpassMin: 10,
      interpassMax: INTERPASS_MAX.aluminum,
      ceIIW: 0, cet: 0,
      method: 'Aluminum: Warm only if thickness > 12mm'
    };
  }

  // AWS D1.1 lookup
  let pNumberKey: string;
  if (grade.pNumber === '11A') {
    pNumberKey = '11A';
  } else {
    if (ceIIW <= 0.40) pNumberKey = '1_low_ce';
    else if (ceIIW <= 0.45) pNumberKey = '1_med_ce';
    else pNumberKey = '1_high_ce';
  }

  const entries = AWS_D1_1_PREHEAT.filter(e => e.pNumber === pNumberKey);
  const entry = entries.find(e => t <= e.thicknessMax) ?? entries[entries.length - 1];
  const preheatMin = entry?.preheatMin ?? 10;

  return {
    preheatMin,
    interpassMin: preheatMin,
    interpassMax: INTERPASS_MAX[material.type] ?? 250,
    ceIIW,
    cet,
    method: `AWS D1.1 Table 3.2 (P-No: ${pNumberKey}, t=${t}mm, CE_IIW=${ceIIW.toFixed(2)})`
  };
}
