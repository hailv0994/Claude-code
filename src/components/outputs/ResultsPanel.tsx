import { useWeldingStore } from '../../store/weldingStore';
import { PassSequenceSVG } from './PassSequenceSVG';
import { Thermometer, Zap, Layers, ClipboardCheck, AlertTriangle, CheckCircle } from 'lucide-react';

function RangeBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="mt-1 h-1.5 bg-gray-200 rounded-full">
      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ParamBlock({ label, rec, min, max, unit }: {
  label: string; rec: number; min: number; max: number; unit: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-black text-gray-900 mt-0.5">
        {rec}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-gray-400">Dải: {min} – {max} {unit}</div>
      <RangeBar value={rec} min={min} max={max} />
    </div>
  );
}

export function ResultsPanel() {
  const { results, preheat, quality, material, equipment, calculate } = useWeldingStore();

  const hiPct = results
    ? Math.min(100, (results.heatInput / results.heatInputLimit.max) * 100)
    : 0;

  const hiColor = results?.heatInputStatus === 'ok' ? 'bg-green-500'
    : results?.heatInputStatus === 'too_high' ? 'bg-red-500' : 'bg-amber-500';

  const statusBadge = (status: string) => {
    if (status === 'ok') return <span className="status-ok">OK</span>;
    if (status === 'too_high') return <span className="status-error">Quá cao</span>;
    return <span className="status-warn">Quá thấp</span>;
  };

  const checklist = [
    'Kiểm tra ngoại quan trước hàn (Pre-weld VT)',
    `Xác nhận nhiệt độ nung sơ bộ ≥ ${preheat?.preheatMin ?? '—'}°C`,
    'Kiểm tra chuẩn bị mối hàn (fit-up, khe hở, góc vát)',
    'Xác nhận thông số máy hàn trước khi bắt đầu',
    `Kiểm tra nhiệt độ giữa các lớp ≤ ${preheat?.interpassMax ?? '—'}°C`,
    ...(quality.testMethods.includes('VT') ? ['Kiểm tra ngoại quan sau hàn (Post-weld VT)'] : []),
    ...(quality.testMethods.includes('UT') ? ['Kiểm tra siêu âm (UT)'] : []),
    ...(quality.testMethods.includes('RT') ? ['Chụp phim X-quang (RT)'] : []),
    ...(quality.testMethods.includes('MT') ? ['Kiểm tra từ tính (MT)'] : []),
    ...(quality.testMethods.includes('PT') ? ['Kiểm tra thấm (PT)'] : []),
    ...(quality.pwhtRequired ? ['Thực hiện xử lý nhiệt sau hàn (PWHT)'] : []),
    ...(quality.cvnRequired ? [`Lưu mẫu để thử Charpy tại ${quality.cvnTemp}°C`] : []),
  ];

  return (
    <div className="space-y-4 print-full">
      {/* Calculate button */}
      <button onClick={calculate} className="btn-primary w-full py-3 text-base no-print">
        Tính toán điều kiện hàn
      </button>

      {!results && (
        <div className="card text-center py-8 text-gray-400">
          <Zap size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nhập thông số và nhấn "Tính toán" để xem kết quả</p>
        </div>
      )}

      {results && (
        <>
          {/* Main Parameters */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Thông số hàn</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <ParamBlock label="Dòng điện hàn" rec={results.current.recommended}
                min={results.current.min} max={results.current.max} unit="A" />
              <ParamBlock label="Điện áp hàn" rec={results.voltage.recommended}
                min={results.voltage.min} max={results.voltage.max} unit="V" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ParamBlock label="Tốc độ hàn" rec={results.travelSpeed.recommended}
                min={results.travelSpeed.min} max={results.travelSpeed.max} unit="mm/min" />
              {results.wireFeedSpeed ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">Tốc độ cấp dây</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">
                    {results.wireFeedSpeed}<span className="text-sm font-normal text-gray-400 ml-1">mm/min</span>
                  </div>
                  {results.depositRate && (
                    <div className="text-xs text-gray-400 mt-1">Năng suất đắp: {results.depositRate} kg/h</div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">Số lớp hàn ước tính</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{results.passCount}</div>
                  <div className="text-xs text-gray-400 mt-1">lớp / lượt hàn</div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="param-row">
                <span className="param-label">Quá trình hàn</span>
                <span className="param-value">{equipment.process}</span>
              </div>
              {equipment.shieldingGas && equipment.shieldingGas !== 'N/A' && (
                <div className="param-row">
                  <span className="param-label">Khí bảo vệ</span>
                  <span className="param-value text-xs">{equipment.shieldingGas}</span>
                </div>
              )}
              <div className="param-row">
                <span className="param-label">Cực tính</span>
                <span className="param-value">{equipment.polarity}</span>
              </div>
              <div className="param-row">
                <span className="param-label">Đường kính dây</span>
                <span className="param-value">Ø{equipment.wireDiameter} mm</span>
              </div>
              {results.passCount > 1 && (
                <div className="param-row">
                  <span className="param-label">Số lớp hàn ước tính</span>
                  <span className="param-value">{results.passCount} lớp</span>
                </div>
              )}
            </div>
          </div>

          {/* Heat Input */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Năng lượng đường (Heat Input)</h3>
              </div>
              {statusBadge(results.heatInputStatus)}
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {results.heatInput.toFixed(2)}
              <span className="text-base font-normal text-gray-400 ml-1">kJ/mm</span>
            </div>
            <div className="text-xs text-gray-400 mb-2">
              Giới hạn: {results.heatInputLimit.min} – {results.heatInputLimit.max} kJ/mm ({material.type.replace(/_/g, ' ')})
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className={`h-2 rounded-full transition-all ${hiColor}`} style={{ width: `${hiPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{results.heatInputLimit.min}</span>
              <span>{results.heatInputLimit.max} kJ/mm</span>
            </div>
          </div>

          {/* Preheat */}
          {preheat && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Nhiệt độ nung sơ bộ & giữa lớp</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-red-50 rounded-lg p-2">
                  <div className="text-xs text-red-500 font-medium">Nung sơ bộ (min)</div>
                  <div className="text-xl font-black text-red-700">{preheat.preheatMin}°C</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="text-xs text-orange-500 font-medium">Giữa lớp (min)</div>
                  <div className="text-xl font-black text-orange-700">{preheat.interpassMin}°C</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xs text-blue-500 font-medium">Giữa lớp (max)</div>
                  <div className="text-xl font-black text-blue-700">{preheat.interpassMax}°C</div>
                </div>
              </div>
              {preheat.ceIIW > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <span className="font-medium">CE_IIW = {preheat.ceIIW.toFixed(2)}</span>
                  {preheat.cet > 0 && <span> · CET = {preheat.cet.toFixed(2)}</span>}
                  <br /><span className="text-gray-400">{preheat.method}</span>
                </div>
              )}
              {!preheat.ceIIW && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded p-2">{preheat.method}</div>
              )}
            </div>
          )}

          {/* Pass Sequence */}
          {results.passCount > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-purple-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Trình tự lớp hàn</h3>
              </div>
              <PassSequenceSVG passCount={results.passCount} thickness={20} />
            </div>
          )}

          {/* Quality Checklist */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck size={16} className="text-green-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Danh sách kiểm tra chất lượng</h3>
            </div>
            <div className="space-y-1.5">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
