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
    <div className="tool-modal-overlay animate-in fade-in duration-200">
      <div 
        className="tool-modal animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tool-modal-header">
          <h3 className="tool-modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="tool-icon-button"
            aria-label={closeText}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="tool-modal-body">
          {type === 'custom' ? (
             <div className="tool-modal-custom">
               {children}
             </div>
          ) : (
            <pre className="tool-modal-pre">
              {children}
            </pre>
          )}
        </div>
        <div className="tool-modal-footer">
          <button 
            onClick={onClose}
            className="tool-secondary-button"
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );
};
