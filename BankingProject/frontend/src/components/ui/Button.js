import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 focus:ring-primary-500 shadow-sm hover:shadow-md',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-500 shadow-lg hover:shadow-xl',
    danger: 'bg-error-600 hover:bg-error-700 text-white focus:ring-error-500 shadow-lg hover:shadow-xl',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-primary-500',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500',
    glassmorphism: 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 focus:ring-white/50 shadow-glass'
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const LoadingSpinner = () => (
    <svg className={`animate-spin ${iconSizes[size]} mr-2`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (!icon) return null;
    
    const iconElement = React.cloneElement(icon, {
      className: `${iconSizes[size]} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`
    });
    
    return iconElement;
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </motion.button>
  );
};

export default Button;