import type { JointInput } from '../../types';

interface Props { joint: JointInput }

export function JointPreviewSVG({ joint }: Props) {
  const W = 200, H = 120;
  const t = 28; // plate thickness in SVG units

  const renderButtV = () => {
    const cx = W / 2;
    const angle = joint.grooveAngle / 2;
    const rad = (angle * Math.PI) / 180;
    const rootHalf = joint.rootOpening * 1.5;
    const topHalf = rootHalf + (t - joint.rootFace * 1) * Math.tan(rad);

    return (
      <g>
        {/* Bottom plate */}
        <rect x={20} y={H/2 + 2} width={W-40} height={t} fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        {/* Top plate left */}
        <polygon points={`20,${H/2-2} ${cx-rootHalf},${H/2-2} ${cx-topHalf},${H/2-2-t} 20,${H/2-2-t}`}
          fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        {/* Top plate right */}
        <polygon points={`${cx+rootHalf},${H/2-2} ${W-20},${H/2-2} ${W-20},${H/2-2-t} ${cx+topHalf},${H/2-2-t}`}
          fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        {/* Weld fill */}
        <polygon
          points={`${cx-topHalf},${H/2-2-t} ${cx+topHalf},${H/2-2-t} ${cx+rootHalf},${H/2-2} ${cx-rootHalf},${H/2-2}`}
          fill="#f59e0b" opacity="0.7" stroke="#d97706" strokeWidth="1"/>
        {/* Labels */}
        <text x={cx} y={20} textAnchor="middle" fontSize="10" fill="#374151">{joint.grooveAngle}°</text>
        <line x1={cx-topHalf} y1={H/2-2-t+3} x2={cx} y2={18} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2"/>
        <line x1={cx+topHalf} y1={H/2-2-t+3} x2={cx} y2={18} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2,2"/>
      </g>
    );
  };

  const renderFillet = () => {
    const size = joint.filletSize * 3;
    const bx = 20, by = H/2;
    return (
      <g>
        {/* Horizontal plate */}
        <rect x={bx} y={by} width={W-40} height={t} fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        {/* Vertical plate */}
        <rect x={W/2 - t/2} y={by-60} width={t} height={62} fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        {/* Fillet weld triangles */}
        <polygon
          points={`${W/2-t/2},${by} ${W/2-t/2-Math.min(size,40)},${by} ${W/2-t/2},${by-Math.min(size,40)}`}
          fill="#f59e0b" opacity="0.8" stroke="#d97706" strokeWidth="1"/>
        <polygon
          points={`${W/2+t/2},${by} ${W/2+t/2+Math.min(size,40)},${by} ${W/2+t/2},${by-Math.min(size,40)}`}
          fill="#f59e0b" opacity="0.8" stroke="#d97706" strokeWidth="1"/>
        <text x={W/2} y={by+t+14} textAnchor="middle" fontSize="10" fill="#374151">
          a={joint.filletSize}mm
        </text>
      </g>
    );
  };

  const renderSquare = () => {
    const gap = joint.rootOpening * 2;
    return (
      <g>
        <rect x={20} y={H/2 - t - gap/2} width={W-40} height={t} fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        <rect x={20} y={H/2 + gap/2} width={W-40} height={t} fill="#c0c8d8" stroke="#6b7280" strokeWidth="1"/>
        <rect x={20} y={H/2 - gap/2} width={W-40} height={gap || 4} fill="#f59e0b" opacity="0.7" stroke="#d97706" strokeWidth="1"/>
      </g>
    );
  };

  const renderContent = () => {
    if (joint.type === 'fillet' || joint.type === 'T_joint' || joint.type === 'lap') return renderFillet();
    if (joint.grooveType === 'square') return renderSquare();
    return renderButtV();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
      <p className="text-xs text-gray-400 mb-1 text-center">Sơ đồ mặt cắt mối hàn</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="max-h-24">
        {renderContent()}
      </svg>
    </div>
  );
}
