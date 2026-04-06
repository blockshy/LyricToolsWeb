import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  title: string;
  description: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, title, description }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
    }
    // Reset the input value so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer group bg-slate-50 dark:bg-transparent"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        ref={inputRef} 
        className="hidden" 
        accept=".lrc,.srt,.qrc,.txt"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-sm dark:shadow-none">
          <Upload className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-slate-700 dark:text-slate-200 font-medium">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};