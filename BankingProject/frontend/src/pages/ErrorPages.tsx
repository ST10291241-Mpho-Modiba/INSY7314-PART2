import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  ServerIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { fadeInUp, scaleIn, staggerContainer } from '../utils/animations';

// 404 - Not Found Page
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl w-full text-center"
      >
        <motion.div variants={scaleIn} className="mb-8">
          <div className="relative inline-block">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-9xl font-bold text-blue-600 dark:text-blue-400 opacity-20 select-none"
            >
              404
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
                <HomeIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ delay: 0.2 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Oops! The page you're looking for seems to have wandered off.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Don't worry, we'll help you find your way back home.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/dashboard"
              className="flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Dashboard</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View your account overview</p>
              </div>
            </Link>
            <Link
              to="/payments"
              className="flex items-center p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Payments</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Make payments and transfers</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// 500 - Server Error Page
export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-red-900/20 flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl w-full text-center"
      >
        <motion.div variants={scaleIn} className="mb-8">
          <div className="relative inline-block">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-9xl font-bold text-red-600 dark:text-red-400 opacity-20 select-none"
            >
              500
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
                <ServerIcon className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ delay: 0.2 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Server Error
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Our servers are experiencing some difficulties right now.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            We're working hard to fix this issue. Please try again in a few moments.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-yellow-600 dark:text-yellow-400">Investigating</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span>Issue started: Just now</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              <span>Our team has been notified</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estimated resolution: Within 30 minutes</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Network Error Page
export const NetworkErrorPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleCopyError = () => {
    const errorDetails = `Network Error - ${window.location.href} - ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      // Could show a toast notification here
      console.log('Error details copied to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-yellow-900/20 flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl w-full text-center"
      >
        <motion.div variants={scaleIn} className="mb-8">
          <div className="relative inline-block">
            <motion.div
              animate={{ opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-9xl font-bold text-yellow-600 dark:text-yellow-400 opacity-20 select-none"
            >
              NET
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
                <WifiIcon className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ delay: 0.2 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Connection Lost
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            It looks like your connection to our servers has been interrupted.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Please check your internet connection and try again.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Retry Connection
          </button>
          <button
            onClick={handleCopyError}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
            Copy Error
          </button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Troubleshooting Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Check your connection</h3>
                <p>Ensure you're connected to the internet</p>
              </div>
            </div>
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Try refreshing</h3>
                <p>Press F5 or click the retry button above</p>
              </div>
            </div>
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Clear cache</h3>
                <p>Clear your browser cache and cookies</p>
              </div>
            </div>
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Contact support</h3>
                <p>If the problem persists, get help</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Maintenance Page
export const MaintenancePage: React.FC<{ estimatedCompletion?: Date }> = ({ estimatedCompletion }) => {
  const navigate = useNavigate();

  const formatEstimatedTime = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl w-full text-center"
      >
        <motion.div variants={scaleIn} className="mb-8">
          <div className="relative inline-block">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center"
            >
              <ClockIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ delay: 0.2 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Scheduled Maintenance
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            We'll be back online shortly. Thank you for your patience.
          </p>
        </motion.div>

        {estimatedCompletion && (
          <motion.div
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Estimated Completion
            </h2>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {formatEstimatedTime(estimatedCompletion)}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              from now ({estimatedCompletion.toLocaleTimeString()})
            </p>
          </motion.div>
        )}

        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What to expect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Enhanced Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">New security features</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Better Performance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Faster loading times</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">New Features</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exciting new functionality</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3 mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Bug Fixes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Various improvements</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default {
  NotFoundPage,
  ServerErrorPage,
  NetworkErrorPage,
  MaintenancePage
};