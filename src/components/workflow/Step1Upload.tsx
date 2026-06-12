import React, { useCallback, useState } from 'react';
import { useAppStore, API } from '../../store/appStore';

export default function Step1Upload() {
  const {
    componentFiles, addComponentFile, removeComponentFile,
    assemblyFile, setAssemblyFile,
    userHint, setUserHint,
    setAnalysis, setStep, setLoading, setError,
  } = useAppStore();

  const [dragComp, setDragComp] = useState(false);
  const [dragAsm, setDragAsm] = useState(false);

  const onDropComp = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragComp(false);
    Array.from(e.dataTransfer.files).forEach(addComponentFile);
  }, [addComponentFile]);

  const onDropAsm = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragAsm(false);
    const f = e.dataTransfer.files[0];
    if (f) setAssemblyFile(f);
  }, [setAssemblyFile]);

  const handleAnalyze = async () => {
    if (componentFiles.length === 0) {
      setError('Please upload at least one component drawing.');
      return;
    }
    setError(null);
    setLoading(true, 'Analyzing drawings with Claude Vision AI...');
    try {
      const fd = new FormData();
      fd.append('component', componentFiles[0]);
      if (assemblyFile) fd.append('assembly', assemblyFile);
      fd.append('user_hint', userHint);

      const res = await fetch(`${API}/api/analyze`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnalysis(data);
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const DropZone = ({
    label, active, onDrop, onDragOver, onDragLeave, children,
  }: {
    label: string;
    active: boolean;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    children?: React.ReactNode;
  }) => (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        active ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      {children || (
        <p className="text-xs text-gray-400">Drag & drop PNG / JPG / PDF here</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WeldCalc FEM</h1>
        <p className="text-gray-500 mt-1">Upload engineering drawings to begin analysis</p>
      </div>

      {/* Component drawings */}
      <DropZone
        label="Component Drawings (one or more)"
        active={dragComp}
        onDrop={onDropComp}
        onDragOver={(e) => { e.preventDefault(); setDragComp(true); }}
        onDragLeave={() => setDragComp(false)}
      >
        <label className="cursor-pointer text-blue-600 text-sm underline">
          Click to select files
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => Array.from(e.target.files || []).forEach(addComponentFile)}
          />
        </label>
        {componentFiles.length > 0 && (
          <ul className="mt-3 space-y-1 text-left">
            {componentFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-white rounded px-3 py-1 text-sm border">
                <span className="truncate text-gray-700">{f.name}</span>
                <button
                  onClick={() => removeComponentFile(i)}
                  className="ml-2 text-red-400 hover:text-red-600 font-bold"
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </DropZone>

      {/* Assembly drawing */}
      <DropZone
        label="Assembly / Weld Drawing (optional)"
        active={dragAsm}
        onDrop={onDropAsm}
        onDragOver={(e) => { e.preventDefault(); setDragAsm(true); }}
        onDragLeave={() => setDragAsm(false)}
      >
        {assemblyFile ? (
          <div className="flex items-center justify-between bg-white rounded px-3 py-1 text-sm border">
            <span className="truncate text-gray-700">{assemblyFile.name}</span>
            <button onClick={() => setAssemblyFile(null)} className="ml-2 text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        ) : (
          <label className="cursor-pointer text-blue-600 text-sm underline">
            Click to select file
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setAssemblyFile(e.target.files?.[0] || null)}
            />
          </label>
        )}
      </DropZone>

      {/* Hint */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional notes (optional)
        </label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={3}
          placeholder="e.g. GMAW process, SS400 material, 12mm plate, butt joint..."
          value={userHint}
          onChange={(e) => setUserHint(e.target.value)}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={componentFiles.length === 0}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Analyze with Claude Vision AI
      </button>
    </div>
  );
}
