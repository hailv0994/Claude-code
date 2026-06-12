
import { useAppStore, API } from '../../store/appStore';
import SectionCard from '../layout/SectionCard';
import WeldModel3D from '../visualization/WeldModel3D';

export default function Step4Simulate() {
  const {
    analysis, machine, qualityTargets, setQualityTargets,
    setFEMResult, setOptimalParams, setStep, setLoading, setError, isLoading, loadingMsg,
  } = useAppStore();

  const handleOptimize = async () => {
    setError(null);
    setLoading(true, 'Running FEM inverse optimization (Nelder-Mead)...');
    try {
      const body = {
        material_type: analysis?.material?.type ?? 'carbon_steel',
        plate_thickness: analysis?.material?.thickness_mm ?? 12,
        plate_width: analysis?.dimensions?.part_width_mm ?? 100,
        process: machine.process,
        preheat_temp: 20,
        max_current: machine.maxCurrent,
        targets: qualityTargets,
      };
      const res = await fetch(`${API}/api/fem/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFEMResult(data.fem_result);
      setOptimalParams(data.optimal_params);
      setStep('results');
    } catch (e: any) {
      setError(e.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const QField = ({ label, unit, key_ }: { label: string; unit: string; key_: keyof typeof qualityTargets }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label} <span className="text-gray-400">({unit})</span></label>
      <input
        type="number"
        className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={qualityTargets[key_]}
        onChange={(e) => setQualityTargets({ [key_]: parseFloat(e.target.value) || 0 })}
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">3D Model & Simulation</h2>
        <p className="text-gray-500 text-sm mt-1">Review the joint model, set quality targets, then run the FEM optimization</p>
      </div>

      <SectionCard title="Joint Preview — Before Welding">
        <div className="h-64 rounded-lg overflow-hidden">
          <WeldModel3D showWeld={false} />
        </div>
      </SectionCard>

      <SectionCard title="Joint Preview — After Welding">
        <div className="h-64 rounded-lg overflow-hidden">
          <WeldModel3D showWeld={true} />
        </div>
      </SectionCard>

      <SectionCard title="Quality Targets" subtitle="Constraints for the FEM inverse optimization">
        <div className="grid grid-cols-3 gap-4">
          <QField label="Max HAZ Width" unit="mm" key_="haz_width_max" />
          <QField label="Min Fusion Depth" unit="mm" key_="fusion_depth_min" />
          <QField label="Max Peak Temp" unit="°C" key_="peak_temp_max" />
        </div>
      </SectionCard>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-blue-700">{loadingMsg}</p>
          <p className="text-xs text-blue-500 mt-1">This may take 1–3 minutes…</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('machine')}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleOptimize}
          disabled={isLoading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Optimizing…' : 'Run FEM Optimization'}
        </button>
      </div>
    </div>
  );
}
