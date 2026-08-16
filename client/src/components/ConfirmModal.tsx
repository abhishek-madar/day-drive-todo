import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div 
        className="bg-white w-full max-w-[400px] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-900'}`}>
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-[18px] font-semibold text-gray-900 leading-tight mb-2">{title}</h2>
          <p className="text-[14px] text-gray-500">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50/50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-[13px]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-colors text-[13px] shadow-sm ${
              isDestructive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
