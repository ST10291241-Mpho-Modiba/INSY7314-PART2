import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useResponsive } from '../../hooks/useResponsive';
import { 
  slideInFromRight, 
  fadeInUp, 
  getAnimationVariant
} from '../../utils/animations';

const ToastNotifications = () => {
  const { toasts, removeToast } = useToast();
  const { announce, shouldReduceMotion } = useAccessibility();
  const { isMobile } = useResponsive();

  // Auto-announce toast messages for screen readers
  useEffect(() => {
    toasts.forEach(toast => {
      if (!toast.announced) {
        announce(`${toast.type}: ${toast.title}. ${toast.message}`);
        toast.announced = true;
      }
    });
  }, [toasts, announce]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };

  const getToastColors = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success-50 border-success-200',
          text: 'text-success-800',
          button: 'text-success-500 hover:text-success-700'
        };
      case 'error':
        return {
          bg: 'bg-error-50 border-error-200',
          text: 'text-error-800',
          button: 'text-error-500 hover:text-error-700'
        };
      case 'warning':
        return {
          bg: 'bg-warning-50 border-warning-200',
          text: 'text-warning-800',
          button: 'text-warning-500 hover:text-warning-700'
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary-50 border-primary-200',
          text: 'text-primary-800',
          button: 'text-primary-500 hover:text-primary-700'
        };
    }
  };

  const getProgressColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-success-500';
      case 'error':
        return 'bg-error-500';
      case 'warning':
        return 'bg-warning-500';
      case 'info':
      default:
        return 'bg-primary-500';
    }
  };

  return (
    <div 
      className={`fixed z-50 pointer-events-none ${
        isMobile 
          ? 'top-4 left-4 right-4' 
          : 'top-4 right-4 w-96'
      }`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast, index) => {
          const colors = getToastColors(toast.type);
          const progressColor = getProgressColor(toast.type);
          
          return (
            <motion.div
              key={toast.id}
              variants={getAnimationVariant(
                isMobile ? fadeInUp : slideInFromRight, 
                shouldReduceMotion
              )}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ delay: index * 0.1 }}
              className={`mb-3 pointer-events-auto ${colors.bg} border rounded-lg shadow-lg overflow-hidden`}
              style={{ zIndex: 1000 - index }}
              role="alert"
              aria-atomic="true"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getToastIcon(toast.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${colors.text}`}>
                          {toast.title}
                        </h4>
                        {toast.message && (
                          <p className={`text-sm mt-1 ${colors.text} opacity-90`}>
                            {toast.message}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeToast(toast.id)}
                        className={`flex-shrink-0 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.button}`}
                        aria-label="Dismiss notification"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Action Buttons */}
                    {toast.actions && toast.actions.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {toast.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              action.handler();
                              if (action.dismissOnClick !== false) {
                                removeToast(toast.id);
                              }
                            }}
                            className={`text-xs font-medium px-3 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              action.variant === 'primary'
                                ? `bg-${toast.type}-600 text-white hover:bg-${toast.type}-700`
                                : `${colors.button} hover:bg-${toast.type}-100`
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              {toast.duration && toast.duration > 0 && (
                <motion.div
                  className={`h-1 ${progressColor}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    duration: toast.duration / 1000, 
                    ease: 'linear' 
                  }}
                  onAnimationComplete={() => {
                    if (!toast.persistent) {
                      removeToast(toast.id);
                    }
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};



export default ToastNotifications;