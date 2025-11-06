import { useState, useEffect } from 'react';
import { serviceWorkerManager } from '../utils/serviceWorker';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [queuedTransactions, setQueuedTransactions] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    let offlineStartTime = null;
    let intervalId = null;

    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        setWasOffline(false);
        if (offlineStartTime) {
          const duration = Date.now() - offlineStartTime;
          setOfflineDuration(duration);
          offlineStartTime = null;
        }
        
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        
        // Load queued transactions when coming back online
        loadQueuedTransactions();
        reconnect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      offlineStartTime = Date.now();
      
      // Start tracking offline duration
      intervalId = setInterval(() => {
        if (offlineStartTime) {
          setOfflineDuration(Date.now() - offlineStartTime);
        }
      }, 1000);
    };

    const handleOnlineStatusChange = (event) => {
      if (event.detail.isOnline) {
        handleOnline();
      } else {
        handleOffline();
      }
    };

    const handleTransactionSynced = (event) => {
      // Remove synced transaction from queue
      setQueuedTransactions(prev => 
        prev.filter(t => t.id !== event.detail.id)
      );
    };

    // Set initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('onlineStatusChange', handleOnlineStatusChange);
    window.addEventListener('transactionSynced', handleTransactionSynced);

    // Load initial queued transactions
    loadQueuedTransactions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('onlineStatusChange', handleOnlineStatusChange);
      window.removeEventListener('transactionSynced', handleTransactionSynced);
      
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [wasOffline]);

  const loadQueuedTransactions = async () => {
    try {
      const transactions = await serviceWorkerManager.getQueuedTransactions();
      setQueuedTransactions(transactions);
    } catch (error) {
      console.error('Failed to load queued transactions:', error);
    }
  };

  const queueTransaction = async (transactionData) => {
    try {
      const queuedTransaction = await serviceWorkerManager.queueTransaction(transactionData);
      setQueuedTransactions(prev => [...prev, queuedTransaction]);
      return queuedTransaction;
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw error;
    }
  };

  const getOfflineStatusInfo = () => {
    return {
      isOnline,
      isOffline: !isOnline,
      wasOffline,
      offlineDuration,
      offlineDurationFormatted: formatDuration(offlineDuration),
      queuedTransactionsCount: queuedTransactions.length,
      hasQueuedTransactions: queuedTransactions.length > 0
    };
  };

  const formatDuration = (duration) => {
    if (duration < 1000) {
      return 'Just now';
    }
    
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

  const reconnect = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // Sync queued transactions
      for (const transaction of queuedTransactions) {
        try {
          await serviceWorkerManager.syncTransaction(transaction);
        } catch (error) {
          console.error('Failed to sync transaction:', error);
        }
      }
      
      setLastSyncTime(new Date());
      setQueuedTransactions([]);
    } catch (error) {
      setSyncError(error.message || 'Sync failed');
      console.error('Reconnection failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    offlineDuration,
    queuedTransactions,
    queueTransaction,
    loadQueuedTransactions,
    getOfflineStatusInfo,
    lastSyncTime,
    isSyncing,
    syncError,
    reconnect
  };
};

export default useOfflineStatus;