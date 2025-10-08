import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CloudArrowDownIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  WifiIcon,
  BanknotesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);
  const [cachedData, setCachedData] = useState({
    balance: null,
    recentTransactions: [],
    queuedActions: []
  });
  const [syncStatus, setSyncStatus] = useState('offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      // Simulate sync process
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSync(new Date());
      }, 2000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data from localStorage
    loadCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('offlineData');
      if (cached) {
        const data = JSON.parse(cached);
        setCachedData(data);
        setLastSync(data.lastSync ? new Date(data.lastSync) : null);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <CloudArrowDownIcon className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Offline Mode</h1>
              <p className="text-sm text-gray-500">Viewing cached data</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Sync Status */}
          <motion.div 
            variants={cardVariants}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
              <AnimatePresence mode="wait">
                {syncStatus === 'syncing' && (
                  <motion.div
                    key="syncing"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center text-blue-600"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    <span className="text-sm font-medium">Syncing...</span>
                  </motion.div>
                )}
                {syncStatus === 'synced' && (
                  <motion.div
                    key="synced"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center text-green-600"
                  >
                    <WifiIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Synced</span>
                  </motion.div>
                )}
                {syncStatus === 'offline' && (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center text-gray-500"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Offline</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {lastSync && (
              <p className="text-sm text-gray-600">
                Last synced: {formatDate(lastSync)}
              </p>
            )}
            
            {!lastSync && (
              <p className="text-sm text-gray-500">
                No recent sync data available
              </p>
            )}
          </motion.div>

          {/* Account Balance */}
          <motion.div 
            variants={cardVariants}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <BanknotesIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Account Balance</h2>
            </div>
            
            {cachedData.balance ? (
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(cachedData.balance)}
                </p>
                <p className="text-sm text-gray-500">
                  As of {lastSync ? formatDate(lastSync) : 'last sync'}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No cached balance data available</p>
              </div>
            )}
          </motion.div>

          {/* Recent Transactions */}
          <motion.div 
            variants={cardVariants}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            
            {cachedData.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {cachedData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(new Date(transaction.date))}</p>
                    </div>
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No cached transaction data available</p>
              </div>
            )}
          </motion.div>

          {/* Queued Actions */}
          {cachedData.queuedActions.length > 0 && (
            <motion.div 
              variants={cardVariants}
              className="bg-yellow-50 rounded-lg border border-yellow-200 p-6"
            >
              <div className="flex items-center mb-4">
                <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-lg font-semibold text-yellow-900">Pending Actions</h2>
              </div>
              
              <p className="text-sm text-yellow-800 mb-4">
                These actions will be processed when you're back online:
              </p>
              
              <div className="space-y-2">
                {cachedData.queuedActions.map((action, index) => (
                  <div key={index} className="flex items-center p-3 bg-yellow-100 rounded-lg">
                    <ClockIcon className="h-4 w-4 text-yellow-600 mr-3" />
                    <span className="text-sm text-yellow-800">{action.description}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Offline Notice */}
          <motion.div 
            variants={cardVariants}
            className="bg-blue-50 rounded-lg border border-blue-200 p-6"
          >
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Offline Mode Limitations</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You can view cached account information</li>
                  <li>• New transactions cannot be processed</li>
                  <li>• Data may not be up to date</li>
                  <li>• Some features are temporarily unavailable</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div 
            variants={cardVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Return to Dashboard
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Check Connection
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OfflinePage;