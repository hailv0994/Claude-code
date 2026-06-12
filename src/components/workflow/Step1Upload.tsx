import { useCallback, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { analyzeDrawing, mergeResults } from '../../lib/gemini';

export default function Step1Upload() {
  const {
    apiKey, setApiKey,
    componentFiles, addComponentFile, removeComponentFile,
    assemblyFile, setAssemblyFile,
    userHint, setUserHint,
    setAnalysis, setStep, setLoading, setError,
    isLoading, loadingMsg,
  } = useAppStore();

  const [showKey, setShowKey] = useState(false);
  const [dragComp, setDragComp] = useState(false);
  const [dragAsm, setDragAsm] = useState(false);

  const onDropComp = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragComp(false);
    Array.from(e.dataTransfer.files).forEach(addComponentFile);
  }, [addComponentFile]);

  const onDropAsm = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragAsm(false);
    const f = e.dataTransfer.files[0];
    if (f) setAssemblyFile(f);
  }, [setAssemblyFile]);

  const handleAnalyze = async () => {
    if (!apiKey.trim()) { setError('Vui lòng nhập Gemini API key trước.'); return; }
    if (componentFiles.length === 0) { setError('Vui lòng upload ít nhất 1 bản vẽ linh kiện.'); return; }
    setError(null);
    setLoading(true, 'Đang phân tích bản vẽ bằng Gemini AI...');
    try {
      const compResult = await analyzeDrawing(apiKey, componentFiles[0], userHint) as any;
      let merged = compResult;
      if (assemblyFile) {
        const asmResult = await analyzeDrawing(apiKey, assemblyFile, userHint) as any;
        merged = mergeResults(compResult, asmResult);
      }
      setAnalysis(merged);
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WeldCalc FEM</h1>
        <p className="text-gray-500 mt-1">Phân tích bản vẽ hàn · Mô phỏng nhiệt FEM · Tối ưu thông số</p>
      </div>

      {/* API Key */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-blue-800">
            Gemini API Key <span className="font-normal text-blue-500">(miễn phí)</span>
          </label>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline"
          >
            Lấy key miễn phí →
          </a>
        </div>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            placeholder="Dán API key vào đây (AIzaSy...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 border border-blue-300 rounded-lg text-xs text-blue-600 hover:bg-blue-100"
          >
            {showKey ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        <p className="text-xs text-blue-500">Key được lưu trên trình duyệt của bạn, không gửi đi đâu khác ngoài Gemini.</p>
      </div>

      {/* Component drawings */}
      <div
        onDrop={onDropComp}
        onDragOver={(e) => { e.preventDefault(); setDragComp(true); }}
        onDragLeave={() => setDragComp(false)}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragComp ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <p className="text-sm font-medium text-gray-600 mb-2">Bản vẽ linh kiện (1 hoặc nhiều file)</p>
        <label className="cursor-pointer text-blue-600 text-sm underline">
          Click để chọn file (PNG / JPG / PDF)
          <input type="file" multiple accept="image/*,.pdf" className="hidden"
            onChange={(e) => Array.from(e.target.files || []).forEach(addComponentFile)} />
        </label>
        {componentFiles.length > 0 && (
          <ul className="mt-3 space-y-1 text-left">
            {componentFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-white rounded px-3 py-1 text-sm border">
                <span className="truncate text-gray-700">{f.name}</span>
                <button onClick={() => removeComponentFile(i)} className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assembly drawing */}
      <div
        onDrop={onDropAsm}
        onDragOver={(e) => { e.preventDefault(); setDragAsm(true); }}
        onDragLeave={() => setDragAsm(false)}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragAsm ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <p className="text-sm font-medium text-gray-600 mb-2">Bản vẽ sản phẩm hàn (tùy chọn)</p>
        {assemblyFile ? (
          <div className="flex items-center justify-between bg-white rounded px-3 py-1 text-sm border">
            <span className="truncate text-gray-700">{assemblyFile.name}</span>
            <button onClick={() => setAssemblyFile(null)} className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
          </div>
        ) : (
          <label className="cursor-pointer text-blue-600 text-sm underline">
            Click để chọn file
            <input type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => setAssemblyFile(e.target.files?.[0] || null)} />
          </label>
        )}
      </div>

      {/* Hint */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm (tùy chọn)</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={2}
          placeholder="VD: thép SS400, dày 12mm, mối hàn góc, hàn GMAW..."
          value={userHint}
          onChange={(e) => setUserHint(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-blue-700">{loadingMsg || 'Đang phân tích...'}</p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={componentFiles.length === 0 || !apiKey.trim() || isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang phân tích...
          </>
        ) : 'Phân tích bằng Gemini AI'}
      </button>
    </div>
  );
}
