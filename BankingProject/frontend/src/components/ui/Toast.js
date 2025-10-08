import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';

// Toast icon mapping
const getToastIcon = (type) => {
  const iconProps = { className: "w-6 h-6" };
  
  switch (type) {
    case 'success':
      return <CheckCircleIcon {...iconProps} className="w-6 h-6 text-green-500" />;
    case 'error':
      return <XCircleIcon {...iconProps} className="w-6 h-6 text-red-500" />;
    case 'warning':
      return <ExclamationTriangleIcon {...iconProps} className="w-6 h-6 text-yellow-500" />;
    case 'info':
      return <InformationCircleIcon {...iconProps} className="w-6 h-6 text-blue-500" />;
    case 'transaction':
      return <CreditCardIcon {...iconProps} className="w-6 h-6 text-purple-500" />;
    case 'security':
      return <ShieldCheckIcon {...iconProps} className="w-6 h-6 text-orange-500" />;
    case 'system':
      return <CogIcon {...iconProps} className="w-6 h-6 text-gray-500" />;
    default:
      return <InformationCircleIcon {...iconProps} className="w-6 h-6 text-blue-500" />;
  }
};

// Toast color mapping
const getToastColors = (type) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        accent: 'border-l-green-500'
      };
    case 'error':
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        accent: 'border-l-red-500'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        accent: 'border-l-yellow-500'
      };
    case 'info':
      return {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        accent: 'border-l-blue-500'
      };
    case 'transaction':
      return {
        bg: 'bg-purple-50 border-purple-200',
        text: 'text-purple-800',
        accent: 'border-l-purple-500'
      };
    case 'security':
      return {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-800',
        accent: 'border-l-orange-500'
      };
    case 'system':
      return {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-800',
        accent: 'border-l-gray-500'
      };
    default:
      return {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        accent: 'border-l-blue-500'
      };
  }
};

// Individual Toast Component
const Toast = ({ notification, onClose }) => {
  const colors = getToastColors(notification.type);
  const icon = getToastIcon(notification.type);

  const handleAction = (action) => {
    if (action.handler) {
      action.handler();
    }
    if (action.closeOnClick !== false) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative max-w-sm w-full border-l-4 rounded-lg shadow-lg backdrop-blur-sm
        ${colors.bg} ${colors.accent} ${colors.text}
        transform transition-all duration-200 hover:shadow-xl
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          
          <div className="ml-3 flex-1">
            {notification.title && (
              <h4 className="text-sm font-semibold mb-1">
                {notification.title}
              </h4>
            )}
            
            {notification.message && (
              <p className="text-sm opacity-90">
                {notification.message}
              </p>
            )}
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action)}
                    className={`
                      text-xs font-medium px-3 py-1 rounded-md
                      transition-colors duration-200
                      ${action.primary 
                        ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                        : 'hover:bg-white hover:bg-opacity-10'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {!notification.persistent && (
            <button
              onClick={onClose}
              className="ml-2 flex-shrink-0 p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
              aria-label="Close notification"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {notification.progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
              <div 
                className="bg-white bg-opacity-60 h-1 rounded-full transition-all duration-300"
                style={{ width: `${notification.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Toast Container Component
const ToastContainer = () => {
  const { toasts, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              notification={toast}
              onClose={() => removeNotification(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;