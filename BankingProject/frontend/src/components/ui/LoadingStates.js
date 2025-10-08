import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../hooks/useAccessibility';
import { 
  pulseAnimation, 
  spinAnimation, 
  getAnimationVariant,
  scaleIn 
} from '../../utils/animations';

// Basic Loading Spinner
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  label = 'Loading...' 
}) => {
  const { shouldReduceMotion } = useAccessibility();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        variants={getAnimationVariant(spinAnimation, shouldReduceMotion)}
        animate="animate"
      >
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Loading Button
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  className = '',
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative ${className} ${loading ? 'cursor-not-allowed' : ''}`}
      aria-busy={loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {loading ? loadingText : children}
      </span>
    </button>
  );
};

// Skeleton Loader
export const Skeleton = ({ 
  className = '', 
  width, 
  height, 
  rounded = false,
  animate = true 
}) => {
  const { shouldReduceMotion } = useAccessibility();
  
  const baseClasses = `bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'}`;
  const animationClasses = animate && !shouldReduceMotion ? 'animate-pulse' : '';
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${animationClasses} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Account Loading Skeleton
export const AccountLoadingSkeleton = () => {
  return (
    <div className="space-y-4" role="status" aria-label="Loading account information">
      {/* Balance Card Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="120px" height="20px" />
          <Skeleton width="80px" height="16px" />
        </div>
        <Skeleton width="200px" height="32px" className="mb-2" />
        <Skeleton width="150px" height="16px" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <Skeleton width="100px" height="20px" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton width="48px" height="48px" rounded className="mx-auto mb-2" />
              <Skeleton width="60px" height="16px" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Transaction List Skeleton
export const TransactionListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Loading transactions">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-4">
            <Skeleton width="40px" height="40px" rounded />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="16px" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton width="100px" height="14px" />
                <Skeleton width="60px" height="14px" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Payment Processing Animation
export const PaymentProcessingAnimation = ({ step = 1, steps = 3 }) => {
  const { shouldReduceMotion } = useAccessibility();
  
  const stepLabels = [
    'Verifying payment details',
    'Processing transaction',
    'Confirming payment'
  ];

  return (
    <div className="text-center py-8" role="status" aria-label="Processing payment">
      <motion.div
        className="mb-6"
        variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
        initial="initial"
        animate="animate"
      >
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
          <motion.div
            className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Processing Payment
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        {stepLabels[step - 1] || 'Processing...'}
      </p>
      
      {/* Progress Steps */}
      <div className="flex justify-center items-center space-x-4">
        {[...Array(steps)].map((_, i) => (
          <React.Fragment key={i}>
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i < step 
                  ? 'bg-primary-600' 
                  : i === step 
                    ? 'bg-primary-400 animate-pulse' 
                    : 'bg-gray-300'
              }`}
            />
            {i < steps - 1 && (
              <div
                className={`w-8 h-0.5 transition-colors duration-300 ${
                  i < step - 1 ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Page Loading Overlay
export const PageLoadingOverlay = ({ message = 'Loading...', transparent = false }) => {
  const { shouldReduceMotion } = useAccessibility();
  
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent ? 'bg-white/80' : 'bg-white'
      } backdrop-blur-sm`}
      variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
      initial="initial"
      animate="animate"
      exit="exit"
      role="status"
      aria-label={message}
    >
      <div className="text-center">
        <LoadingSpinner size="xl" className="mb-4" />
        <p className="text-lg font-medium text-gray-900">{message}</p>
      </div>
    </motion.div>
  );
};

// Progress Bar
export const ProgressBar = ({ 
  progress = 0, 
  className = '',
  showPercentage = true,
  color = 'primary',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  };

  return (
    <div className={className} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Shimmer Effect
export const ShimmerEffect = ({ className = '', children }) => {
  const { shouldReduceMotion } = useAccessibility();
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

// Loading Card
export const LoadingCard = ({ className = '', children, loading = true }) => {
  if (!loading) return children;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <ShimmerEffect className="p-6">
        <div className="space-y-4">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="100%" height="16px" />
          <Skeleton width="80%" height="16px" />
          <div className="flex gap-4 mt-6">
            <Skeleton width="100px" height="36px" />
            <Skeleton width="100px" height="36px" />
          </div>
        </div>
      </ShimmerEffect>
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingButton,
  Skeleton,
  AccountLoadingSkeleton,
  TransactionListSkeleton,
  PaymentProcessingAnimation,
  PageLoadingOverlay,
  ProgressBar,
  ShimmerEffect,
  LoadingCard
};