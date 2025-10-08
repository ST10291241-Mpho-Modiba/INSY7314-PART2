import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  WifiIcon, 
  HomeIcon, 
  ArrowPathIcon,
  SignalSlashIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkErrorPage = ({ onRetry }) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Simulate network check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onRetry) {
        await onRetry();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -90 },
    visible: { 
      scale: 1,
      rotate: 0,
      transition: { delay: 0.2, duration: 0.7, type: "spring" }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-lg w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Network Status Icon */}
        <motion.div 
          className={`mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-8 ${
            isOnline ? 'bg-green-100' : 'bg-orange-100'
          }`}
          variants={iconVariants}
          animate={!isOnline ? pulseVariants.pulse : {}}
        >
          <AnimatePresence mode="wait">
            {isOnline ? (
              <motion.div
                key="online"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ duration: 0.5 }}
              >
                <SignalSlashIcon className="h-12 w-12 text-orange-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Connection Status */}
        <AnimatePresence mode="wait">
          {isOnline ? (
            <motion.div
              key="online-status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-semibold text-green-600 mb-4">
                Connection Restored!
              </h1>
              <p className="text-gray-600 mb-8">
                Your internet connection has been restored. You can now continue using the application.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="offline-status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                Connection Problem
              </h1>
              <p className="text-gray-600 mb-8">
                We're having trouble connecting to our servers. This could be due to a network issue 
                or temporary service interruption.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Troubleshooting Steps */}
        {!isOnline && (
          <motion.div 
            className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
              Troubleshooting Steps
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  1
                </span>
                <span>Check your internet connection and WiFi settings</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  2
                </span>
                <span>Try refreshing the page or restarting your browser</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  3
                </span>
                <span>Disable VPN or proxy if you're using one</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  4
                </span>
                <span>Contact your internet service provider if the problem persists</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Retry Information */}
        {retryCount > 0 && (
          <motion.div 
            className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-blue-800">
              Retry attempts: {retryCount}
              {retryCount >= 3 && (
                <span className="block mt-1 text-blue-600">
                  Consider checking your network connection
                </span>
              )}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Go Back
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Home
          </Link>
        </motion.div>

        {/* Offline Mode Link */}
        {!isOnline && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Link
              to="/offline"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Continue in offline mode
            </Link>
          </motion.div>
        )}

        {/* Support Contact */}
        <motion.div 
          className="mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            Still having trouble?{' '}
            <a 
              href="mailto:support@bankingapp.com" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contact support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NetworkErrorPage;