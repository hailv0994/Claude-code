import type { WeldingProcess } from '../../types';

export interface WireSpec {
  id: string;
  name: string;
  process: WeldingProcess;
  materialTypes: string[];
  standard: string;
}

export const WIRE_SPECS: WireSpec[] = [
  // SMAW Electrodes
  { id: 'E6013', name: 'E6013', process: 'SMAW', materialTypes: ['carbon_steel'], standard: 'AWS A5.1' },
  { id: 'E7018', name: 'E7018 (Low Hydrogen)', process: 'SMAW', materialTypes: ['carbon_steel', 'low_alloy'], standard: 'AWS A5.1' },
  { id: 'E7016', name: 'E7016 (Low Hydrogen)', process: 'SMAW', materialTypes: ['carbon_steel', 'low_alloy'], standard: 'AWS A5.1' },
  { id: 'E8018', name: 'E8018-B2', process: 'SMAW', materialTypes: ['low_alloy'], standard: 'AWS A5.5' },
  { id: 'E308L', name: 'E308L-16', process: 'SMAW', materialTypes: ['stainless_austenitic'], standard: 'AWS A5.4' },
  { id: 'E316L', name: 'E316L-16', process: 'SMAW', materialTypes: ['stainless_austenitic'], standard: 'AWS A5.4' },
  // GMAW Wires
  { id: 'ER70S6', name: 'ER70S-6', process: 'GMAW', materialTypes: ['carbon_steel', 'low_alloy'], standard: 'AWS A5.18' },
  { id: 'ER70S3', name: 'ER70S-3', process: 'GMAW', materialTypes: ['carbon_steel'], standard: 'AWS A5.18' },
  { id: 'ER80S_D2', name: 'ER80S-D2', process: 'GMAW', materialTypes: ['low_alloy'], standard: 'AWS A5.28' },
  { id: 'ER308L', name: 'ER308L', process: 'GMAW', materialTypes: ['stainless_austenitic'], standard: 'AWS A5.9' },
  { id: 'ER316L', name: 'ER316L', process: 'GMAW', materialTypes: ['stainless_austenitic'], standard: 'AWS A5.9' },
  { id: 'ER4043', name: 'ER4043', process: 'GMAW', materialTypes: ['aluminum'], standard: 'AWS A5.10' },
  { id: 'ER5356', name: 'ER5356', process: 'GMAW', materialTypes: ['aluminum'], standard: 'AWS A5.10' },
  // FCAW
  { id: 'E71T1', name: 'E71T-1C (Gas Shielded)', process: 'FCAW', materialTypes: ['carbon_steel'], standard: 'AWS A5.20' },
  { id: 'E71T8', name: 'E71T-8 (Self Shielded)', process: 'FCAW', materialTypes: ['carbon_steel'], standard: 'AWS A5.20' },
  { id: 'E81T1', name: 'E81T1-Ni1M', process: 'FCAW', materialTypes: ['low_alloy'], standard: 'AWS A5.29' },
  // GTAW
  { id: 'ER70S2', name: 'ER70S-2', process: 'GTAW', materialTypes: ['carbon_steel', 'low_alloy'], standard: 'AWS A5.18' },
  { id: 'ER308L_tig', name: 'ER308L', process: 'GTAW', materialTypes: ['stainless_austenitic'], standard: 'AWS A5.9' },
  { id: 'ER4043_tig', name: 'ER4043', process: 'GTAW', materialTypes: ['aluminum'], standard: 'AWS A5.10' },
  // SAW
  { id: 'EM12K', name: 'EM12K / F7A2', process: 'SAW', materialTypes: ['carbon_steel'], standard: 'AWS A5.17' },
  { id: 'EH14', name: 'EH14 / F7A6', process: 'SAW', materialTypes: ['carbon_steel', 'low_alloy'], standard: 'AWS A5.17' },
];

// Current ranges per wire diameter (A) — [min, recommended, max]
// Key: `${process}_${diameter_mm}`
export const CURRENT_RANGES: Record<string, Record<string, [number, number, number]>> = {
  SMAW: {
    '2.5': [60, 80, 110],
    '3.2': [90, 120, 160],
    '4.0': [130, 165, 210],
    '5.0': [180, 220, 280],
    '6.0': [230, 280, 360],
  },
  GMAW: {
    '0.8': [60, 90, 140],
    '0.9': [80, 130, 180],
    '1.0': [100, 160, 220],
    '1.2': [120, 200, 300],
    '1.4': [160, 250, 380],
    '1.6': [200, 320, 480],
  },
  FCAW: {
    '1.2': [130, 200, 280],
    '1.4': [150, 230, 330],
    '1.6': [180, 260, 380],
    '2.0': [220, 310, 430],
  },
  GTAW: {
    '1.6': [30, 80, 130],
    '2.4': [60, 120, 180],
    '3.2': [100, 160, 250],
    '4.0': [150, 200, 320],
  },
  SAW: {
    '2.0': [200, 350, 500],
    '2.4': [250, 450, 650],
    '3.2': [300, 550, 800],
    '4.0': [400, 700, 1000],
  },
};

export const THERMAL_EFFICIENCY: Record<WeldingProcess, number> = {
  SMAW: 0.80,
  GMAW: 0.80,
  FCAW: 0.80,
  GTAW: 0.60,
  SAW: 1.00,
};

export const DEFAULT_GAS: Record<WeldingProcess, string> = {
  SMAW: 'N/A',
  GMAW: '75%Ar/25%CO₂ (C25)',
  FCAW: '100%CO₂',
  GTAW: '100%Ar',
  SAW: 'N/A (Flux)',
};

export const WIRE_DIAMETERS: Record<WeldingProcess, string[]> = {
  SMAW: ['2.5', '3.2', '4.0', '5.0', '6.0'],
  GMAW: ['0.8', '0.9', '1.0', '1.2', '1.4', '1.6'],
  FCAW: ['1.2', '1.4', '1.6', '2.0'],
  GTAW: ['1.6', '2.4', '3.2', '4.0'],
  SAW: ['2.0', '2.4', '3.2', '4.0'],
};

// Voltage from current formula: V = a * I + b, with spread ±spread
export const VOLTAGE_FORMULA: Record<WeldingProcess, { a: number; b: number; spread: number }> = {
  SMAW: { a: 0.04, b: 16, spread: 2 },
  GMAW: { a: 0.04, b: 14, spread: 2 },
  FCAW: { a: 0.04, b: 16, spread: 2 },
  GTAW: { a: 0.02, b: 10, spread: 2 },
  SAW: { a: 0.025, b: 22, spread: 3 },
};
