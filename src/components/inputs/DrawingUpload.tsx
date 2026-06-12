import { useRef, useState } from 'react';
import { Upload, X, FileText, Plus } from 'lucide-react';
import { useWeldingStore } from '../../store/weldingStore';
import type { UploadedFile } from '../../types';

function FileCard({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {isImage ? (
        <img src={file.url} alt={file.name} className="w-full h-24 object-contain bg-gray-50" />
      ) : (
        <div className="flex items-center gap-2 p-2 bg-gray-50">
          <FileText size={16} className="text-blue-500 flex-shrink-0" />
          <p className="text-xs font-medium text-gray-700 truncate flex-1">{file.name}</p>
        </div>
      )}
      <div className="flex items-center justify-between px-2 py-1 bg-white border-t border-gray-100">
        <span className="text-xs text-gray-400 truncate">{(file.size / 1024).toFixed(0)} KB</span>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500 ml-1">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function MultiDropZone({ label, files, onAdd, onRemove }: {
  label: string;
  files: UploadedFile[];
  onAdd: (f: UploadedFile) => void;
  onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(f => {
      onAdd({ name: f.name, url: URL.createObjectURL(f), type: f.type, size: f.size });
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="label">{label}</span>
        {files.length > 0 && (
          <span className="text-xs text-blue-500 font-medium">{files.length} file</span>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {files.map((f, i) => (
            <FileCard key={i} file={f} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}

      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
      >
        <Plus size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">Thêm bản vẽ (PNG, JPG, PDF, DWG)</span>
      </div>
      <input ref={ref} type="file" className="hidden" multiple
        accept=".png,.jpg,.jpeg,.pdf,.dwg,.dxf"
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

function SingleDropZone({ label, file, onFile }: {
  label: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const f = fileList[0];
    onFile({ name: f.name, url: URL.createObjectURL(f), type: f.type, size: f.size });
  };

  return (
    <div className="mb-3">
      <span className="label">{label}</span>
      {file ? (
        <FileCard file={file} onRemove={() => onFile(null)} />
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors
            ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
        >
          <Upload size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Thêm bản vẽ (PNG, JPG, PDF, DWG)</span>
        </div>
      )}
      <input ref={ref} type="file" className="hidden"
        accept=".png,.jpg,.jpeg,.pdf,.dwg,.dxf"
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

export function DrawingUpload() {
  const { componentFiles, assemblyFile, addComponentFile, removeComponentFile, setAssemblyFile } = useWeldingStore();

  return (
    <div>
      <MultiDropZone
        label="Bản vẽ linh kiện rời (có thể thêm nhiều)"
        files={componentFiles}
        onAdd={addComponentFile}
        onRemove={removeComponentFile}
      />
      <SingleDropZone
        label="Bản vẽ sản phẩm hàn (Assembly Drawing)"
        file={assemblyFile}
        onFile={setAssemblyFile}
      />
    </div>
  );
}
