import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      persistent: false,
      announced: false,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove non-persistent toasts
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title, message, options = {}) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const showError = useCallback((title, message, options = {}) => {
    return addToast({ 
      type: 'error', 
      title, 
      message, 
      duration: 8000, // Longer duration for errors
      ...options 
    });
  }, [addToast]);

  const showWarning = useCallback((title, message, options = {}) => {
    return addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const showInfo = useCallback((title, message, options = {}) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    updateToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;