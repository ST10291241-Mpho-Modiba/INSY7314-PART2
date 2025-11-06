import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
  dismissible?: boolean;
}

const alertStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-600',
    close: 'text-blue-400 hover:text-blue-600'
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-600',
    close: 'text-green-400 hover:text-green-600'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-600',
    close: 'text-yellow-400 hover:text-yellow-600'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-600',
    close: 'text-red-400 hover:text-red-600'
  }
};

const defaultIcons = {
  info: <InformationCircleIcon className="h-5 w-5" />,
  success: <CheckCircleIcon className="h-5 w-5" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5" />,
  error: <XCircleIcon className="h-5 w-5" />
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  children,
  icon,
  onClose,
  className = '',
  dismissible = false
}) => {
  const styles = alertStyles[type];
  const displayIcon = icon || defaultIcons[type];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        styles.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        {displayIcon && (
          <div className={clsx('flex-shrink-0', styles.icon)}>
            {displayIcon}
          </div>
        )}
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={clsx('text-sm', title ? 'mt-1' : '')}>
            {children}
          </div>
        </div>
        {(dismissible || onClose) && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                styles.close,
                type === 'info' && 'focus:ring-blue-500',
                type === 'success' && 'focus:ring-green-500',
                type === 'warning' && 'focus:ring-yellow-500',
                type === 'error' && 'focus:ring-red-500'
              )}
              aria-label="Close alert"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AlertGroupProps {
  children: ReactNode;
  className?: string;
}

export const AlertGroup: React.FC<AlertGroupProps> = ({ children, className = '' }) => {
  return <div className={clsx('space-y-4', className)}>{children}</div>;
};