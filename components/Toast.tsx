
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const bgColors = {
    success: 'bg-white dark:bg-gray-800 border-l-4 border-green-500',
    error: 'bg-white dark:bg-gray-800 border-l-4 border-red-500',
    info: 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`${bgColors[toast.type]} shadow-lg rounded-r-lg p-4 mb-3 flex items-start gap-3 min-w-[300px] animate-in slide-in-from-right duration-300 pointer-events-auto border-y border-r border-gray-100 dark:border-gray-700`}>
      <div className={`mt-0.5 ${iconColors[toast.type]}`}>
        {toast.type === 'success' && <CheckCircle2 size={18} />}
        {toast.type === 'error' && <AlertCircle size={18} />}
        {toast.type === 'info' && <AlertCircle size={18} />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{toast.message}</p>
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
