// Global error handler for unhandled promise rejections and JavaScript errors
import { toast } from 'sonner';

class GlobalErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.errorCounts = new Map();
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Handle JavaScript errors
    window.addEventListener('error', this.handleJavaScriptError.bind(this));
    
    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError.bind(this), true);
  }

  handleUnhandledRejection(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    const error = {
      type: 'unhandledRejection',
      reason: event.reason,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.processError(error);
    
    // Prevent the default browser behavior
    event.preventDefault();
  }

  handleJavaScriptError(event) {
    // Skip resource loading errors (handled separately)
    if (event.target !== window) return;

    console.error('JavaScript Error:', event.error);
    
    const error = {
      type: 'javascriptError',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.processError(error);
  }

  handleResourceError(event) {
    // Only handle resource loading errors
    if (event.target === window) return;

    const target = event.target;
    const resourceType = target.tagName?.toLowerCase();
    
    if (['img', 'script', 'link', 'iframe'].includes(resourceType)) {
      console.error('Resource Loading Error:', target.src || target.href);
      
      const error = {
        type: 'resourceError',
        resourceType,
        src: target.src || target.href,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      this.processError(error);
    }
  }

  processError(error) {
    // Check if this error type is occurring too frequently
    const errorKey = this.getErrorKey(error);
    const count = this.errorCounts.get(errorKey) || 0;
    
    if (count >= this.maxRetries) {
      console.warn('Error occurred too many times, suppressing:', errorKey);
      return;
    }
    
    this.errorCounts.set(errorKey, count + 1);
    
    // Add to error queue
    this.errorQueue.push(error);
    
    // Process errors if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
    
    // Show user-friendly notification
    this.showUserNotification(error);
    
    // Log to external service
    this.logToExternalService(error);
  }

  getErrorKey(error) {
    switch (error.type) {
      case 'unhandledRejection':
        return `rejection_${error.reason?.message || 'unknown'}`;
      case 'javascriptError':
        return `js_${error.filename}_${error.lineno}`;
      case 'resourceError':
        return `resource_${error.resourceType}_${error.src}`;
      default:
        return `unknown_${error.type}`;
    }
  }

  async processErrorQueue() {
    this.isProcessing = true;
    
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      
      try {
        await this.handleError(error);
      } catch (handlingError) {
        console.error('Error while handling error:', handlingError);
      }
      
      // Small delay to prevent overwhelming
      await this.delay(100);
    }
    
    this.isProcessing = false;
  }

  async handleError(error) {
    switch (error.type) {
      case 'unhandledRejection':
        await this.handlePromiseRejection(error);
        break;
      case 'javascriptError':
        await this.handleJSError(error);
        break;
      case 'resourceError':
        await this.handleResourceLoadError(error);
        break;
      default:
        console.warn('Unknown error type:', error.type);
    }
  }

  async handlePromiseRejection(error) {
    // Try to extract meaningful information from the rejection
    const reason = error.reason;
    
    if (reason?.name === 'NetworkError' || reason?.message?.includes('fetch')) {
      // Network-related promise rejection
      this.handleNetworkError(reason);
    } else if (reason?.name === 'TypeError') {
      // Type error in promise
      console.error('Type error in promise:', reason);
    } else {
      // Generic promise rejection
      console.error('Promise rejected:', reason);
    }
  }

  async handleJSError(error) {
    // Check if it's a critical error that should reload the page
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error);
    } else {
      // Log non-critical error
      console.error('Non-critical JS error:', error);
    }
  }

  async handleResourceLoadError(error) {
    const { resourceType, src } = error;
    
    switch (resourceType) {
      case 'script':
        console.error('Script failed to load:', src);
        // Could try to reload the script or show fallback
        break;
      case 'img':
        console.error('Image failed to load:', src);
        // Could replace with placeholder image
        this.handleImageLoadError(src);
        break;
      case 'link':
        console.error('Stylesheet failed to load:', src);
        // Could try to reload stylesheet
        break;
      default:
        console.error('Resource failed to load:', src);
    }
  }

  handleNetworkError(error) {
    // Check if user is offline
    if (!navigator.onLine) {
      toast.warning('You appear to be offline. Some features may not work.');
      return;
    }
    
    // Network error while online
    toast.error('Network error occurred. Please check your connection.');
  }

  handleImageLoadError(src) {
    // Find all images with the failed src and replace with placeholder
    const images = document.querySelectorAll(`img[src="${src}"]`);
    images.forEach(img => {
      img.src = '/placeholder-image.svg';
      img.alt = 'Image failed to load';
    });
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /Cannot read prop/,
      /is not a function/,
      /Maximum call stack/,
      /Out of memory/
    ];
    
    return criticalPatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }

  handleCriticalError(error) {
    console.error('Critical error detected:', error);
    
    // Show critical error notification
    toast.error('A critical error occurred. The page will reload.', {
      duration: 5000,
      action: {
        label: 'Reload Now',
        onClick: () => window.location.reload()
      }
    });
    
    // Auto-reload after delay
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }

  showUserNotification(error) {
    // Don't show notifications for resource errors (too noisy)
    if (error.type === 'resourceError') return;
    
    // Don't show too many notifications
    const errorKey = this.getErrorKey(error);
    const count = this.errorCounts.get(errorKey) || 0;
    
    if (count > 1) return;
    
    switch (error.type) {
      case 'unhandledRejection':
        if (error.reason?.name === 'NetworkError') {
          toast.warning('Connection issue detected. Please check your network.');
        } else {
          toast.error('An unexpected error occurred. Our team has been notified.');
        }
        break;
      case 'javascriptError':
        if (this.isCriticalError(error)) {
          // Critical error notification handled separately
          return;
        }
        toast.warning('A minor issue was detected and has been reported.');
        break;
      default:
        toast.error('An unexpected error occurred.');
    }
  }

  logToExternalService(error) {
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to error reporting service
        // errorReportingService.captureException(error);
        
        // For now, just log to console in a structured way
        console.group('🚨 Error Report');
        console.error('Type:', error.type);
        console.error('Timestamp:', error.timestamp);
        console.error('URL:', error.url);
        console.error('Details:', error);
        console.groupEnd();
        
        // Could also send to your own logging endpoint
        this.sendToLoggingEndpoint(error);
      } catch (loggingError) {
        console.error('Failed to log error to external service:', loggingError);
      }
    }
  }

  async sendToLoggingEndpoint(error) {
    try {
      // Example logging endpoint call
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          sessionId: this.getSessionId(),
          userId: this.getUserId()
        })
      });
    } catch (fetchError) {
      console.error('Failed to send error to logging endpoint:', fetchError);
    }
  }

  getSessionId() {
    // Get or generate session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  getUserId() {
    // Get user ID from your auth system
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to manually report errors
  reportError(error, context = {}) {
    const errorReport = {
      type: 'manual',
      error: error.toString(),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.processError(errorReport);
  }

  // Method to clear error counts (useful for testing)
  clearErrorCounts() {
    this.errorCounts.clear();
  }

  // Method to get error statistics
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorTypes: Object.fromEntries(this.errorCounts),
      queueLength: this.errorQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Create global instance
const globalErrorHandler = new GlobalErrorHandler();

// Export for manual error reporting
export const reportError = (error, context) => {
  globalErrorHandler.reportError(error, context);
};

export const getErrorStats = () => {
  return globalErrorHandler.getErrorStats();
};

export const clearErrorCounts = () => {
  globalErrorHandler.clearErrorCounts();
};

export default globalErrorHandler;