import { create } from 'zustand';
import type {
  MaterialInput, JointInput, QualityRequirements, EquipmentInput,
  WeldingParameters, PreheatResult, UploadedFile,
} from '../types';
import { calculateWeldingParameters, calculatePreheat } from '../engine/calculations';

interface WeldingState {
  step: number;
  material: MaterialInput;
  joint: JointInput;
  quality: QualityRequirements;
  equipment: EquipmentInput;
  componentFiles: UploadedFile[];
  assemblyFile: UploadedFile | null;
  results: WeldingParameters | null;
  preheat: PreheatResult | null;

  setStep: (s: number) => void;
  setMaterial: (m: Partial<MaterialInput>) => void;
  setJoint: (j: Partial<JointInput>) => void;
  setQuality: (q: Partial<QualityRequirements>) => void;
  setEquipment: (e: Partial<EquipmentInput>) => void;
  addComponentFile: (f: UploadedFile) => void;
  removeComponentFile: (index: number) => void;
  setAssemblyFile: (f: UploadedFile | null) => void;
  calculate: () => void;
}

const defaultMaterial: MaterialInput = {
  type: 'carbon_steel',
  gradeId: 'A36',
  thickness: 12,
};

const defaultJoint: JointInput = {
  type: 'butt',
  grooveType: 'V',
  grooveAngle: 60,
  rootOpening: 2,
  rootFace: 2,
  backingType: 'none',
  position: '1G',
  filletSize: 6,
};

const defaultQuality: QualityRequirements = {
  standard: 'AWS_D1.1',
  acceptanceLevel: 'B',
  testMethods: ['VT'],
  cvnRequired: false,
  cvnTemp: -20,
  pwhtRequired: false,
};

const defaultEquipment: EquipmentInput = {
  process: 'GMAW',
  maxCurrent: 350,
  maxVoltage: 44,
  wireId: 'ER70S6',
  wireDiameter: 1.2,
  shieldingGas: '75%Ar/25%CO₂ (C25)',
  polarity: 'DCEP',
  machineModel: '',
};

export const useWeldingStore = create<WeldingState>((set, get) => ({
  step: 1,
  material: defaultMaterial,
  joint: defaultJoint,
  quality: defaultQuality,
  equipment: defaultEquipment,
  componentFiles: [],
  assemblyFile: null,
  results: null,
  preheat: null,

  setStep: (s) => set({ step: s }),

  setMaterial: (m) => set((state) => ({
    material: { ...state.material, ...m },
    results: null,
  })),

  setJoint: (j) => set((state) => ({
    joint: { ...state.joint, ...j },
    results: null,
  })),

  setQuality: (q) => set((state) => ({
    quality: { ...state.quality, ...q },
  })),

  setEquipment: (e) => set((state) => ({
    equipment: { ...state.equipment, ...e },
    results: null,
  })),

  addComponentFile: (f) => set((state) => ({ componentFiles: [...state.componentFiles, f] })),
  removeComponentFile: (index) => set((state) => ({
    componentFiles: state.componentFiles.filter((_, i) => i !== index),
  })),
  setAssemblyFile: (f) => set({ assemblyFile: f }),

  calculate: () => {
    const { material, joint, equipment } = get();
    const results = calculateWeldingParameters(material, joint, equipment);
    const preheat = calculatePreheat(material);
    set({ results, preheat });
  },
}));
