import { create } from 'zustand';

export type WorkflowStep = 'upload' | 'confirm' | 'machine' | 'model3d' | 'simulate' | 'results';

export interface DrawingAnalysis {
  material: {
    grade: string;
    type: string;
    thickness_mm: number;
    confidence: string;
  } | null;
  joint: {
    type: string;
    groove_type: string;
    groove_angle_deg: number;
    root_opening_mm: number;
    root_face_mm: number;
    fillet_size_mm: number | null;
    position: string;
    backing: string;
  } | null;
  welding_symbol: {
    process_code: string;
    process_name: string;
    weld_size_mm: number | null;
  } | null;
  dimensions: {
    part_width_mm: number | null;
    part_length_mm: number | null;
    other_notes: string;
  };
  quality_requirements: {
    standard: string;
    acceptance_level: string;
    inspection: string[];
  } | null;
  description: string;
  warnings: string[];
}

export interface MachineSpecs {
  process: string;
  maxCurrent: number;
  maxVoltage: number;
  wireDiameter: number;
  shieldingGas: string;
  machineModel: string;
}

export interface FEMResult {
  T_peak: number[][];
  zones: {
    fusion: boolean[][];
    haz_high: boolean[][];
    haz_low: boolean[][];
    base_metal: boolean[][];
  };
  metrics: {
    haz_width_mm: number;
    fusion_width_mm: number;
    fusion_depth_mm: number;
    peak_temp_C: number;
    t85_seconds: number | null;
    cooling_curve: { time: number[]; temp: number[] };
  };
  grid: { nx: number; ny: number; width_mm: number; thickness_mm: number };
}

export interface OptimalParams {
  current: number;
  voltage: number;
  travel_speed: number;
  heat_input_kJ_mm: number;
}

interface AppState {
  apiKey: string;
  step: WorkflowStep;
  componentFiles: File[];
  assemblyFile: File | null;
  userHint: string;
  analysis: DrawingAnalysis | null;
  machine: MachineSpecs;
  qualityTargets: {
    haz_width_max: number;
    fusion_depth_min: number;
    peak_temp_max: number;
  };
  femResult: FEMResult | null;
  optimalParams: OptimalParams | null;
  isLoading: boolean;
  loadingMsg: string;
  error: string | null;

  setApiKey: (k: string) => void;
  setStep: (s: WorkflowStep) => void;
  addComponentFile: (f: File) => void;
  removeComponentFile: (i: number) => void;
  setAssemblyFile: (f: File | null) => void;
  setUserHint: (h: string) => void;
  setAnalysis: (a: DrawingAnalysis) => void;
  patchAnalysis: (patch: Partial<DrawingAnalysis>) => void;
  setMachine: (m: Partial<MachineSpecs>) => void;
  setQualityTargets: (t: Partial<AppState['qualityTargets']>) => void;
  setFEMResult: (r: FEMResult) => void;
  setOptimalParams: (p: OptimalParams) => void;
  setLoading: (loading: boolean, msg?: string) => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key') || '',
  step: 'upload',
  componentFiles: [],
  assemblyFile: null,
  userHint: '',
  analysis: null,
  machine: {
    process: 'GMAW',
    maxCurrent: 350,
    maxVoltage: 44,
    wireDiameter: 1.2,
    shieldingGas: '75%Ar/25%CO₂',
    machineModel: '',
  },
  qualityTargets: {
    haz_width_max: 8,
    fusion_depth_min: 4,
    peak_temp_max: 1600,
  },
  femResult: null,
  optimalParams: null,
  isLoading: false,
  loadingMsg: '',
  error: null,

  setApiKey: (k) => { localStorage.setItem('gemini_api_key', k); set({ apiKey: k }); },
  setStep: (s) => set({ step: s }),
  addComponentFile: (f) => set((st) => ({ componentFiles: [...st.componentFiles, f] })),
  removeComponentFile: (i) => set((st) => ({ componentFiles: st.componentFiles.filter((_, j) => j !== i) })),
  setAssemblyFile: (f) => set({ assemblyFile: f }),
  setUserHint: (h) => set({ userHint: h }),
  setAnalysis: (a) => set({ analysis: a }),
  patchAnalysis: (patch) => set((st) => ({ analysis: st.analysis ? { ...st.analysis, ...patch } : null })),
  setMachine: (m) => set((st) => ({ machine: { ...st.machine, ...m } })),
  setQualityTargets: (t) => set((st) => ({ qualityTargets: { ...st.qualityTargets, ...t } })),
  setFEMResult: (r) => set({ femResult: r }),
  setOptimalParams: (p) => set({ optimalParams: p }),
  setLoading: (loading, msg = '') => set({ isLoading: loading, loadingMsg: msg }),
  setError: (e) => set({ error: e }),
}));

