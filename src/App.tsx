import { useAppStore } from './store/appStore';
import Step1Upload from './components/workflow/Step1Upload';
import Step2Confirm from './components/workflow/Step2Confirm';
import Step3Machine from './components/workflow/Step3Machine';
import Step4Simulate from './components/workflow/Step4Simulate';
import Step5Results from './components/workflow/Step5Results';

const STEPS = [
  { id: 'upload', label: '1. Upload' },
  { id: 'confirm', label: '2. Confirm' },
  { id: 'machine', label: '3. Machine' },
  { id: 'model3d', label: '4. Simulate' },
  { id: 'results', label: '5. Results' },
] as const;

export default function App() {
  const { step, error, setError } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">WeldCalc FEM</h1>
            <p className="text-xs text-gray-500">AI Drawing Analysis + Thermal FEM Simulation</p>
          </div>
          {/* Step indicator */}
          <div className="hidden sm:flex gap-1">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  s.id === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Global error */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === 'upload' && <Step1Upload />}
        {step === 'confirm' && <Step2Confirm />}
        {step === 'machine' && <Step3Machine />}
        {(step === 'model3d' || step === 'simulate') && <Step4Simulate />}
        {step === 'results' && <Step5Results />}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        WeldCalc FEM · AWS D1.1 / ISO 5817 / EN 1011 · For reference only
      </footer>
    </div>
  );
}
