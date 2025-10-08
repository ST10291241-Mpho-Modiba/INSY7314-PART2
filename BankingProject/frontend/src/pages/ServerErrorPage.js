import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ServerIcon, 
  HomeIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ServerErrorPage = ({ errorId, errorMessage }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const copyErrorId = () => {
    if (errorId) {
      navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1,
      rotate: 0,
      transition: { delay: 0.2, duration: 0.7, type: "spring" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-lg w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Server Error Icon */}
        <motion.div 
          className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-8"
          variants={iconVariants}
        >
          <ServerIcon className="h-12 w-12 text-red-600" />
        </motion.div>

        {/* Error Code */}
        <motion.h1 
          className="text-6xl font-bold text-red-600 mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          500
        </motion.h1>

        {/* Error Message */}
        <motion.h2 
          className="text-2xl font-semibold text-gray-900 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Server Error
        </motion.h2>

        <motion.p 
          className="text-gray-600 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {errorMessage || 
            "We're experiencing some technical difficulties on our end. Our team has been notified and is working to resolve the issue."
          }
        </motion.p>

        {/* Error ID Display */}
        {errorId && (
          <motion.div 
            className="bg-white rounded-lg border border-gray-200 p-4 mb-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Error ID:</span>
              </div>
              <button
                onClick={copyErrorId}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-2 font-mono text-sm text-gray-800 bg-gray-50 p-2 rounded border">
              {errorId}
            </div>
          </motion.div>
        )}

        {/* Status Information */}
        <motion.div 
          className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h3 className="text-lg font-medium text-blue-900 mb-3">What's happening?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Our servers are experiencing temporary issues</p>
            <p>• Your data and account information are safe</p>
            <p>• We're working to restore normal service</p>
            <p>• You can try refreshing the page in a few minutes</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Try Again
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

        {/* Support Contact */}
        <motion.div 
          className="mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p className="text-sm text-gray-500 mb-2">
            If the problem persists, please contact our support team:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a 
              href="mailto:support@bankingapp.com" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              support@bankingapp.com
            </a>
            <a 
              href="tel:+1-800-BANKING" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              1-800-BANKING
            </a>
          </div>
          {errorId && (
            <p className="text-xs text-gray-400 mt-2">
              Please include the error ID when contacting support
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ServerErrorPage;