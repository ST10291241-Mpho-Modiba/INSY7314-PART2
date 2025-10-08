// Global error handling utilities

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Handle JavaScript errors
    window.addEventListener('error', this.handleError);
    
    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError, true);
  }

  handleUnhandledRejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    this.reportError({
      type: 'unhandledRejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
    });

    // Show user-friendly error message
    this.showUserError('Something went wrong. Please try again.');
    
    // Prevent the default browser error handling
    event.preventDefault();
  };

  handleError = (event) => {
    console.error('JavaScript error:', event.error);
    
    this.reportError({
      type: 'javascript',
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
    });
  };

  handleResourceError = (event) => {
    if (event.target !== window) {
      console.error('Resource loading error:', event.target);
      
      this.reportError({
        type: 'resource',
        message: `Failed to load resource: ${event.target.src || event.target.href}`,
        element: event.target.tagName,
        timestamp: new Date().toISOString(),
      });
    }
  };

  reportError = (errorData) => {
    // Add additional context
    const report = {
      ...errorData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: this.getSessionId(),
    };

    // Store error locally for offline scenarios
    this.storeErrorLocally(report);

    // Send to monitoring service (implement based on your service)
    this.sendToMonitoringService(report);
  };

  storeErrorLocally = (errorData) => {
    try {
      const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors to prevent storage overflow
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  };

  sendToMonitoringService = async (errorData) => {
    try {
      // In production, replace with your actual monitoring service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
      
      console.log('Error reported:', errorData);
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  };

  showUserError = (message, title = 'Error', options = {}) => {
    // Integrate with notification system
    if (window.notificationSystem && typeof window.notificationSystem.showError === 'function') {
      window.notificationSystem.showError(title, message, {
        duration: 8000,
        persistent: options.persistent || false,
        actions: options.actions || [],
        ...options
      });
    } else {
      // Ultimate fallback to console (safe fallback)
      console.error(`${title}: ${message}`);
      
      // Try to show a simple alert as last resort for critical errors
      if (options.critical) {
        try {
          alert(`${title}: ${message}`);
        } catch (e) {
          // Even alert failed, just log
          console.error('Failed to show error alert:', e);
        }
      }
    }
  };

  getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  // API error handler
  handleApiError = (error, context = {}) => {
    const errorData = {
      type: 'api',
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      context,
      timestamp: new Date().toISOString(),
    };

    this.reportError(errorData);

    // Return user-friendly error message
    return this.getApiErrorMessage(error);
  };

  getApiErrorMessage = (error) => {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.';
    }

    const status = error.response.status;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  // Network error handler
  handleNetworkError = (error) => {
    const errorData = {
      type: 'network',
      message: 'Network connection failed',
      online: navigator.onLine,
      timestamp: new Date().toISOString(),
    };

    this.reportError(errorData);

    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your connection.';
    }

    return 'Network error. Please check your connection and try again.';
  };

  // Validation error handler
  handleValidationError = (errors) => {
    const errorData = {
      type: 'validation',
      errors: errors,
      timestamp: new Date().toISOString(),
    };

    this.reportError(errorData);

    // Return formatted validation messages
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }

    if (typeof errors === 'object') {
      return Object.values(errors).flat().join(', ');
    }

    return 'Please check your input and try again.';
  };

  // Clean up
  destroy = () => {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('error', this.handleResourceError, true);
  };
}

// Create global instance
const errorHandler = new ErrorHandler();

export default errorHandler;

// Export specific handlers for use in components
export const {
  handleApiError,
  handleNetworkError,
  handleValidationError,
  reportError,
} = errorHandler;