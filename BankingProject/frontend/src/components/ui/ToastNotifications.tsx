import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';

const ToastNotifications: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const toastStyles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-600',
      iconComponent: CheckCircleIcon
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      iconComponent: XCircleIcon
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      iconComponent: ExclamationCircleIcon
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      iconComponent: InformationCircleIcon
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      <AnimatePresence>
        {toasts.map((toast: any) => {
          const styles = toastStyles[toast.type as keyof typeof toastStyles] || toastStyles.info;
          const IconComponent = styles.iconComponent;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`rounded-lg border p-4 shadow-lg ${styles.container}`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <h4 className="text-sm font-medium mb-1">{toast.title}</h4>
                  )}
                  {toast.message && (
                    <p className="text-sm">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
                  aria-label="Close notification"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotifications;

