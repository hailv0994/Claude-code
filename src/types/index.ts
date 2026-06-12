export type BaseMetalType = 'carbon_steel' | 'low_alloy' | 'stainless_austenitic' | 'aluminum';
export type WeldingProcess = 'SMAW' | 'GMAW' | 'FCAW' | 'GTAW' | 'SAW';
export type JointType = 'butt' | 'fillet' | 'T_joint' | 'corner' | 'lap';
export type GrooveType = 'V' | 'bevel' | 'U' | 'J' | 'square' | 'none';
export type WeldPosition = '1G' | '2G' | '3G' | '4G' | '1F' | '2F' | '3F' | '4F';
export type WeldStandard = 'AWS_D1.1' | 'AWS_D1.2' | 'ISO_5817' | 'ASME_IX';
export type AcceptanceLevel = 'B' | 'C' | 'D';
export type Polarity = 'DCEP' | 'DCEN' | 'AC';
export type HeatInputStatus = 'ok' | 'too_high' | 'too_low' | 'not_calculated';

export interface MaterialGrade {
  id: string;
  name: string;
  type: BaseMetalType;
  pNumber: string;
  C: number;
  Mn: number;
  Si: number;
  Cr: number;
  Ni: number;
  Mo: number;
  V: number;
  Cu: number;
  ceIIW: number;
  cet: number;
  yieldStrength: number;
  tensileStrength: number;
}

export interface MaterialInput {
  type: BaseMetalType;
  gradeId: string;        // matched grade id OR free-text name
  thickness: number;
  customCE?: number;      // user-supplied CE_IIW when grade not in library
  customFy?: number;      // MPa
  customFu?: number;      // MPa
}

export interface JointInput {
  type: JointType;
  grooveType: GrooveType;
  grooveAngle: number;
  rootOpening: number;
  rootFace: number;
  backingType: 'none' | 'steel' | 'flux' | 'ceramic' | 'gas';
  position: WeldPosition;
  filletSize: number;
}

export interface QualityRequirements {
  standard: WeldStandard;
  acceptanceLevel: AcceptanceLevel;
  testMethods: ('VT' | 'MT' | 'PT' | 'UT' | 'RT')[];
  cvnRequired: boolean;
  cvnTemp: number;
  pwhtRequired: boolean;
}

export interface EquipmentInput {
  process: WeldingProcess;
  maxCurrent: number;
  maxVoltage: number;
  wireId: string;
  wireDiameter: number;
  shieldingGas: string;
  polarity: Polarity;
  machineModel: string;
}

export interface ParameterRange {
  min: number;
  recommended: number;
  max: number;
}

export interface WeldingParameters {
  current: ParameterRange;
  voltage: ParameterRange;
  travelSpeed: ParameterRange;
  wireFeedSpeed: number | null;
  arcEnergy: number;
  heatInput: number;
  heatInputStatus: HeatInputStatus;
  heatInputLimit: { min: number; max: number };
  passCount: number;
  depositRate: number | null;
}

export interface PreheatResult {
  preheatMin: number;
  interpassMin: number;
  interpassMax: number;
  ceIIW: number;
  cet: number;
  method: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}
