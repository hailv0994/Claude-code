import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { useWeldingStore } from '../../store/weldingStore';
import type { UploadedFile } from '../../types';

interface DropZoneProps {
  label: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile | null) => void;
}

function DropZone({ label, file, onFile }: DropZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const url = URL.createObjectURL(f);
    onFile({ name: f.name, url, type: f.type, size: f.size });
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <div className="mb-3">
      <span className="label">{label}</span>
      {file ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {isImage ? (
            <img src={file.url} alt={file.name} className="w-full h-32 object-contain bg-gray-50" />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50">
              <FileText size={20} className="text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-100">
            <span className="text-xs text-gray-500 truncate">{file.name}</span>
            <button onClick={() => onFile(null)} className="text-gray-400 hover:text-red-500 ml-2">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors
            ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
        >
          <Upload size={18} className="text-gray-400" />
          <span className="text-xs text-gray-400 text-center">Drop file or click<br/>PNG, JPG, PDF, DWG</span>
        </div>
      )}
      <input ref={ref} type="file" className="hidden"
        accept=".png,.jpg,.jpeg,.pdf,.dwg,.dxf"
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

export function DrawingUpload() {
  const { componentFile, assemblyFile, setComponentFile, setAssemblyFile } = useWeldingStore();

  return (
    <div>
      <DropZone label="Bản vẽ linh kiện rời (Component Drawing)" file={componentFile} onFile={setComponentFile} />
      <DropZone label="Bản vẽ sản phẩm (Assembly Drawing)" file={assemblyFile} onFile={setAssemblyFile} />
    </div>
  );
}
