
import { useAppStore } from '../../store/appStore';
import SectionCard from '../layout/SectionCard';

const PROCESSES = ['GMAW', 'SMAW', 'GTAW', 'FCAW', 'SAW'];
const GAS_OPTIONS = ['75%Ar/25%CO₂', '100%CO₂', '100%Ar', '98%Ar/2%O₂', 'None'];

export default function Step3Machine() {
  const { machine, setMachine, setStep } = useAppStore();

  const Field = ({
    label, unit, value, onChange, type = 'number', options,
  }: {
    label: string;
    unit?: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    options?: string[];
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}{unit && <span className="ml-1 text-gray-400">({unit})</span>}</label>
      {options ? (
        <select
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Welding Machine Specs</h2>
        <p className="text-gray-500 text-sm mt-1">Enter your welding equipment specifications</p>
      </div>

      <SectionCard title="Machine Parameters">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Process"
            value={machine.process}
            onChange={(v) => setMachine({ process: v })}
            options={PROCESSES}
          />
          <Field
            label="Model"
            value={machine.machineModel}
            onChange={(v) => setMachine({ machineModel: v })}
            type="text"
          />
          <Field
            label="Max Current"
            unit="A"
            value={machine.maxCurrent}
            onChange={(v) => setMachine({ maxCurrent: parseFloat(v) || 0 })}
          />
          <Field
            label="Max Voltage"
            unit="V"
            value={machine.maxVoltage}
            onChange={(v) => setMachine({ maxVoltage: parseFloat(v) || 0 })}
          />
          <Field
            label="Wire Diameter"
            unit="mm"
            value={machine.wireDiameter}
            onChange={(v) => setMachine({ wireDiameter: parseFloat(v) || 0 })}
          />
          <Field
            label="Shielding Gas"
            value={machine.shieldingGas}
            onChange={(v) => setMachine({ shieldingGas: v })}
            options={GAS_OPTIONS}
          />
        </div>
      </SectionCard>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Next:</strong> A 3D model of your joint will be rendered, then you can run the thermal FEM simulation to find optimal welding parameters.
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('confirm')}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('model3d')}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          View 3D Model
        </button>
      </div>
    </div>
  );
}
