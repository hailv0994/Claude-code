import { useRef, useEffect } from 'react';
import type { FEMResult } from '../../store/appStore';

interface Props {
  result: FEMResult;
}

export default function CoolingCurve({ result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { time, temp } = result.metrics.cooling_curve;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 36, left: 52 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const tMax = Math.max(...time);
    const tempMax = Math.max(...temp);
    const tempMin = Math.min(...temp);

    const tx = (t: number) => pad.left + (t / tMax) * plotW;
    const ty = (t: number) => pad.top + plotH - ((t - tempMin) / (tempMax - tempMin)) * plotH;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // Reference lines
    const refs = [
      { temp: 1500, label: 'Solidus ~1500°C', color: '#ef4444' },
      { temp: 1100, label: 'HAZ high ~1100°C', color: '#f97316' },
      { temp: 723,  label: 'AC3 ~723°C', color: '#facc15' },
    ];
    refs.forEach(({ temp: rt, label, color }) => {
      if (rt >= tempMin && rt <= tempMax) {
        const y = ty(rt);
        ctx.strokeStyle = color;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = '9px sans-serif';
        ctx.fillText(label, pad.left + 4, y - 3);
      }
    });

    // Curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    time.forEach((t, i) => {
      const x = tx(t);
      const y = ty(temp[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axes labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', pad.left + plotW / 2, H - 4);

    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperature (°C)', 0, 0);
    ctx.restore();

    // Tick labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const t = (tMax / 5) * i;
      ctx.fillText(t.toFixed(0), tx(t), pad.top + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const t = tempMin + ((tempMax - tempMin) / 4) * (4 - i);
      ctx.fillText(t.toFixed(0), pad.left - 6, pad.top + (plotH / 4) * i + 4);
    }
  }, [time, temp]);

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} width={500} height={220} className="w-full rounded-lg border" />
      {result.metrics.t85_seconds !== null && (
        <p className="text-xs text-gray-500 text-center">
          t₈/₅ cooling time: <strong>{result.metrics.t85_seconds.toFixed(1)} s</strong>
          {result.metrics.t85_seconds < 5 ? ' — fast cooling (hard HAZ risk)' :
           result.metrics.t85_seconds > 25 ? ' — slow cooling (soft HAZ, good toughness)' :
           ' — moderate cooling rate'}
        </p>
      )}
    </div>
  );
}
