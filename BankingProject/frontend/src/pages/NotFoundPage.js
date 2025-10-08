import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  HomeIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

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
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: { delay: 0.2, duration: 0.5, type: "spring" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-lg w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 404 Icon */}
        <motion.div 
          className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-8"
          variants={iconVariants}
        >
          <ExclamationTriangleIcon className="h-12 w-12 text-blue-600" />
        </motion.div>

        {/* Error Code */}
        <motion.h1 
          className="text-6xl font-bold text-blue-600 mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          404
        </motion.h1>

        {/* Error Message */}
        <motion.h2 
          className="text-2xl font-semibold text-gray-900 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Page Not Found
        </motion.h2>

        <motion.p 
          className="text-gray-600 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Sorry, we couldn't find the page you're looking for. The page might have been moved, 
          deleted, or you might have entered an incorrect URL.
        </motion.p>

        {/* Search Suggestion */}
        <motion.div 
          className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-gray-700 font-medium">Looking for something specific?</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Link 
              to="/dashboard" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Dashboard
            </Link>
            <Link 
              to="/payments" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Payments
            </Link>
            <Link 
              to="/profile" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Profile
            </Link>
            <Link 
              to="/help" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Help Center
            </Link>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </motion.div>

        {/* Support Contact */}
        <motion.div 
          className="mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            Still need help?{' '}
            <a 
              href="mailto:support@bankingapp.com" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;