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
      className="lyric-uploader group"
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
        <div className="lyric-uploader-icon group-hover:scale-105 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h3 className="lyric-uploader-title">{title}</h3>
          <p className="lyric-uploader-copy">{description}</p>
        </div>
      </div>
    </div>
  );
};
