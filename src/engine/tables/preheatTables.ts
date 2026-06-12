// AWS D1.1 Table 3.2 — Minimum Preheat and Interpass Temperatures
// Simplified lookup by P-Number and thickness band

export interface PreheatEntry {
  pNumber: string;
  thicknessMax: number; // mm, upper bound of this band
  preheatMin: number;   // °C
}

export const AWS_D1_1_PREHEAT: PreheatEntry[] = [
  // P1 - Carbon Steel (CE ≤ 0.40)
  { pNumber: '1_low_ce', thicknessMax: 19,  preheatMin: 10 },
  { pNumber: '1_low_ce', thicknessMax: 38,  preheatMin: 66 },
  { pNumber: '1_low_ce', thicknessMax: 64,  preheatMin: 107 },
  { pNumber: '1_low_ce', thicknessMax: 999, preheatMin: 150 },
  // P1 - Carbon Steel (CE 0.40–0.45)
  { pNumber: '1_med_ce', thicknessMax: 19,  preheatMin: 66 },
  { pNumber: '1_med_ce', thicknessMax: 38,  preheatMin: 107 },
  { pNumber: '1_med_ce', thicknessMax: 64,  preheatMin: 150 },
  { pNumber: '1_med_ce', thicknessMax: 999, preheatMin: 204 },
  // P1 - Carbon Steel (CE > 0.45)
  { pNumber: '1_high_ce', thicknessMax: 19,  preheatMin: 107 },
  { pNumber: '1_high_ce', thicknessMax: 38,  preheatMin: 150 },
  { pNumber: '1_high_ce', thicknessMax: 64,  preheatMin: 204 },
  { pNumber: '1_high_ce', thicknessMax: 999, preheatMin: 260 },
  // P11A - Low Alloy High Strength
  { pNumber: '11A', thicknessMax: 19,  preheatMin: 121 },
  { pNumber: '11A', thicknessMax: 38,  preheatMin: 150 },
  { pNumber: '11A', thicknessMax: 64,  preheatMin: 204 },
  { pNumber: '11A', thicknessMax: 999, preheatMin: 260 },
];

export const INTERPASS_MAX: Record<string, number> = {
  carbon_steel: 250,
  low_alloy: 200,
  stainless_austenitic: 175,
  aluminum: 120,
};

export const HEAT_INPUT_LIMITS: Record<string, { min: number; max: number }> = {
  carbon_steel: { min: 0.5, max: 3.5 },
  low_alloy: { min: 0.3, max: 2.0 },
  stainless_austenitic: { min: 0.3, max: 2.0 },
  aluminum: { min: 0.2, max: 2.5 },
};
