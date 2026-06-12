interface Props {
  passCount: number;
  thickness: number;
}

export function PassSequenceSVG({ passCount }: Props) {
  const W = 220, H = 110;
  const cx = W / 2, cy = H / 2;
  const plateH = 25;

  // Generate pass positions in a V-groove
  const passes: { x: number; y: number; r: number; n: number }[] = [];

  if (passCount === 1) {
    passes.push({ x: cx, y: cy - plateH / 2 - 8, r: 14, n: 1 });
  } else if (passCount === 2) {
    passes.push({ x: cx, y: cy - plateH / 2 - 8, r: 10, n: 1 });
    passes.push({ x: cx, y: cy - plateH / 2 - 22, r: 14, n: 2 });
  } else if (passCount === 3) {
    passes.push({ x: cx, y: cy - plateH / 2 - 8, r: 8, n: 1 });
    passes.push({ x: cx - 10, y: cy - plateH / 2 - 20, r: 9, n: 2 });
    passes.push({ x: cx + 10, y: cy - plateH / 2 - 20, r: 9, n: 3 });
  } else {
    // Generic: root + fill row + cap
    passes.push({ x: cx, y: cy - plateH / 2 - 7, r: 7, n: 1 }); // root
    const fillCount = passCount - 2;
    const fillSpacing = Math.min(14, 50 / Math.max(fillCount, 1));
    const startX = cx - (fillCount - 1) * fillSpacing / 2;
    for (let i = 0; i < fillCount; i++) {
      passes.push({ x: startX + i * fillSpacing, y: cy - plateH / 2 - 19, r: 7, n: i + 2 });
    }
    // cap
    passes.push({ x: cx, y: cy - plateH / 2 - 31, r: 9, n: passCount });
  }

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="max-h-28">
        {/* Bottom plate */}
        <rect x={30} y={cy} width={W - 60} height={plateH} fill="#94a3b8" rx="2" />
        {/* Groove outline */}
        <polygon
          points={`${cx - 40},${cy} ${cx + 40},${cy} ${cx + 15},${cy - plateH - 15} ${cx - 15},${cy - plateH - 15}`}
          fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
        />
        {/* Passes */}
        {passes.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={colors[i % colors.length]} opacity="0.85" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
              {p.n}
            </text>
          </g>
        ))}
        {/* Labels */}
        <text x={cx} y={H - 4} textAnchor="middle" fontSize="9" fill="#6b7280">
          {passCount} lớp hàn ước tính
        </text>
      </svg>
      <div className="flex flex-wrap gap-2 mt-1">
        {passCount >= 1 && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">①Root pass</span>}
        {passCount >= 3 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Fill passes</span>}
        {passCount >= 2 && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Cap pass</span>}
      </div>
    </div>
  );
}
