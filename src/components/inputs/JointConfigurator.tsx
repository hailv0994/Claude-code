import { useWeldingStore } from '../../store/weldingStore';
import type { JointType, GrooveType, WeldPosition } from '../../types';
import { JointPreviewSVG } from '../outputs/JointPreviewSVG';

const JOINT_TYPES: { id: JointType; label: string; emoji: string }[] = [
  { id: 'butt', label: 'Mối hàn giáp mép (Butt)', emoji: '═' },
  { id: 'fillet', label: 'Mối hàn góc (Fillet)', emoji: '⌐' },
  { id: 'T_joint', label: 'Mối hàn chữ T (T-Joint)', emoji: '┴' },
  { id: 'corner', label: 'Mối hàn góc mép (Corner)', emoji: '┐' },
  { id: 'lap', label: 'Mối hàn chồng (Lap)', emoji: '▬' },
];

const GROOVE_TYPES: { id: GrooveType; label: string }[] = [
  { id: 'V', label: 'V-Groove' },
  { id: 'bevel', label: 'Bevel' },
  { id: 'U', label: 'U-Groove' },
  { id: 'J', label: 'J-Groove' },
  { id: 'square', label: 'Square (Vuông)' },
];

const POSITIONS: WeldPosition[] = ['1G', '2G', '3G', '4G', '1F', '2F', '3F', '4F'];
const BACKING: { id: string; label: string }[] = [
  { id: 'none', label: 'Không có (None)' },
  { id: 'steel', label: 'Thanh lót thép (Steel)' },
  { id: 'ceramic', label: 'Gốm (Ceramic)' },
  { id: 'flux', label: 'Flux' },
  { id: 'gas', label: 'Khí bảo vệ lưng (Back-purge)' },
];

export function JointConfigurator() {
  const { joint, setJoint } = useWeldingStore();

  const isFillet = joint.type === 'fillet' || joint.type === 'T_joint' || joint.type === 'lap';

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Kiểu mối ghép</label>
        <div className="grid grid-cols-1 gap-1.5">
          {JOINT_TYPES.map(jt => (
            <button
              key={jt.id}
              onClick={() => setJoint({ type: jt.id })}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors
                ${joint.type === jt.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
            >
              <span className="font-mono mr-2">{jt.emoji}</span>{jt.label}
            </button>
          ))}
        </div>
      </div>

      {!isFillet && (
        <>
          <div>
            <label className="label">Kiểu rãnh hàn (Groove)</label>
            <select className="select-field" value={joint.grooveType}
              onChange={e => setJoint({ grooveType: e.target.value as GrooveType })}>
              {GROOVE_TYPES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          {(joint.grooveType === 'V' || joint.grooveType === 'bevel' || joint.grooveType === 'U' || joint.grooveType === 'J') && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Góc rãnh (°)</label>
                <input type="number" className="input-field" value={joint.grooveAngle}
                  min={20} max={90} step={5}
                  onChange={e => setJoint({ grooveAngle: +e.target.value })} />
              </div>
              <div>
                <label className="label">Root Gap (mm)</label>
                <input type="number" className="input-field" value={joint.rootOpening}
                  min={0} max={10} step={0.5}
                  onChange={e => setJoint({ rootOpening: +e.target.value })} />
              </div>
              <div>
                <label className="label">Root Face (mm)</label>
                <input type="number" className="input-field" value={joint.rootFace}
                  min={0} max={8} step={0.5}
                  onChange={e => setJoint({ rootFace: +e.target.value })} />
              </div>
            </div>
          )}
          <div>
            <label className="label">Vật liệu lót lưng (Backing)</label>
            <select className="select-field" value={joint.backingType}
              onChange={e => setJoint({ backingType: e.target.value as typeof joint.backingType })}>
              {BACKING.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
        </>
      )}

      {isFillet && (
        <div>
          <label className="label">Chiều dài cạnh góc vuông (Fillet size, mm)</label>
          <input type="number" className="input-field" value={joint.filletSize}
            min={2} max={50} step={1}
            onChange={e => setJoint({ filletSize: +e.target.value })} />
        </div>
      )}

      <div>
        <label className="label">Tư thế hàn (Position)</label>
        <div className="grid grid-cols-4 gap-1">
          {POSITIONS.map(p => (
            <button key={p} onClick={() => setJoint({ position: p })}
              className={`py-1.5 rounded text-xs font-mono font-bold transition-colors
                ${joint.position === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <JointPreviewSVG joint={joint} />
    </div>
  );
}
