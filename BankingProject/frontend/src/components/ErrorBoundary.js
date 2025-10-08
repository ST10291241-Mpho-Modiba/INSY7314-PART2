import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { fadeInUp, scaleIn } from '../utils/animations';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // In a real app, you would send this to your error reporting service
    // like Sentry, LogRocket, or Bugsnag
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };
      
      // Example: Send to error reporting service
      // errorReportingService.captureException(errorData);
      console.log('Error logged:', errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center"
          >
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
            </motion.div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
                className="mb-6 p-4 bg-red-50 rounded-lg text-left"
              >
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Error Details (Development Mode):
                </h3>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 overflow-auto max-h-24">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}

            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </motion.div>

            {this.state.retryCount > 0 && (
              <motion.p
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
                className="mt-4 text-xs text-gray-500"
              >
                Retry attempts: {this.state.retryCount}
              </motion.p>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different parts of the app
export class PaymentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Payment Error:', error, errorInfo);
    
    // Report payment-specific errors
    if (this.props.onPaymentError) {
      this.props.onPaymentError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="p-6 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-sm font-medium text-red-800">
              Payment Error
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-4">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export class TransactionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Transaction Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">
              Transaction Display Error
            </h4>
          </div>
          <p className="text-sm text-yellow-700">
            Unable to display transaction details. Please refresh the page.
          </p>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    console.error('Async Error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;