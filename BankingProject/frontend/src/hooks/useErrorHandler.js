import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { handleApiError, handleNetworkError, handleValidationError } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const { showError } = useToast();

  const handleError = useCallback((error, context = {}) => {
    let userMessage = '';
    
    // Determine error type and get appropriate message
    if (error.response) {
      // API error
      userMessage = handleApiError(error, context);
    } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      // Network error
      userMessage = handleNetworkError(error);
    } else if (error.name === 'ValidationError' || error.type === 'validation') {
      // Validation error
      userMessage = handleValidationError(error.errors || error.message);
    } else {
      // Generic error
      userMessage = error.message || 'An unexpected error occurred';
    }

    // Show user-friendly error message
    showError(
      'Error',
      userMessage,
      { duration: 5000 }
    );

    return userMessage;
  }, [showError]);

  const clearError = useCallback(() => {
    // Error clearing is now handled by toast dismissal
    // No global error state to clear
  }, []);

  const handleAsyncError = useCallback(async (asyncFn, context = {}) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so calling code can handle if needed
    }
  }, [handleError]);

  const withErrorHandling = useCallback((fn, context = {}) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, context);
        return null; // Return null on error
      }
    };
  }, [handleError]);

  return {
    handleError,
    clearError,
    handleAsyncError,
    withErrorHandling,
  };
};