import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, label, description, size = 'md', disabled = false, className = '', id: providedId, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-9 h-5 after:h-3 after:w-3',
      md: 'w-11 h-6 after:h-4 after:w-4',
      lg: 'w-14 h-7 after:h-5 after:w-5'
    };
    const id = providedId || `switch-${Math.random().toString(36).slice(2)}`;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange?.(!checked);
      }
    };

    return (
      <label className={clsx('inline-flex items-center cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
          id={id}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          {...props}
        />
        <div
          className={clsx(
            'relative rounded-full transition-colors duration-200 ease-in-out',
            'bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500',
            'peer-checked:bg-blue-600 peer-disabled:opacity-50',
            'after:content-[""] after:absolute after:top-0.5 after:left-0.5',
            'after:bg-white after:rounded-full after:transition-transform',
            'after:duration-200 after:ease-in-out',
            'peer-checked:after:translate-x-full',
            sizeClasses[size]
          )}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
        />
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <span className="text-sm font-medium text-gray-900" id={`${id}-label`}>{label}</span>
            )}
            {description && (
              <p className="text-xs text-gray-600" id={`${id}-description`}>{description}</p>
            )}
          </div>
        )}
      </label>
    );
  }
);