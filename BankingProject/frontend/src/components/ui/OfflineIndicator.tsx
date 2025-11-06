import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  SignalIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  className?: string;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  showReconnectButton?: boolean;
  onReconnect?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  position = 'top',
  compact = false,
  showReconnectButton = true,
  onReconnect
}) => {
  const { isOnline, lastSyncTime, isSyncing, reconnect } = useOfflineStatus();

  const positionClasses = {
    'top': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const handleReconnect = async () => {
    if (onReconnect) {
      onReconnect();
    } else {
      reconnect();
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
        >
          <div className="card-glass p-4 rounded-lg shadow-lg border border-warning-500/30">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm">
                  {compact ? 'Offline Mode' : 'You\'re currently offline'}
                </h4>
                {!compact && (
                  <p className="text-white/60 text-xs mt-1">
                    {isSyncing ? 'Syncing data...' : 'Your changes will be synced when connection is restored'}
                  </p>
                )}
                {lastSyncTime && (
                  <p className="text-white/40 text-xs mt-1">
                    Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              {showReconnectButton && (
                <button
                  onClick={handleReconnect}
                  disabled={isSyncing}
                  className="flex-shrink-0 px-3 py-1 bg-warning-500 hover:bg-warning-600 disabled:bg-warning-500/50 text-white text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-warning-400"
                >
                  {isSyncing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <SignalIcon className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    'Reconnect'
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact offline indicator
export const CompactOfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="card-glass px-3 py-2 rounded-full shadow-lg border border-warning-500/30">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ExclamationTriangleIcon className="h-4 w-4 text-warning-500" />
              </motion.div>
              <span className="text-white text-xs font-medium">
                {isSyncing ? 'Syncing...' : 'Offline'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating offline indicator
export const FloatingOfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <div className="card-glass p-3 rounded-full shadow-lg border border-warning-500/30">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ExclamationTriangleIcon className="h-6 w-6 text-warning-500" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Status indicator component
export const ConnectionStatusIndicator: React.FC<{
  showText?: boolean;
  className?: string;
}> = ({ showText = true, className = '' }) => {
  const { isOnline, isSyncing } = useOfflineStatus();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-success-500' : 'bg-warning-500'
        }`}
      />
      {showText && (
        <span className={`text-sm ${
          isOnline ? 'text-success-400' : 'text-warning-400'
        }`}>
          {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

// Sync status component
export const SyncStatusIndicator: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { isSyncing, lastSyncTime, syncError } = useOfflineStatus();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isSyncing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <ArrowPathIcon className="h-4 w-4 text-info-400" />
        </motion.div>
      ) : syncError ? (
        <ExclamationTriangleIcon className="h-4 w-4 text-error-400" />
      ) : (
        <CheckCircleIcon className="h-4 w-4 text-success-400" />
      )}
      
      <span className="text-white/60 text-xs">
        {isSyncing ? 'Syncing...' : 
         syncError ? 'Sync failed' :
         lastSyncTime ? `Synced ${new Date(lastSyncTime).toLocaleTimeString()}` :
         'Never synced'}
      </span>
    </div>
  );
};

// Export OfflineStatusBar as an alias for ConnectionStatusIndicator for backward compatibility
export const OfflineStatusBar = ConnectionStatusIndicator;

export default {
  OfflineIndicator,
  CompactOfflineIndicator
};