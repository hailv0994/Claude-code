import { useRef, useEffect } from 'react';
import type { FEMResult } from '../../store/appStore';

interface Props {
  result: FEMResult;
}

const ZONE_COLORS = {
  fusion: '#ef4444',
  haz_high: '#f97316',
  haz_low: '#facc15',
  base_metal: '#60a5fa',
};

export default function HAZCrossSection({ result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nx, ny, width_mm, thickness_mm } = result.grid;
    const W = canvas.width;
    const H = canvas.height;
    const cellW = W / nx;
    const cellH = H / ny;

    ctx.clearRect(0, 0, W, H);

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let color = ZONE_COLORS.base_metal;
        if (result.zones.fusion[j]?.[i]) color = ZONE_COLORS.fusion;
        else if (result.zones.haz_high[j]?.[i]) color = ZONE_COLORS.haz_high;
        else if (result.zones.haz_low[j]?.[i]) color = ZONE_COLORS.haz_low;

        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(i * cellW), Math.floor(j * cellH), Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }

    // Top label
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${width_mm}mm × ${thickness_mm}mm`, 6, 14);
  }, [result]);

  const metrics = result.metrics;

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={480}
        height={180}
        className="w-full rounded-lg border"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(ZONE_COLORS) as [string, string][]).map(([zone, color]) => (
          <div key={zone} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-gray-600 capitalize">{zone.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'HAZ Width', value: `${metrics.haz_width_mm.toFixed(1)} mm` },
          { label: 'Fusion Width', value: `${metrics.fusion_width_mm.toFixed(1)} mm` },
          { label: 'Fusion Depth', value: `${metrics.fusion_depth_mm.toFixed(1)} mm` },
          { label: 'Peak Temp', value: `${metrics.peak_temp_C.toFixed(0)} °C` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
