import { useState } from 'react';
import { useWeldingStore } from '../../store/weldingStore';
import { MATERIAL_GRADES } from '../../engine/tables/materialGrades';
import type { BaseMetalType } from '../../types';
import { Search, ChevronDown } from 'lucide-react';

const TYPE_LABELS: Record<BaseMetalType, string> = {
  carbon_steel: 'Thép Carbon',
  low_alloy: 'Thép hợp kim thấp',
  stainless_austenitic: 'Thép không gỉ Austenitic',
  aluminum: 'Nhôm',
};

const TYPE_COLORS: Record<BaseMetalType, string> = {
  carbon_steel: 'bg-slate-100 text-slate-700 border-slate-300',
  low_alloy: 'bg-orange-50 text-orange-700 border-orange-300',
  stainless_austenitic: 'bg-blue-50 text-blue-700 border-blue-300',
  aluminum: 'bg-yellow-50 text-yellow-700 border-yellow-300',
};

export function MaterialSelector() {
  const { material, setMaterial } = useWeldingStore();
  const [gradeText, setGradeText] = useState(material.gradeId || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Fuzzy search across all grades
  const suggestions = gradeText.length >= 1
    ? MATERIAL_GRADES.filter(g =>
        g.id.toLowerCase().includes(gradeText.toLowerCase()) ||
        g.name.toLowerCase().includes(gradeText.toLowerCase())
      ).slice(0, 6)
    : [];

  const matchedGrade = MATERIAL_GRADES.find(
    g => g.id.toLowerCase() === gradeText.toLowerCase() ||
         g.name.toLowerCase() === gradeText.toLowerCase()
  );

  const handleGradeInput = (val: string) => {
    setGradeText(val);
    setShowSuggestions(true);
    const found = MATERIAL_GRADES.find(
      g => g.id.toLowerCase() === val.toLowerCase() ||
           g.name.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setMaterial({ gradeId: found.id, type: found.type });
      setShowSuggestions(false);
    } else {
      // Unknown grade — keep gradeId as free text
      setMaterial({ gradeId: val });
    }
  };

  const handleSelect = (id: string) => {
    const grade = MATERIAL_GRADES.find(g => g.id === id)!;
    setGradeText(grade.name);
    setMaterial({ gradeId: grade.id, type: grade.type });
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Material grade free-text input */}
      <div>
        <label className="label">Mác thép / Vật liệu (nhập tự do hoặc chọn)</label>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="input-field pl-8"
            placeholder="VD: SS400, A36, SUS304, SM490, 6061-T6..."
            value={gradeText}
            onChange={e => handleGradeInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {suggestions.length > 0 && showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map(g => (
                <button
                  key={g.id}
                  onMouseDown={() => handleSelect(g.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800">{g.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${TYPE_COLORS[g.type]}`}>
                    {TYPE_LABELS[g.type]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {gradeText && !matchedGrade && (
          <p className="text-xs text-amber-600 mt-1">
            Mác thép chưa có trong thư viện — nhập thông số CE và Fy bên dưới để tính preheat
          </p>
        )}
      </div>

      {/* Material type — only show when grade not auto-detected */}
      {!matchedGrade && gradeText && (
        <div>
          <label className="label">Loại vật liệu</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(TYPE_LABELS) as [BaseMetalType, string][]).map(([k, v]) => (
              <button key={k} onClick={() => setMaterial({ type: k })}
                className={`text-left px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors
                  ${material.type === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thickness */}
      <div>
        <label className="label">Chiều dày (mm)</label>
        <input
          type="number"
          className="input-field"
          value={material.thickness}
          min={1} max={300} step={0.5}
          onChange={e => setMaterial({ thickness: parseFloat(e.target.value) || 1 })}
        />
      </div>

      {/* If grade matched — show auto-populated info */}
      {matchedGrade && (
        <div className="bg-green-50 rounded-lg p-3 text-xs space-y-1 border border-green-100">
          <div className="flex items-center gap-1 font-semibold text-green-800 mb-1">
            <span className={`px-1.5 py-0.5 rounded border text-xs ${TYPE_COLORS[matchedGrade.type]}`}>
              {TYPE_LABELS[matchedGrade.type]}
            </span>
            <span className="text-gray-500 ml-1">· Nhận diện tự động</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-gray-600">
            <span>P-Number: <b className="text-gray-900">{matchedGrade.pNumber}</b></span>
            <span>CE_IIW: <b className="text-gray-900">{matchedGrade.ceIIW.toFixed(2)}</b></span>
            <span>Fy: <b className="text-gray-900">{matchedGrade.yieldStrength} MPa</b></span>
            <span>Fu: <b className="text-gray-900">{matchedGrade.tensileStrength} MPa</b></span>
          </div>
        </div>
      )}

      {/* Manual CE input when grade not found */}
      {!matchedGrade && gradeText && (
        <div>
          <button
            onClick={() => setManualMode(!manualMode)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <ChevronDown size={13} className={`transition-transform ${manualMode ? 'rotate-180' : ''}`} />
            {manualMode ? 'Ẩn' : 'Nhập thủ công'} CE và thông số vật liệu
          </button>

          {manualMode && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="label">CE_IIW</label>
                <input type="number" className="input-field" step="0.01" min="0" max="1.5"
                  placeholder="VD: 0.42"
                  value={material.customCE ?? ''}
                  onChange={e => setMaterial({ customCE: parseFloat(e.target.value) || undefined })} />
              </div>
              <div>
                <label className="label">Fy (MPa)</label>
                <input type="number" className="input-field" step="5" min="100" max="1000"
                  placeholder="VD: 345"
                  value={material.customFy ?? ''}
                  onChange={e => setMaterial({ customFy: parseFloat(e.target.value) || undefined })} />
              </div>
              <div>
                <label className="label">Fu (MPa)</label>
                <input type="number" className="input-field" step="5" min="200" max="1500"
                  placeholder="VD: 490"
                  value={material.customFu ?? ''}
                  onChange={e => setMaterial({ customFu: parseFloat(e.target.value) || undefined })} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
