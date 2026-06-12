import { useWeldingStore } from '../../store/weldingStore';
import type { WeldStandard, AcceptanceLevel } from '../../types';

const STANDARDS: { id: WeldStandard; label: string }[] = [
  { id: 'AWS_D1.1', label: 'AWS D1.1 (Structural Steel)' },
  { id: 'AWS_D1.2', label: 'AWS D1.2 (Aluminum)' },
  { id: 'ISO_5817', label: 'ISO 5817 (Steel)' },
  { id: 'ASME_IX', label: 'ASME Section IX (Pressure Vessel)' },
];

const TEST_METHODS = [
  { id: 'VT', label: 'VT - Kiểm tra ngoại quan' },
  { id: 'MT', label: 'MT - Từ tính' },
  { id: 'PT', label: 'PT - Thấm mao dẫn' },
  { id: 'UT', label: 'UT - Siêu âm' },
  { id: 'RT', label: 'RT - Chụp phim X-quang' },
] as const;

export function QualityRequirementsPanel() {
  const { quality, setQuality } = useWeldingStore();

  const toggleTest = (method: 'VT' | 'MT' | 'PT' | 'UT' | 'RT') => {
    const current = quality.testMethods;
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setQuality({ testMethods: updated });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Tiêu chuẩn áp dụng</label>
        <select className="select-field" value={quality.standard}
          onChange={e => setQuality({ standard: e.target.value as WeldStandard })}>
          {STANDARDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Mức chất lượng (Acceptance Level)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['B', 'C', 'D'] as AcceptanceLevel[]).map(level => (
            <button key={level} onClick={() => setQuality({ acceptanceLevel: level })}
              className={`py-2 rounded-lg text-sm font-bold transition-colors border
                ${quality.acceptanceLevel === level
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              Mức {level}
              {level === 'B' && <span className="block text-xs font-normal opacity-75">Khắt khe nhất</span>}
              {level === 'C' && <span className="block text-xs font-normal opacity-75">Trung bình</span>}
              {level === 'D' && <span className="block text-xs font-normal opacity-75">Cơ bản</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Phương pháp kiểm tra (NDT)</label>
        <div className="space-y-1.5">
          {TEST_METHODS.map(tm => (
            <label key={tm.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
              <input type="checkbox"
                className="rounded text-blue-600 w-4 h-4"
                checked={quality.testMethods.includes(tm.id)}
                onChange={() => toggleTest(tm.id)} />
              <span className="font-medium">{tm.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded text-blue-600 w-4 h-4"
            checked={quality.cvnRequired}
            onChange={e => setQuality({ cvnRequired: e.target.checked })} />
          <span className="font-medium">Yêu cầu thử va đập Charpy (CVN)</span>
        </label>
        {quality.cvnRequired && (
          <div className="ml-6">
            <label className="label">Nhiệt độ thử Charpy (°C)</label>
            <input type="number" className="input-field" value={quality.cvnTemp}
              min={-80} max={30} step={5}
              onChange={e => setQuality({ cvnTemp: +e.target.value })} />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded text-blue-600 w-4 h-4"
            checked={quality.pwhtRequired}
            onChange={e => setQuality({ pwhtRequired: e.target.checked })} />
          <span className="font-medium">Yêu cầu xử lý nhiệt sau hàn (PWHT)</span>
        </label>
      </div>
    </div>
  );
}
