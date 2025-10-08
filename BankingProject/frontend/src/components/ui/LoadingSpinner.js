import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colors = {
    primary: 'text-primary-600',
    accent: 'text-accent-600',
    white: 'text-white',
    neutral: 'text-neutral-600'
  };

  const SpinnerIcon = () => (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]}`}
      fill="none"
      viewBox="0 0 24 24"
    >
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
  );

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizes[size]} ${colors[color]} bg-current rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <motion.div
      className={`${sizes[size]} ${colors[color]} bg-current rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
      }}
    />
  );

  const BarsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`w-1 ${colors[color]} bg-current rounded-full`}
          style={{ height: size === 'xs' ? '16px' : size === 'sm' ? '24px' : size === 'md' ? '32px' : size === 'lg' ? '48px' : '64px' }}
          animate={{
            scaleY: [1, 2, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'bars':
        return <BarsSpinner />;
      default:
        return <SpinnerIcon />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`mt-3 text-sm ${colors[color]} font-medium`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// Skeleton loader component
export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-neutral-200 rounded';
  
  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };

  const style = {
    width: width || (variant === 'circular' ? height : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
    />
  );
};

// Loading overlay component
export const LoadingOverlay = ({ isLoading, children, text = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
        >
          <LoadingSpinner text={text} />
        </motion.div>
      )}
    </div>
  );
};

export default LoadingSpinner;