import React, { useEffect } from 'react';
import type { ToastMessage } from '../../context/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: 'fa-check-circle', color: 'text-[#0B8F3A]', bg: 'bg-[#EAFDF1]', border: 'border-[#0B8F3A]/20' },
    error: { icon: 'fa-circle-xmark', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    warning: { icon: 'fa-triangle-exclamation', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    info: { icon: 'fa-circle-info', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
  }[toast.type];

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border ${config.bg} ${config.border} backdrop-blur-md animate-in slide-in-from-top-2 duration-300`}>
      <i className={`fa-solid ${config.icon} ${config.color} text-lg mt-0.5`}></i>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-gray-800 leading-snug">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition bg-transparent border-none cursor-pointer p-0">
        <i className="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>
  );
};
