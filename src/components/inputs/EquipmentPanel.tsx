import { useWeldingStore } from '../../store/weldingStore';
import { WIRE_SPECS, WIRE_DIAMETERS, DEFAULT_GAS } from '../../engine/tables/processDefaults';
import type { WeldingProcess, Polarity } from '../../types';

const PROCESSES: { id: WeldingProcess; label: string; abbr: string }[] = [
  { id: 'GMAW', label: 'GMAW / MIG-MAG', abbr: '131/135' },
  { id: 'SMAW', label: 'SMAW / Hàn que', abbr: '111' },
  { id: 'FCAW', label: 'FCAW / Hàn dây lõi thuốc', abbr: '136/138' },
  { id: 'GTAW', label: 'GTAW / TIG', abbr: '141' },
  { id: 'SAW', label: 'SAW / Hàn dưới lớp thuốc', abbr: '121' },
];

export function EquipmentPanel() {
  const { equipment, material, setEquipment } = useWeldingStore();

  const filteredWires = WIRE_SPECS.filter(w =>
    w.process === equipment.process &&
    w.materialTypes.includes(material.type)
  );

  const diameters = WIRE_DIAMETERS[equipment.process] ?? [];

  const handleProcessChange = (process: WeldingProcess) => {
    const gas = DEFAULT_GAS[process];
    const firstWire = WIRE_SPECS.find(w => w.process === process && w.materialTypes.includes(material.type));
    setEquipment({
      process,
      shieldingGas: gas,
      wireId: firstWire?.id ?? '',
      wireDiameter: parseFloat(WIRE_DIAMETERS[process]?.[0] ?? '1.2'),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Quá trình hàn</label>
        <div className="grid grid-cols-1 gap-1.5">
          {PROCESSES.map(p => (
            <button key={p.id} onClick={() => handleProcessChange(p.id)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors
                ${equipment.process === p.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
              <span className="font-bold mr-2">[{p.abbr}]</span>{p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Dòng tối đa (A)</label>
          <input type="number" className="input-field" value={equipment.maxCurrent}
            min={50} max={2000} step={10}
            onChange={e => setEquipment({ maxCurrent: +e.target.value })} />
        </div>
        <div>
          <label className="label">Điện áp tối đa (V)</label>
          <input type="number" className="input-field" value={equipment.maxVoltage}
            min={10} max={100} step={1}
            onChange={e => setEquipment({ maxVoltage: +e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label">Model máy hàn</label>
        <input type="text" className="input-field" value={equipment.machineModel}
          placeholder="VD: Panasonic YD-350GR3, Lincoln Power Wave S350..."
          onChange={e => setEquipment({ machineModel: e.target.value })} />
      </div>

      {filteredWires.length > 0 && (
        <div>
          <label className="label">Dây / Que hàn</label>
          <select className="select-field" value={equipment.wireId}
            onChange={e => setEquipment({ wireId: e.target.value })}>
            {filteredWires.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.standard})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Đường kính dây / Que (mm)</label>
        <select className="select-field" value={equipment.wireDiameter}
          onChange={e => setEquipment({ wireDiameter: parseFloat(e.target.value) })}>
          {diameters.map(d => <option key={d} value={d}>Ø{d} mm</option>)}
        </select>
      </div>

      {equipment.process !== 'SMAW' && equipment.process !== 'SAW' && (
        <div>
          <label className="label">Khí bảo vệ (Shielding Gas)</label>
          <input type="text" className="input-field" value={equipment.shieldingGas}
            placeholder="VD: 75%Ar/25%CO₂..."
            onChange={e => setEquipment({ shieldingGas: e.target.value })} />
        </div>
      )}

      <div>
        <label className="label">Cực tính (Polarity)</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['DCEP', 'DCEN', 'AC'] as Polarity[]).map(p => (
            <button key={p} onClick={() => setEquipment({ polarity: p })}
              className={`py-1.5 rounded text-xs font-bold transition-colors
                ${equipment.polarity === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          DCEP = Que/dây nối (+) · DCEN = Que/dây nối (-) · AC = Xoay chiều
        </p>
      </div>
    </div>
  );
}
