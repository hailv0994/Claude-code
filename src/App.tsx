import { useState } from 'react';
import { useWeldingStore } from './store/weldingStore';
import { SectionCard } from './components/layout/SectionCard';
import { DrawingUpload } from './components/inputs/DrawingUpload';
import { MaterialSelector } from './components/inputs/MaterialSelector';
import { JointConfigurator } from './components/inputs/JointConfigurator';
import { QualityRequirementsPanel } from './components/inputs/QualityRequirements';
import { EquipmentPanel } from './components/inputs/EquipmentPanel';
import { ResultsPanel } from './components/outputs/ResultsPanel';
import {
  FileImage, Layers, ShieldCheck, Settings, ChevronLeft, ChevronRight, Printer,
  Flame, Wrench,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Bản vẽ & Vật liệu', icon: <FileImage size={16} /> },
  { id: 2, label: 'Mối hàn', icon: <Layers size={16} /> },
  { id: 3, label: 'Chất lượng', icon: <ShieldCheck size={16} /> },
  { id: 4, label: 'Thiết bị', icon: <Settings size={16} /> },
];

export default function App() {
  const { step, setStep } = useWeldingStore();
  const [mobileShowResults, setMobileShowResults] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-white/10 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Flame size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">WeldCalc Pro</h1>
              <p className="text-blue-300 text-xs">Tính toán điều kiện hàn · Welding Condition Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 btn-secondary text-xs px-3 py-1.5"
            >
              <Printer size={13} /> Xuất PDF
            </button>
            <button
              className="lg:hidden btn-secondary text-xs px-3 py-1.5"
              onClick={() => setMobileShowResults(!mobileShowResults)}
            >
              {mobileShowResults ? 'Nhập liệu' : 'Xem kết quả'}
            </button>
          </div>
        </div>
      </header>

      {/* Step tabs */}
      <div className="bg-slate-800/60 border-b border-white/10 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors
                  ${step === s.id
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-gray-400 hover:text-gray-300'}`}
              >
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Left: Input panel */}
          <div className={`lg:col-span-2 space-y-4 ${mobileShowResults ? 'hidden lg:block' : ''}`}>
            {step === 1 && (
              <>
                <SectionCard title="Bản vẽ kỹ thuật" icon={<FileImage size={15} />}>
                  <DrawingUpload />
                </SectionCard>
                <SectionCard title="Vật liệu cơ bản" icon={<Wrench size={15} />}>
                  <MaterialSelector />
                </SectionCard>
              </>
            )}
            {step === 2 && (
              <SectionCard title="Cấu hình mối hàn" icon={<Layers size={15} />}>
                <JointConfigurator />
              </SectionCard>
            )}
            {step === 3 && (
              <SectionCard title="Yêu cầu chất lượng" icon={<ShieldCheck size={15} />}>
                <QualityRequirementsPanel />
              </SectionCard>
            )}
            {step === 4 && (
              <SectionCard title="Thông số thiết bị" icon={<Settings size={15} />}>
                <EquipmentPanel />
              </SectionCard>
            )}

            {/* Step navigation */}
            <div className="flex gap-2 no-print">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  className="btn-secondary flex items-center gap-1 flex-1">
                  <ChevronLeft size={14} /> Quay lại
                </button>
              )}
              {step < 4 && (
                <button onClick={() => setStep(step + 1)}
                  className="btn-primary flex items-center gap-1 flex-1">
                  Tiếp theo <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Results panel */}
          <div className={`lg:col-span-3 ${!mobileShowResults ? 'hidden lg:block' : ''}`}>
            <div className="sticky top-4">
              <div className="mb-3 no-print">
                <h2 className="text-white font-bold text-base">Kết quả tính toán</h2>
                <p className="text-gray-400 text-xs">Điều kiện hàn được tính theo AWS D1.1, EN 1011</p>
              </div>
              <ResultsPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t border-white/10 text-center text-xs text-gray-500 no-print">
        WeldCalc Pro · Dựa trên AWS D1.1, ISO 5817, EN 1011-1/2, ASME Section IX
        <br />Chỉ mang tính tham khảo — Kỹ sư hàn có trách nhiệm xác nhận thông số cuối cùng
      </footer>
    </div>
  );
}
