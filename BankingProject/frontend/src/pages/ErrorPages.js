import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  HomeIcon, 
  ArrowPathIcon,
  WifiIcon,
  ServerIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { fadeInUp, scaleIn, staggerContainer, staggerItem } from '../utils/animations';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

// 404 Not Found Page
export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-lg w-full text-center"
      >
        <motion.div variants={staggerItem} className="mb-8">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <MagnifyingGlassIcon className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to your banking dashboard.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerItem}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </motion.div>

        <motion.div variants={staggerItem} className="mt-8">
          <p className="text-sm text-gray-500">
            Need help? <Link to="/support" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// 500 Server Error Page
export const ServerErrorPage = ({ onRetry }) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ServerIcon className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Server Error
          </h1>
          <p className="text-gray-600 mb-6">
            We're experiencing technical difficulties. Our team has been notified 
            and is working to resolve the issue.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              What you can do:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Wait a few minutes and try again</li>
              <li>• Check our status page for updates</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={handleRetry}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </motion.div>

        {retryCount > 0 && (
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-gray-500"
          >
            Retry attempts: {retryCount}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

// Network Error Page
export const NetworkErrorPage = ({ onRetry }) => {
  const { isOnline, offlineDuration } = useOfflineStatus();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <WifiIcon className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Connection Problem
          </h1>
          <p className="text-gray-600 mb-6">
            {isOnline 
              ? "We're having trouble connecting to our servers. Please check your internet connection."
              : `You've been offline for ${offlineDuration}. Some features may be limited.`
            }
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className={`p-4 rounded-lg ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
              {isOnline 
                ? 'Your internet connection is working'
                : 'Check your internet connection and try again'
              }
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={handleRetry}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
          <Link
            to="/offline"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            View Offline Mode
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Offline Mode Page
export const OfflinePage = () => {
  const { queuedTransactions, isOnline } = useOfflineStatus();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOnline) {
      navigate('/');
    }
  }, [isOnline, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={staggerItem} className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <WifiIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Offline Mode
          </h1>
          <p className="text-gray-600">
            You're currently offline. Here's what you can still access:
          </p>
        </motion.div>

        <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Available Features
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                View cached account balance
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Browse recent transactions
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Access account information
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                Queue transactions for later
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Queued Transactions
            </h2>
            {queuedTransactions.length > 0 ? (
              <div className="space-y-2">
                {queuedTransactions.slice(0, 3).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-sm text-gray-700">{transaction.type}</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${transaction.amount}
                    </span>
                  </div>
                ))}
                {queuedTransactions.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{queuedTransactions.length - 3} more transactions
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No transactions queued
              </p>
            )}
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Your queued transactions will be processed automatically when you're back online.
            </p>
          </div>
          
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Access Denied Page
export const AccessDeniedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator 
            or try logging in with a different account.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            to="/login"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Generic Error Page Component
export const ErrorPage = ({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  icon: Icon = ExclamationTriangleIcon,
  onRetry,
  showRetry = true,
  showHome = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {showRetry && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
          {showHome && (
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default {
  NotFoundPage,
  ServerErrorPage,
  NetworkErrorPage,
  OfflinePage,
  AccessDeniedPage,
  ErrorPage
};