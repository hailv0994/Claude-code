import { useWeldingStore } from '../../store/weldingStore';
import { MATERIAL_GRADES } from '../../engine/tables/materialGrades';
import type { BaseMetalType } from '../../types';

const TYPE_LABELS: Record<BaseMetalType, string> = {
  carbon_steel: 'Thép Carbon',
  low_alloy: 'Thép hợp kim thấp',
  stainless_austenitic: 'Thép không gỉ Austenitic',
  aluminum: 'Nhôm',
};

export function MaterialSelector() {
  const { material, setMaterial } = useWeldingStore();

  const filteredGrades = MATERIAL_GRADES.filter(g => g.type === material.type);
  const selectedGrade = filteredGrades.find(g => g.id === material.gradeId);

  const handleTypeChange = (type: BaseMetalType) => {
    const firstGrade = MATERIAL_GRADES.find(g => g.type === type);
    setMaterial({ type, gradeId: firstGrade?.id ?? '' });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Loại vật liệu cơ bản</label>
        <select
          className="select-field"
          value={material.type}
          onChange={e => handleTypeChange(e.target.value as BaseMetalType)}
        >
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Mác thép / Grade</label>
        <select
          className="select-field"
          value={material.gradeId}
          onChange={e => setMaterial({ gradeId: e.target.value })}
        >
          {filteredGrades.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

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

      {selectedGrade && (
        <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
          <div className="font-semibold text-blue-800 mb-1">Thông số vật liệu</div>
          <div className="grid grid-cols-2 gap-1 text-gray-600">
            <span>P-Number: <b className="text-gray-800">{selectedGrade.pNumber}</b></span>
            <span>CE_IIW: <b className="text-gray-800">{selectedGrade.ceIIW.toFixed(2)}</b></span>
            <span>Fy: <b className="text-gray-800">{selectedGrade.yieldStrength} MPa</b></span>
            <span>Fu: <b className="text-gray-800">{selectedGrade.tensileStrength} MPa</b></span>
          </div>
        </div>
      )}
    </div>
  );
}
