export interface ThermalProps {
  rho: number;   // kg/m³
  cp: number;    // J/kg·K
  k: number;     // W/m·K
  alpha: number; // m²/s
  Tliquidus: number;
  Tsolidus: number;
  T_haz_high: number;
  T_haz_low: number;
}

export const THERMAL_PROPS: Record<string, ThermalProps> = {
  carbon_steel: {
    rho: 7850, cp: 502, k: 51.9,
    alpha: 51.9 / (7850 * 502) * 1e6, // mm²/s
    Tliquidus: 1510, Tsolidus: 1470,
    T_haz_high: 1100, T_haz_low: 723,
  },
  low_alloy: {
    rho: 7850, cp: 502, k: 44.0,
    alpha: 44.0 / (7850 * 502) * 1e6,
    Tliquidus: 1500, Tsolidus: 1450,
    T_haz_high: 1100, T_haz_low: 700,
  },
  stainless_austenitic: {
    rho: 8000, cp: 500, k: 16.3,
    alpha: 16.3 / (8000 * 500) * 1e6,
    Tliquidus: 1450, Tsolidus: 1400,
    T_haz_high: 1200, T_haz_low: 900,
  },
  aluminum: {
    rho: 2700, cp: 900, k: 167.0,
    alpha: 167.0 / (2700 * 900) * 1e6,
    Tliquidus: 660, Tsolidus: 580,
    T_haz_high: 400, T_haz_low: 200,
  },
};
