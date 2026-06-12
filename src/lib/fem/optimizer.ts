import { runFEM } from './solver';
import type { FEMResult } from './solver';

export interface OptimalParams {
  current: number;
  voltage: number;
  travel_speed: number;
  heat_input_kJ_mm: number;
}

const VOLTAGE: Record<string, (I: number) => number> = {
  GMAW: I => 0.04 * I + 14,
  SMAW: I => 0.04 * I + 16,
  GTAW: I => 0.02 * I + 10,
  FCAW: I => 0.04 * I + 16,
  SAW:  I => 0.025 * I + 22,
};

const EFFICIENCY: Record<string, number> = {
  GMAW: 0.8, SMAW: 0.8, GTAW: 0.6, FCAW: 0.8, SAW: 1.0,
};

const CURRENT_BOUNDS: Record<string, [number, number]> = {
  GMAW: [80, 400], SMAW: [60, 320], GTAW: [30, 250], FCAW: [100, 450], SAW: [200, 1000],
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Nelder-Mead simplex (2D)
function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  bounds: [number, number][],
  maxIter = 60,
  _xTol = 5,
  fTol = 0.01,
): number[] {
  const n = x0.length;
  // Build initial simplex
  const simplex: number[][] = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const pt = x0.slice();
    pt[i] *= 1.05 + 0.01;
    simplex.push(pt);
  }
  let scores = simplex.map(f);

  for (let iter = 0; iter < maxIter; iter++) {
    // Sort
    const order = scores.map((_s, i) => i).sort((a, b) => scores[a] - scores[b]);
    const best = simplex[order[0]].slice();
    const worst = order[order.length - 1];
    const second = order[order.length - 2];

    if (Math.abs(scores[order[0]] - scores[worst]) < fTol) break;

    // Centroid (exclude worst)
    const cent = new Array(n).fill(0);
    for (let i = 0; i < order.length - 1; i++)
      for (let d = 0; d < n; d++) cent[d] += simplex[order[i]][d];
    for (let d = 0; d < n; d++) cent[d] /= (n);

    // Reflect
    const ref = cent.map((c, d) => clamp(2 * c - simplex[worst][d], bounds[d][0], bounds[d][1]));
    const fRef = f(ref);

    if (fRef < scores[order[0]]) {
      // Expand
      const exp = cent.map((c, d) => clamp(2 * ref[d] - c, bounds[d][0], bounds[d][1]));
      const fExp = f(exp);
      if (fExp < fRef) { simplex[worst] = exp; scores[worst] = fExp; }
      else { simplex[worst] = ref; scores[worst] = fRef; }
    } else if (fRef < scores[second]) {
      simplex[worst] = ref; scores[worst] = fRef;
    } else {
      // Contract
      const con = cent.map((c, d) => clamp(0.5 * (c + simplex[worst][d]), bounds[d][0], bounds[d][1]));
      const fCon = f(con);
      if (fCon < scores[worst]) { simplex[worst] = con; scores[worst] = fCon; }
      else {
        // Shrink
        for (let i = 1; i < simplex.length; i++) {
          simplex[order[i]] = simplex[order[i]].map((v, d) => clamp(best[d] + 0.5 * (v - best[d]), bounds[d][0], bounds[d][1]));
          scores[order[i]] = f(simplex[order[i]]);
        }
      }
    }
  }

  const order = scores.map((_s, i) => i).sort((a, b) => scores[a] - scores[b]);
  return simplex[order[0]];
}

export interface OptimizeOptions {
  materialType: string;
  plateThickness: number;
  plateWidth: number;
  process: string;
  preheatTemp: number;
  maxCurrent?: number;
  targets: {
    haz_width_max: number;
    fusion_depth_min: number;
    peak_temp_max: number;
  };
  onProgress?: (pct: number) => void;
}

export function optimizeParameters(opts: OptimizeOptions): { optimalParams: OptimalParams; femResult: FEMResult } {
  const { materialType, plateThickness, plateWidth, process, preheatTemp, targets } = opts;
  const eff = EFFICIENCY[process] ?? 0.8;
  const voltageFn = VOLTAGE[process] ?? VOLTAGE.GMAW;
  let [iMin, iMax] = CURRENT_BOUNDS[process] ?? [80, 400];
  if (opts.maxCurrent) iMax = Math.min(iMax, opts.maxCurrent);

  let call = 0;

  function objective(params: number[]): number {
    const current = clamp(params[0], iMin, iMax);
    const speed = clamp(params[1], 50, 800);
    const voltage = voltageFn(current);

    const res = runFEM(materialType, plateWidth, plateThickness, current, voltage, speed, eff, preheatTemp, 40, 30, 20);
    const m = res.metrics;

    const pHaz  = Math.max(0, m.haz_width_mm  - targets.haz_width_max)  ** 2 * 10;
    const pFz   = Math.max(0, targets.fusion_depth_min - m.fusion_depth_mm) ** 2 * 20;
    const pPeak = Math.max(0, m.peak_temp_C - targets.peak_temp_max) ** 2 * 0.001;
    const hi = (current * voltage * 60 * eff) / (speed * 1000);
    call++;
    opts.onProgress?.(Math.min(95, call * 2));
    return pHaz + pFz + pPeak + hi * 0.5;
  }

  const x0 = [(iMin + iMax) / 2, 200];
  const bounds: [number, number][] = [[iMin, iMax], [50, 800]];
  const best = nelderMead(objective, x0, bounds, 60, 5, 0.01);

  const bestCurrent = clamp(best[0], iMin, iMax);
  const bestSpeed   = clamp(best[1], 50, 800);
  const bestVoltage = voltageFn(bestCurrent);
  const hi = (bestCurrent * bestVoltage * 60 * eff) / (bestSpeed * 1000);

  const femResult = runFEM(materialType, plateWidth, plateThickness, bestCurrent, bestVoltage, bestSpeed, eff, preheatTemp, 60, 40, 25);

  return {
    optimalParams: {
      current: Math.round(bestCurrent),
      voltage: Math.round(bestVoltage * 10) / 10,
      travel_speed: Math.round(bestSpeed),
      heat_input_kJ_mm: Math.round(hi * 1000) / 1000,
    },
    femResult,
  };
}
