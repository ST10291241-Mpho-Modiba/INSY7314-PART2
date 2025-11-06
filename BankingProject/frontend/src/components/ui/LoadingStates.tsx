import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCardIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Base skeleton component
export const SkeletonLoader: React.FC<{
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}> = ({ className = '', width, height, rounded = true }) => (
  <div 
    className={`bg-white/10 animate-pulse ${rounded ? 'rounded-lg' : 'rounded-none'} ${className}`}
    style={{ width, height }}
  />
);

// Loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'accent';
  className?: string;
}> = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-primary-500',
    white: 'text-white',
    accent: 'text-accent-500'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

// Account loading skeleton
export const AccountLoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <SkeletonLoader width="60%" height="24px" />
      <SkeletonLoader width="80%" height="16px" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/5 p-4 rounded-lg space-y-3">
          <SkeletonLoader width="40%" height="16px" />
          <SkeletonLoader width="70%" height="24px" />
          <SkeletonLoader width="60%" height="14px" />
        </div>
      ))}
    </div>
    
    <div className="space-y-4">
      <SkeletonLoader width="30%" height="20px" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 p-4 rounded-lg space-y-2">
            <SkeletonLoader width="50%" height="16px" />
            <SkeletonLoader width="70%" height="20px" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Transaction list skeleton
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-4">
          <SkeletonLoader width="40px" height="40px" rounded />
          <div className="space-y-2">
            <SkeletonLoader width="120px" height="16px" />
            <SkeletonLoader width="80px" height="14px" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <SkeletonLoader width="80px" height="16px" />
          <SkeletonLoader width="60px" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

// Form loading skeleton
export const FormLoadingSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-4">
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonLoader width="30%" height="16px" />
        <SkeletonLoader width="100%" height="48px" rounded />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <SkeletonLoader width="50%" height="48px" rounded />
      <SkeletonLoader width="50%" height="48px" rounded />
    </div>
  </div>
);

// Payment processing animation
export const PaymentProcessingAnimation: React.FC<{ step: number }> = ({ step }) => {
  const steps = [
    { icon: ShieldCheckIcon, text: 'Validating payment details...', color: 'text-primary-400' },
    { icon: BanknotesIcon, text: 'Processing transaction...', color: 'text-accent-400' },
    { icon: CheckCircleIcon, text: 'Payment sent successfully!', color: 'text-success-400' }
  ];

  const currentStep = steps[step - 1] || steps[0];
  const Icon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        animate={{ rotate: step < 3 ? 360 : 0 }}
        transition={{ duration: 2, repeat: step < 3 ? Infinity : 0, ease: "linear" }}
        className="inline-flex"
      >
        <Icon className={`h-16 w-16 ${currentStep.color}`} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-white text-lg font-semibold">{currentStep.text}</p>
        {step < 3 && (
          <p className="text-white/60 text-sm mt-2">Please wait while we process your payment...</p>
        )}
      </motion.div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < step ? 'bg-primary-400' : 'bg-white/20'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Loading button component
export const LoadingButton: React.FC<{
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  loading, 
  loadingText = 'Loading...', 
  children, 
  className = '', 
  disabled = false,
  type = 'button',
  onClick,
  variant = 'primary',
  size = 'md'
}) => {
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white',
    outline: 'border border-white/20 hover:bg-white/10 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color={variant === 'primary' ? 'white' : 'primary'} />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// QR code loading component
export const QRCodeLoading: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="text-center space-y-4 p-6"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="inline-flex"
    >
      <QrCodeIcon className="h-16 w-16 text-primary-400" />
    </motion.div>
    <p className="text-white/80">Generating QR code...</p>
  </motion.div>
);

// Balance loading component
export const BalanceLoading: React.FC = () => (
  <div className="space-y-3">
    <SkeletonLoader width="40%" height="16px" />
    <SkeletonLoader width="70%" height="32px" />
    <SkeletonLoader width="60%" height="14px" />
  </div>
);

// Transaction status loading
export const TransactionStatusLoading: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg"
  >
    <LoadingSpinner size="sm" />
    <div className="space-y-2">
      <SkeletonLoader width="120px" height="16px" />
      <SkeletonLoader width="80px" height="14px" />
    </div>
  </motion.div>
);

// Multi-step loading component
export const MultiStepLoading: React.FC<{
  steps: string[];
  currentStep: number;
  title?: string;
}> = ({ steps, currentStep, title = 'Processing...' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="text-center space-y-6 p-6"
  >
    <h3 className="text-white text-lg font-semibold">{title}</h3>
    
    <div className="space-y-4">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            index < currentStep ? 'bg-success-500/20' : 
            index === currentStep ? 'bg-primary-500/20' : 
            'bg-white/5'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            index < currentStep ? 'bg-success-500' :
            index === currentStep ? 'bg-primary-500 animate-pulse' :
            'bg-white/20'
          }`}>
            {index < currentStep ? (
              <CheckCircleIcon className="h-4 w-4 text-white" />
            ) : index === currentStep ? (
              <ArrowPathIcon className="h-4 w-4 text-white animate-spin" />
            ) : (
              <span className="text-white text-xs font-semibold">{index + 1}</span>
            )}
          </div>
          <span className={`text-sm ${
            index <= currentStep ? 'text-white' : 'text-white/60'
          }`}>
            {step}
          </span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// Error loading component
export const ErrorLoading: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Something went wrong', onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="text-center space-y-4 p-6"
  >
    <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <div>
      <p className="text-white font-medium">{message}</p>
      <p className="text-white/60 text-sm mt-1">Please try again or contact support if the issue persists.</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
      >
        Try Again
      </button>
    )}
  </motion.div>
);

// Empty state component
export const EmptyState: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="text-center space-y-4 p-6"
  >
    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
      <Icon className="w-8 h-8 text-white/60" />
    </div>
    <div>
      <h3 className="text-white text-lg font-semibold">{title}</h3>
      <p className="text-white/60 text-sm mt-1">{description}</p>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

// Success loading component
export const SuccessLoading: React.FC<{
  message: string;
  submessage?: string;
}> = ({ message, submessage }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="text-center space-y-4 p-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
      className="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mx-auto"
    >
      <CheckCircleIcon className="w-8 h-8 text-success-500" />
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <p className="text-white text-lg font-semibold">{message}</p>
      {submessage && (
        <p className="text-white/60 text-sm mt-1">{submessage}</p>
      )}
    </motion.div>
  </motion.div>
);

export default {
  SkeletonLoader,
  LoadingSpinner,
  AccountLoadingSkeleton,
  TransactionListSkeleton,
  FormLoadingSkeleton,
  PaymentProcessingAnimation,
  QRCodeLoading,
  BalanceLoading,
  TransactionStatusLoading,
  MultiStepLoading,
  ErrorLoading,
  EmptyState,
  SuccessLoading,
  LoadingButton
};