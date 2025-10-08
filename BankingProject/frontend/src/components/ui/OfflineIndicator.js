import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

const OfflineIndicator = () => {
  const { 
    isOnline, 
    isOffline, 
    wasOffline, 
    offlineDuration, 
    queuedTransactions 
  } = useOfflineStatus();

  const formatDuration = (duration) => {
    if (duration < 1000) return 'Just now';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {/* Offline Indicator */}
        {isOffline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 mb-2"
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">You're offline</span>
              {offlineDuration > 0 && (
                <span className="text-xs opacity-90">
                  {formatDuration(offlineDuration)}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Back Online Indicator */}
        {isOnline && wasOffline && (
          <motion.div
            key="back-online"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onAnimationComplete={() => {
              // Auto-hide after 3 seconds
              setTimeout(() => {
                // This will be handled by the parent component state
              }, 3000);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 mb-2"
          >
            <WifiIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Back online</span>
          </motion.div>
        )}

        {/* Queued Transactions Indicator */}
        {queuedTransactions.length > 0 && (
          <motion.div
            key="queued"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <QueueListIcon className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {queuedTransactions.length} pending
              </span>
              <span className="text-xs opacity-90">
                Will sync when online
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact version for header/navbar
export const CompactOfflineIndicator = () => {
  const { isOnline, queuedTransactions } = useOfflineStatus();

  if (isOnline && queuedTransactions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs"
        >
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>Offline</span>
        </motion.div>
      )}
      
      {queuedTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs"
        >
          <ClockIcon className="h-3 w-3" />
          <span>{queuedTransactions.length}</span>
        </motion.div>
      )}
    </div>
  );
};

// Status bar for detailed offline information
export const OfflineStatusBar = ({ className = '' }) => {
  const { 
    isOnline, 
    isOffline, 
    offlineDuration, 
    queuedTransactions 
  } = useOfflineStatus();

  if (isOnline && queuedTransactions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-gray-50 border-b border-gray-200 px-4 py-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isOffline ? (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  You're currently offline
                </p>
                {offlineDuration > 0 && (
                  <p className="text-xs text-gray-500">
                    Offline for {formatDuration(offlineDuration)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <WifiIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Connected
                </p>
                {queuedTransactions.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Syncing {queuedTransactions.length} pending transactions...
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {queuedTransactions.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <QueueListIcon className="h-4 w-4" />
            <span>{queuedTransactions.length} queued</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  function formatDuration(duration) {
    if (duration < 1000) return 'just now';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
};

export default OfflineIndicator;