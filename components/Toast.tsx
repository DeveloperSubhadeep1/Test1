
import React from 'react';
import { ToastMessage } from '../context/ToastContext';
import { XIcon, InfoIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const baseClasses = 'flex items-center p-4 mb-4 text-white rounded-lg shadow-lg animate-fade-in-up';
  const typeClasses: { [key: string]: string } = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-500',
  };
  const iconClasses = 'w-6 h-6 mr-3';

  const icons: { [key: string]: React.ReactNode } = {
      success: <CheckCircleIcon className={iconClasses} />,
      error: <AlertTriangleIcon className={iconClasses} />,
      info: <InfoIcon className={iconClasses} />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]}`} role="alert">
      {icons[toast.type]}
      <div className="flex-grow text-sm font-medium">{toast.message}</div>
      <button onClick={onClose} className="ml-4 -mx-1.5 -my-1.5 p-1.5 rounded-full hover:bg-white/20 inline-flex h-8 w-8 items-center justify-center transition-colors">
        <span className="sr-only">Close</span>
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[100] w-full max-w-xs">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;
