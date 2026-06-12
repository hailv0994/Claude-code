import { useAppStore } from '../../store/appStore';
import SectionCard from '../layout/SectionCard';
import WeldModel3D from '../visualization/WeldModel3D';
import { optimizeParameters } from '../../lib/fem/optimizer';

export default function Step4Simulate() {
  const {
    analysis, machine, qualityTargets, setQualityTargets,
    setFEMResult, setOptimalParams, setStep, setLoading, setError, isLoading, loadingMsg,
  } = useAppStore();

  const handleOptimize = async () => {
    setError(null);
    setLoading(true, 'Đang tối ưu thông số hàn (FEM + Nelder-Mead)... 0%');

    // Run in a macrotask so UI can update first
    await new Promise(r => setTimeout(r, 50));

    try {
      const result = await new Promise<ReturnType<typeof optimizeParameters>>((resolve, reject) => {
        setTimeout(() => {
          try {
            const r = optimizeParameters({
              materialType: analysis?.material?.type ?? 'carbon_steel',
              plateThickness: analysis?.material?.thickness_mm ?? 12,
              plateWidth: analysis?.dimensions?.part_width_mm ?? 100,
              process: machine.process,
              preheatTemp: 20,
              maxCurrent: machine.maxCurrent,
              targets: qualityTargets,
              onProgress: (pct) => {
                setLoading(true, `Đang tối ưu thông số hàn (FEM + Nelder-Mead)... ${pct}%`);
              },
            });
            resolve(r);
          } catch (e) { reject(e); }
        }, 10);
      });

      setFEMResult(result.femResult);
      setOptimalParams(result.optimalParams);
      setStep('results');
    } catch (e: any) {
      setError(e.message || 'Tối ưu thất bại');
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
        <h2 className="text-xl font-bold text-gray-900">Mô hình 3D & Mô phỏng FEM</h2>
        <p className="text-gray-500 text-sm mt-1">Xem mô hình mối hàn, đặt yêu cầu chất lượng, rồi chạy tối ưu</p>
      </div>

      <SectionCard title="Mô hình 3D — Trước khi hàn">
        <div className="h-64 rounded-lg overflow-hidden">
          <WeldModel3D showWeld={false} />
        </div>
      </SectionCard>

      <SectionCard title="Mô hình 3D — Sau khi hàn">
        <div className="h-64 rounded-lg overflow-hidden">
          <WeldModel3D showWeld={true} />
        </div>
      </SectionCard>

      <SectionCard title="Yêu cầu chất lượng" subtitle="Ràng buộc cho bài toán tối ưu FEM">
        <div className="grid grid-cols-3 gap-4">
          <QField label="HAZ tối đa" unit="mm" key_="haz_width_max" />
          <QField label="Chiều sâu ngấu tối thiểu" unit="mm" key_="fusion_depth_min" />
          <QField label="Nhiệt độ đỉnh tối đa" unit="°C" key_="peak_temp_max" />
        </div>
      </SectionCard>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-blue-700">{loadingMsg}</p>
          <p className="text-xs text-blue-500 mt-1">Chạy trực tiếp trong trình duyệt, không cần server…</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep('machine')}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={handleOptimize}
          disabled={isLoading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Đang tối ưu…' : 'Chạy tối ưu FEM'}
        </button>
      </div>
    </div>
  );
}
