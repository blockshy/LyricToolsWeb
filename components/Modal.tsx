import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeText: string;
  type?: 'preview' | 'custom';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, closeText, type = 'preview' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 font-mono">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950/50">
          {type === 'custom' ? (
             <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
               {children}
             </div>
          ) : (
            <pre className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
              {children}
            </pre>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm transition-colors"
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );
};