import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const baseClasses = 'block w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: `border-neutral-300 focus:border-primary-500 focus:ring-primary-500 ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : success ? 'border-success-500 focus:border-success-500 focus:ring-success-500' : ''}`,
    glassmorphism: 'border-white/30 bg-white/10 backdrop-blur-md text-white placeholder-white/70 focus:border-white/50 focus:ring-white/30'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${icon && iconPosition === 'right' ? 'pr-10' : ''}
    ${isPassword ? 'pr-10' : ''}
    ${className}
  `.trim();

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconElement = React.cloneElement(icon, {
      className: `${iconSizes[size]} ${variant === 'glassmorphism' ? 'text-white/70' : 'text-neutral-400'}`
    });
    
    return (
      <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
        {iconElement}
      </div>
    );
  };

  const renderPasswordToggle = () => {
    if (!isPassword) return null;
    
    return (
      <button
        type="button"
        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${variant === 'glassmorphism' ? 'text-white/70 hover:text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
        onClick={togglePasswordVisibility}
      >
        {showPassword ? (
          <EyeSlashIcon className={iconSizes[size]} />
        ) : (
          <EyeIcon className={iconSizes[size]} />
        )}
      </button>
    );
  };

  const renderStatusIcon = () => {
    if (error) {
      return (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ExclamationCircleIcon className={`${iconSizes[size]} text-error-500`} />
        </div>
      );
    }
    
    if (success) {
      return (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <CheckCircleIcon className={`${iconSizes[size]} text-success-500`} />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`block text-sm font-medium mb-2 ${variant === 'glassmorphism' ? 'text-white' : 'text-neutral-700'}`}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        <motion.input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={classes}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {renderIcon()}
        {isPassword ? renderPasswordToggle() : renderStatusIcon()}
      </div>
      
      {(error || success || helperText) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          {error && (
            <p className="text-sm text-error-600 flex items-center gap-1">
              <ExclamationCircleIcon className="h-4 w-4" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-success-600 flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className={`text-sm ${variant === 'glassmorphism' ? 'text-white/70' : 'text-neutral-500'}`}>
              {helperText}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;