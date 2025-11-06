import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon, BugAntIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: string[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastResetTime: number;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastResetTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.resetOnPropsChange && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        key => prevProps[key as keyof Props] !== this.props[key as keyof Props]
      );
      
      if (hasResetKeyChanged && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error reporting service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      console.log('Logging error to service:', {
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  };

  resetErrorBoundary = () => {
    const now = Date.now();
    
    // Prevent rapid resets
    if (now - this.state.lastResetTime < 1000) {
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      lastResetTime: now
    });

    // Clear any pending reset timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  };

  handleRetry = () => {
    if (this.state.errorCount >= this.maxRetries) {
      // Show user-friendly message about max retries
      return;
    }

    // Add delay before retry to prevent rapid retries
    this.resetTimeout = setTimeout(() => {
      this.resetErrorBoundary();
    }, this.retryDelay * this.state.errorCount);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="min-h-[400px] flex items-center justify-center p-4"
        >
          <div className="card-glass p-6 max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-error-500" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl font-semibold mb-2"
            >
              Something went wrong
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 mb-6"
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </motion.p>

            {this.state.errorCount < this.maxRetries ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.resetErrorBoundary}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Reset Component
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="p-3 bg-warning-500/20 rounded-lg">
                  <p className="text-warning-400 text-sm">
                    Maximum retry attempts reached. Please refresh the page or contact support.
                  </p>
                </div>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Refresh Page
                </button>
              </motion.div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-left"
              >
                <summary className="cursor-pointer text-white/60 text-sm hover:text-white flex items-center gap-2">
                  <BugAntIcon className="h-4 w-4" />
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-black/20 rounded-lg text-xs text-white/80 font-mono overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error?.toString()}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              </motion.details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different parts of the application

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastResetTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PaymentErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Log payment-specific errors
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error reporting service
    this.logPaymentError(error, errorInfo);
  }

  logPaymentError = (error: Error, errorInfo: ErrorInfo) => {
    // Log payment-specific errors to external service
    console.log('Logging payment error to service:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: 'payment_processing'
    });
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      lastResetTime: Date.now()
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="min-h-[300px] flex items-center justify-center p-4"
        >
          <div className="card-glass p-6 max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-error-500" />
            </motion.div>

            <h2 className="text-white text-xl font-semibold mb-2">
              Payment Processing Error
            </h2>

            <p className="text-white/60 mb-6">
              There was an error processing your payment. Please try again.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.resetErrorBoundary}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export class TransactionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastResetTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TransactionErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.logTransactionError(error, errorInfo);
  }

  logTransactionError = (error: Error, errorInfo: ErrorInfo) => {
    console.log('Logging transaction error to service:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: 'transaction_display'
    });
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      lastResetTime: Date.now()
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="min-h-[200px] flex items-center justify-center p-4"
        >
          <div className="card-glass p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-warning-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning-500" />
            </div>

            <h3 className="text-white text-lg font-semibold mb-2">
              Transaction Error
            </h3>

            <p className="text-white/60 text-sm mb-4">
              Unable to display transactions. Please try again.
            </p>

            <button
              onClick={this.resetErrorBoundary}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastResetTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.logAuthError(error, errorInfo);
  }

  logAuthError = (error: Error, errorInfo: ErrorInfo) => {
    console.log('Logging auth error to service:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: 'authentication'
    });
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      lastResetTime: Date.now()
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="min-h-screen flex items-center justify-center p-4"
        >
          <div className="card-glass p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="h-10 w-10 text-error-500" />
            </div>

            <h1 className="text-white text-2xl font-bold mb-4">
              Authentication Error
            </h1>

            <p className="text-white/60 mb-6">
              There was an error with your authentication. Please try signing in again.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.resetErrorBoundary}
                className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Sign In Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}