import { useAppStore } from '../../store/appStore';
import SectionCard from '../layout/SectionCard';

export default function Step2Confirm() {
  const { analysis, patchAnalysis, setStep } = useAppStore();
  if (!analysis) return null;

  const { material, joint, welding_symbol, dimensions, description, warnings } = analysis;

  const Field = ({ label, value, onChange }: { label: string; value: string | number | null; onChange?: (v: string) => void }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      {onChange ? (
        <input
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review AI Analysis</h2>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Warnings</p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {material && (
        <SectionCard title="Material">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Grade" value={material.grade} onChange={(v) => patchAnalysis({ material: { ...material, grade: v } })} />
            <Field label="Type" value={material.type} onChange={(v) => patchAnalysis({ material: { ...material, type: v } })} />
            <Field label="Thickness (mm)" value={material.thickness_mm} onChange={(v) => patchAnalysis({ material: { ...material, thickness_mm: parseFloat(v) || 0 } })} />
            <Field label="Confidence" value={material.confidence} />
          </div>
        </SectionCard>
      )}

      {joint && (
        <SectionCard title="Joint">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Type" value={joint.type} onChange={(v) => patchAnalysis({ joint: { ...joint, type: v } })} />
            <Field label="Groove" value={joint.groove_type} onChange={(v) => patchAnalysis({ joint: { ...joint, groove_type: v } })} />
            <Field label="Groove Angle (°)" value={joint.groove_angle_deg} onChange={(v) => patchAnalysis({ joint: { ...joint, groove_angle_deg: parseFloat(v) || 0 } })} />
            <Field label="Root Opening (mm)" value={joint.root_opening_mm} onChange={(v) => patchAnalysis({ joint: { ...joint, root_opening_mm: parseFloat(v) || 0 } })} />
            <Field label="Root Face (mm)" value={joint.root_face_mm} onChange={(v) => patchAnalysis({ joint: { ...joint, root_face_mm: parseFloat(v) || 0 } })} />
            <Field label="Position" value={joint.position} onChange={(v) => patchAnalysis({ joint: { ...joint, position: v } })} />
            <Field label="Backing" value={joint.backing} onChange={(v) => patchAnalysis({ joint: { ...joint, backing: v } })} />
          </div>
        </SectionCard>
      )}

      {welding_symbol && (
        <SectionCard title="Welding Process">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Process" value={welding_symbol.process_name} onChange={(v) => patchAnalysis({ welding_symbol: { ...welding_symbol, process_name: v } })} />
            <Field label="Code" value={welding_symbol.process_code} onChange={(v) => patchAnalysis({ welding_symbol: { ...welding_symbol, process_code: v } })} />
            <Field label="Weld Size (mm)" value={welding_symbol.weld_size_mm} onChange={(v) => patchAnalysis({ welding_symbol: { ...welding_symbol, weld_size_mm: parseFloat(v) || null } })} />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Dimensions">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Part Width (mm)" value={dimensions.part_width_mm} onChange={(v) => patchAnalysis({ dimensions: { ...dimensions, part_width_mm: parseFloat(v) || null } })} />
          <Field label="Part Length (mm)" value={dimensions.part_length_mm} onChange={(v) => patchAnalysis({ dimensions: { ...dimensions, part_length_mm: parseFloat(v) || null } })} />
          <Field label="Notes" value={dimensions.other_notes} onChange={(v) => patchAnalysis({ dimensions: { ...dimensions, other_notes: v } })} />
        </div>
      </SectionCard>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('upload')}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep('machine')}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}
