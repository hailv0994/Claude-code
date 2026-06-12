
import { useAppStore } from '../../store/appStore';
import SectionCard from '../layout/SectionCard';
import HAZCrossSection from '../visualization/HAZCrossSection';
import CoolingCurve from '../visualization/CoolingCurve';
import WeldModel3D from '../visualization/WeldModel3D';

export default function Step5Results() {
  const { optimalParams, femResult, machine, setStep } = useAppStore();

  if (!optimalParams || !femResult) return null;

  const hi = optimalParams.heat_input_kJ_mm;

  const wirefeedSpeed = (() => {
    const d = machine.wireDiameter;
    const k = 27.5 * Math.pow(1.2 / d, 2);
    return Math.round(optimalParams.current * k);
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Optimal Welding Parameters</h2>
        <p className="text-gray-500 text-sm mt-1">Results from FEM inverse optimization (Nelder-Mead)</p>
      </div>

      {/* Primary parameters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Current', value: `${optimalParams.current} A`, color: 'bg-red-50 border-red-100' },
          { label: 'Voltage', value: `${optimalParams.voltage} V`, color: 'bg-orange-50 border-orange-100' },
          { label: 'Travel Speed', value: `${optimalParams.travel_speed} mm/min`, color: 'bg-green-50 border-green-100' },
          { label: 'Heat Input', value: `${hi.toFixed(3)} kJ/mm`, color: 'bg-blue-50 border-blue-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 border text-center ${color}`}>
            <div className="text-xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Secondary */}
      <SectionCard title="Derived Parameters">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: 'Process', value: machine.process },
            { label: 'Wire Diameter', value: `${machine.wireDiameter} mm` },
            { label: 'Wire Feed Speed', value: `${wirefeedSpeed} mm/min` },
            { label: 'Shielding Gas', value: machine.shieldingGas },
            { label: 'Arc Energy', value: `${((optimalParams.current * optimalParams.voltage) / 1000).toFixed(2)} kW` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 3D post-weld */}
      <SectionCard title="Post-Weld 3D Model">
        <div className="h-56 rounded-lg overflow-hidden">
          <WeldModel3D showWeld={true} />
        </div>
      </SectionCard>

      {/* HAZ cross-section */}
      <SectionCard title="Thermal Zone Cross-Section">
        <HAZCrossSection result={femResult} />
      </SectionCard>

      {/* Cooling curve */}
      <SectionCard title="Weld Centerline Cooling Curve">
        <CoolingCurve result={femResult} />
      </SectionCard>

      {/* Standards check */}
      <SectionCard title="Quality Check">
        <div className="space-y-2">
          {[
            {
              label: 'HAZ Width',
              pass: femResult.metrics.haz_width_mm <= 8,
              value: `${femResult.metrics.haz_width_mm.toFixed(1)} mm`,
              limit: '≤ 8 mm',
            },
            {
              label: 'Fusion Depth',
              pass: femResult.metrics.fusion_depth_mm >= 4,
              value: `${femResult.metrics.fusion_depth_mm.toFixed(1)} mm`,
              limit: '≥ 4 mm',
            },
            {
              label: 'Peak Temperature',
              pass: femResult.metrics.peak_temp_C <= 1600,
              value: `${femResult.metrics.peak_temp_C.toFixed(0)} °C`,
              limit: '≤ 1600 °C',
            },
          ].map(({ label, pass, value, limit }) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${pass ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${pass ? 'text-green-600' : 'text-red-500'}`}>{pass ? '✓' : '✗'}</span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-800">{value}</span>
                <span className="text-xs text-gray-400 ml-2">target {limit}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('simulate')}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('upload')}
          className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors"
        >
          New Analysis
        </button>
      </div>
    </div>
  );
}
