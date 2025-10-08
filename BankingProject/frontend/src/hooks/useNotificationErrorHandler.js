import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import errorHandler from '../utils/errorHandler';

// Hook to integrate error handler with notification system
export const useNotificationErrorHandler = () => {
  const notifications = useNotifications();

  useEffect(() => {
    // Make notification system globally available for error handler
    window.notificationSystem = notifications;

    // Enhanced error handler methods
    const enhancedErrorHandler = {
      ...errorHandler,
      
      // Enhanced API error handler with notifications
      handleApiError: (error, context = {}) => {
        const errorMessage = errorHandler.getApiErrorMessage(error);
        const status = error.response?.status;
        
        // Report the error
        errorHandler.reportError({
          type: 'api',
          message: error.message,
          status: status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          context,
          timestamp: new Date().toISOString(),
        });

        // Show appropriate notification based on error type
        if (status === 401) {
          notifications.showSecurity(
            'Authentication Required',
            'Your session has expired. Please log in again.',
            {
              persistent: true,
              actions: [
                {
                  label: 'Login',
                  handler: () => {
                    window.location.href = '/';
                  },
                  primary: true
                }
              ]
            }
          );
        } else if (status === 403) {
          notifications.addNotification({
            type: 'warning',
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            duration: 8000
          });
        } else if (status >= 500) {
          notifications.addNotification({
            type: 'error',
            title: 'Server Error',
            message: 'Our servers are experiencing issues. Please try again later.',
            actions: [
              {
                label: 'Retry',
                handler: () => {
                  window.location.reload();
                }
              },
              {
                label: 'Contact Support',
                handler: () => {
                  window.open('mailto:support@bankingapp.com', '_blank');
                }
              }
            ]
          });
        } else {
          notifications.addNotification({
            type: 'error',
            title: 'Request Failed',
            message: errorMessage
          });
        }

        return errorMessage;
      },

      // Enhanced network error handler
      handleNetworkError: (error) => {
        const errorMessage = errorHandler.handleNetworkError(error);
        
        if (!navigator.onLine) {
          notifications.addNotification({
            type: 'warning',
            title: 'You\'re Offline',
            message: 'Some features may not be available. We\'ll sync your data when you\'re back online.',
            persistent: true,
            actions: [
              {
                label: 'View Offline Mode',
                handler: () => {
                  window.location.href = '/offline';
                }
              }
            ]
          });
        } else {
          notifications.addNotification({
            type: 'error',
            title: 'Network Error',
            message: 'Please check your connection and try again.',
            actions: [
              {
                label: 'Retry',
                handler: () => {
                  window.location.reload();
                }
              }
            ]
          });
        }

        return errorMessage;
      },

      // Enhanced validation error handler
      handleValidationError: (errors, context = {}) => {
        const errorMessage = errorHandler.handleValidationError(errors);
        
        notifications.addNotification({
          type: 'warning',
          title: 'Validation Error',
          message: errorMessage,
          duration: 6000
        });

        return errorMessage;
      },

      // Transaction error handler
      handleTransactionError: (error, transactionData = {}) => {
        const errorData = {
          type: 'transaction',
          message: error.message,
          transactionId: transactionData.id,
          amount: transactionData.amount,
          recipient: transactionData.recipient,
          timestamp: new Date().toISOString(),
        };

        errorHandler.reportError(errorData);

        notifications.addNotification({
          type: 'error',
          title: 'Transaction Failed',
          message: `Your transaction could not be processed. ${error.message}`,
          persistent: true,
          actions: [
            {
              label: 'Retry Transaction',
              handler: () => {
                // Implement retry logic
                console.log('Retrying transaction:', transactionData);
              },
              primary: true
            },
            {
              label: 'Contact Support',
              handler: () => {
                window.open('mailto:support@bankingapp.com?subject=Transaction Failed', '_blank');
              }
            }
          ]
        });

        return error.message;
      },

      // Security alert handler
      handleSecurityAlert: (alertType, message, severity = 'high') => {
        const alertData = {
          type: 'security',
          alertType,
          message,
          severity,
          timestamp: new Date().toISOString(),
        };

        errorHandler.reportError(alertData);

        notifications.showSecurity(
          'Security Alert',
          message,
          {
            persistent: severity === 'high',
            actions: [
              {
                label: 'Review Account',
                handler: () => {
                  window.location.href = '/account/security';
                },
                primary: true
              },
              {
                label: 'Contact Support',
                handler: () => {
                  window.open('mailto:security@bankingapp.com', '_blank');
                }
              }
            ]
          }
        );
      },

      // Success notification helper
      showSuccess: (title, message, options = {}) => {
        notifications.showSuccess(title, message, options);
      },

      // Info notification helper
      showInfo: (title, message, options = {}) => {
        notifications.showInfo(title, message, options);
      },

      // System notification helper
      showSystemNotification: (title, message, options = {}) => {
        notifications.showSystem(title, message, options);
      }
    };

    // Make enhanced error handler globally available
    window.errorHandler = enhancedErrorHandler;

    // Cleanup function
    return () => {
      delete window.notificationSystem;
      delete window.errorHandler;
    };
  }, [notifications]);

  return {
    handleApiError: window.errorHandler?.handleApiError || errorHandler.handleApiError,
    handleNetworkError: window.errorHandler?.handleNetworkError || errorHandler.handleNetworkError,
    handleValidationError: window.errorHandler?.handleValidationError || errorHandler.handleValidationError,
    handleTransactionError: window.errorHandler?.handleTransactionError,
    handleSecurityAlert: window.errorHandler?.handleSecurityAlert,
    showSuccess: window.errorHandler?.showSuccess || notifications.showSuccess,
    showInfo: window.errorHandler?.showInfo || notifications.showInfo,
    showSystemNotification: window.errorHandler?.showSystemNotification || notifications.showSystem,
  };
};

export default useNotificationErrorHandler;