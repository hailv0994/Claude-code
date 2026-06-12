import { THERMAL_PROPS } from './thermalProps';
import type { ThermalProps } from './thermalProps';

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

function goldakSource(
  X: number[][], Y: number[][],
  xc: number, yc: number,
  af: number, ar: number, b: number, c: number,
  Q: number, // W
): number[][] {
  const ny = X.length, nx = X[0].length;
  const q: number[][] = Array.from({ length: ny }, () => new Array(nx).fill(0));
  const ff = 0.6, fr = 1.4;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const dx = X[j][i] - xc;
      const dy = Y[j][i] - yc;
      if (dx >= 0) {
        q[j][i] = (6 * Math.sqrt(3) * ff * Q) / (af * b * c * Math.PI * Math.sqrt(Math.PI)) *
          Math.exp(-3 * dx * dx / (af * af) - 3 * dy * dy / (b * b) - 3 * dy * dy / (c * c));
      } else {
        q[j][i] = (6 * Math.sqrt(3) * fr * Q) / (ar * b * c * Math.PI * Math.sqrt(Math.PI)) *
          Math.exp(-3 * dx * dx / (ar * ar) - 3 * dy * dy / (b * b) - 3 * dy * dy / (c * c));
      }
    }
  }
  return q;
}

export function runFEM(
  materialType: string,
  plateWidth: number,   // mm
  plateThickness: number, // mm
  current: number,
  voltage: number,
  travelSpeed: number,  // mm/min
  efficiency: number,
  preheatTemp: number,  // °C
  nx = 60, ny = 40,
  tTotal = 25.0,
): FEMResult {
  const props: ThermalProps = THERMAL_PROPS[materialType] || THERMAL_PROPS.carbon_steel;
  const alpha = props.alpha; // mm²/s

  const dx = plateWidth / (nx - 1);
  const dy = plateThickness / (ny - 1);
  const dtMax = 0.4 * Math.min(dx, dy) ** 2 / (4 * alpha);
  const dt = Math.min(dtMax, 0.5);
  const nSteps = Math.min(Math.ceil(tTotal / dt), 2000);

  // Grid coordinates
  const x: number[][] = Array.from({ length: ny }, () =>
    Array.from({ length: nx }, (_, i) => i * dx));
  const y: number[][] = Array.from({ length: ny }, (_, j) =>
    Array.from({ length: nx }, () => j * dy));

  // Temperature field
  let T: number[][] = Array.from({ length: ny }, () =>
    new Array(nx).fill(preheatTemp));

  const Q = current * voltage * efficiency; // W
  const vSpeed = travelSpeed / 60; // mm/s
  const af = 3.0, ar = 6.0, b = 4.0, c = plateThickness * 0.4;
  const xStart = plateWidth * 0.1;

  // Track peak temperature and cooling at center
  const T_peak: number[][] = T.map(row => [...row]);
  const centerI = Math.floor(nx / 2);
  const centerJ = 0; // top surface
  const coolingTime: number[] = [];
  const coolingTemp: number[] = [];
  let t850start: number | null = null;
  let t800end: number | null = null;

  const kDx2 = props.k / (props.rho * props.cp * 1e-6) / (dx * dx); // 1/s
  const kDy2 = props.k / (props.rho * props.cp * 1e-6) / (dy * dy);
  const rhocp = props.rho * props.cp * 1e-6; // J/(mm³·K)

  for (let step = 0; step < nSteps; step++) {
    const t = step * dt;
    const xc = xStart + vSpeed * t;
    const yc = 0;

    // Heat source (only while arc is on plate)
    let q: number[][] | null = null;
    if (xc <= plateWidth + af) {
      q = goldakSource(x, y, xc, yc, af, ar, b, c, Q);
    }

    const Tnew: number[][] = Array.from({ length: ny }, () => new Array(nx).fill(0));
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const Tij = T[j][i];
        // Laplacian (Neumann BC: zero-flux at boundaries)
        const Tip = i < nx - 1 ? T[j][i + 1] : T[j][i];
        const Tim = i > 0     ? T[j][i - 1] : T[j][i];
        const Tjp = j < ny - 1 ? T[j + 1][i] : T[j][i];
        const Tjm = j > 0     ? T[j - 1][i] : T[j][i];
        const lap = kDx2 * (Tip - 2 * Tij + Tim) + kDy2 * (Tjp - 2 * Tij + Tjm);
        const src = q ? q[j][i] / rhocp : 0;
        Tnew[j][i] = Tij + dt * (lap + src);
      }
    }
    T = Tnew;

    // Update peak
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++)
        if (T[j][i] > T_peak[j][i]) T_peak[j][i] = T[j][i];

    // Cooling curve at center top
    if (step % 5 === 0) {
      coolingTime.push(t);
      coolingTemp.push(T[centerJ][centerI]);
    }
    const Tc = T[centerJ][centerI];
    if (Tc >= 850 && t850start === null) t850start = t;
    if (t850start !== null && t800end === null && Tc <= 500) t800end = t;
  }

  // Zones
  const fusion: boolean[][] = Array.from({ length: ny }, () => new Array(nx).fill(false));
  const haz_high: boolean[][] = Array.from({ length: ny }, () => new Array(nx).fill(false));
  const haz_low: boolean[][] = Array.from({ length: ny }, () => new Array(nx).fill(false));
  const base_metal: boolean[][] = Array.from({ length: ny }, () => new Array(nx).fill(false));

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const tp = T_peak[j][i];
      if (tp >= props.Tsolidus) fusion[j][i] = true;
      else if (tp >= props.T_haz_high) haz_high[j][i] = true;
      else if (tp >= props.T_haz_low) haz_low[j][i] = true;
      else base_metal[j][i] = true;
    }
  }

  // Metrics
  let hazW = 0, fuzW = 0, fuzD = 0;
  // HAZ width at surface (j=0)
  let hazCount = 0, fuzCount = 0;
  for (let i = 0; i < nx; i++) {
    if (fusion[0][i] || haz_high[0][i] || haz_low[0][i]) hazCount++;
    if (fusion[0][i]) fuzCount++;
  }
  hazW = hazCount * dx;
  fuzW = fuzCount * dx;
  // Fusion depth (max j with fusion at center column)
  for (let j = ny - 1; j >= 0; j--) {
    if (fusion[j][centerI]) { fuzD = j * dy; break; }
  }

  const peakTemp = Math.max(...T_peak.flat());
  const t85 = (t850start !== null && t800end !== null) ? t800end - t850start : null;

  return {
    T_peak,
    zones: { fusion, haz_high, haz_low, base_metal },
    metrics: {
      haz_width_mm: hazW,
      fusion_width_mm: fuzW,
      fusion_depth_mm: fuzD,
      peak_temp_C: peakTemp,
      t85_seconds: t85,
      cooling_curve: { time: coolingTime, temp: coolingTemp },
    },
    grid: { nx, ny, width_mm: plateWidth, thickness_mm: plateThickness },
  };
}
