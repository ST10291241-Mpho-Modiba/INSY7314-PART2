import { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceWorkerManager } from '../utils/serviceWorker';

interface UseServiceWorkerReturn {
  serviceWorkerManager: ServiceWorkerManager | null;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isOfflineMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'completed';
  error: string | null;
  checkForUpdates: () => Promise<void>;
  triggerSync: () => Promise<void>;
  clearOfflineData: (key?: string) => Promise<void>;
  getCacheStatus: () => Promise<any>;
}

export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [serviceWorkerManager, setServiceWorkerManager] = useState<ServiceWorkerManager | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'completed'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const managerRef = useRef<ServiceWorkerManager | null>(null);

  // Initialize service worker manager
  useEffect(() => {
    const initializeServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const manager = new ServiceWorkerManager();
          // ServiceWorkerManager initializes automatically in constructor
          
          managerRef.current = manager;
          setServiceWorkerManager(manager);
        }
      } catch (err) {
        console.error('Failed to initialize service worker:', err);
        setError('Failed to initialize offline capabilities');
      }
    };

    initializeServiceWorker();

    return () => {
      // ServiceWorkerManager doesn't need explicit cleanup
      // Event listeners are automatically cleaned up when the object is garbage collected
      managerRef.current = null;
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
      
      // Trigger sync when coming back online
      if (managerRef.current) {
        managerRef.current.syncPendingData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true);
    };

    const handleUpdateInstalled = () => {
      setIsUpdateAvailable(false);
    };

    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    window.addEventListener('serviceWorkerUpdated', handleUpdateInstalled);

    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
      window.removeEventListener('serviceWorkerUpdated', handleUpdateInstalled);
    };
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => {
      setSyncStatus('syncing');
    };

    const handleSyncComplete = () => {
      setSyncStatus('completed');
      setTimeout(() => setSyncStatus('idle'), 2000);
    };

    const handleSyncError = () => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    };

    window.addEventListener('backgroundSyncStart', handleSyncStart);
    window.addEventListener('backgroundSyncComplete', handleSyncComplete);
    window.addEventListener('backgroundSyncError', handleSyncError);

    return () => {
      window.removeEventListener('backgroundSyncStart', handleSyncStart);
      window.removeEventListener('backgroundSyncComplete', handleSyncComplete);
      window.removeEventListener('backgroundSyncError', handleSyncError);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!managerRef.current) return;

    try {
      await managerRef.current.updateServiceWorker();
    } catch (err) {
      setError('Failed to check for updates');
      console.error('Update check failed:', err);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!managerRef.current) return;

    try {
      setSyncStatus('syncing');
      await managerRef.current.triggerBackgroundSync();
    } catch (err) {
      setSyncStatus('error');
      setError('Failed to trigger sync');
      console.error('Sync failed:', err);
    }
  }, []);

  const clearOfflineData = useCallback(async (key?: string) => {
    if (!managerRef.current) return;

    try {
      await managerRef.current.clearCaches();
      // Note: useServiceWorker doesn't manage offline data state
      // The useOfflineData hook manages that state separately
    } catch (err) {
      setError('Failed to clear offline data');
      console.error('Clear offline data failed:', err);
    }
  }, []);

  const getCacheStatus = useCallback(async () => {
    if (!managerRef.current) return null;

    try {
      return await managerRef.current.getCacheStatus();
    } catch (err) {
      setError('Failed to get cache status');
      console.error('Get cache status failed:', err);
      return null;
    }
  }, []);

  return {
    serviceWorkerManager,
    isOnline,
    isUpdateAvailable,
    isOfflineMode,
    syncStatus,
    error,
    checkForUpdates,
    triggerSync,
    clearOfflineData,
    getCacheStatus
  };
};

// Custom hook for offline data management
export const useOfflineData = () => {
  const [offlineData, setOfflineData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { serviceWorkerManager } = useServiceWorker();

  const cacheData = useCallback(async (key: string, data: any, options?: { expiresAt?: number }) => {
    if (!serviceWorkerManager) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await serviceWorkerManager.cacheOfflineData(key, data, options);
      
      // Update local state
      setOfflineData(prev => ({
        ...prev,
        [key]: { data, cachedAt: Date.now(), ...options }
      }));
    } catch (err) {
      setError('Failed to cache data');
      console.error('Cache data failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceWorkerManager]);

  const getCachedData = useCallback(async (key: string) => {
    if (!serviceWorkerManager) return null;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await serviceWorkerManager.getOfflineData(key);
      
      if (data) {
        setOfflineData(prev => ({
          ...prev,
          [key]: data
        }));
      }
      
      return data;
    } catch (err) {
      setError('Failed to retrieve cached data');
      console.error('Get cached data failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [serviceWorkerManager]);

  const clearCachedData = useCallback(async (key?: string) => {
    if (!serviceWorkerManager) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (key) {
        // Clear specific key
        // Clear specific offline data - ServiceWorkerManager doesn't have this method
        // Use clearCaches() to clear all caches
        await serviceWorkerManager.clearCaches();
        setOfflineData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      } else {
        // Clear all cached data
        await serviceWorkerManager.clearCaches();
        setOfflineData({});
      }
    } catch (err) {
      setError('Failed to clear cached data');
      console.error('Clear cached data failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceWorkerManager]);

  return {
    offlineData,
    isLoading,
    error,
    cacheData,
    getCachedData,
    clearCachedData
  };
};

// Custom hook for background sync management
export const useBackgroundSync = () => {
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { serviceWorkerManager } = useServiceWorker();

  const addToSyncQueue = useCallback(async (item: any) => {
    if (!serviceWorkerManager) return;

    try {
      setSyncError(null);
      
      // Add to service worker queue
      await serviceWorkerManager.queueTransaction(item);
      
      // Update local state
      setSyncQueue(prev => [...prev, item]);
    } catch (err) {
      setSyncError('Failed to add item to sync queue');
      console.error('Add to sync queue failed:', err);
    }
  }, [serviceWorkerManager]);

  const getSyncQueue = useCallback(async () => {
    if (!serviceWorkerManager) return [];

    try {
      setSyncError(null);
      
      const queue = await serviceWorkerManager.getQueuedTransactions();
      setSyncQueue(queue);
      
      return queue;
    } catch (err) {
      setSyncError('Failed to get sync queue');
      console.error('Get sync queue failed:', err);
      return [];
    }
  }, [serviceWorkerManager]);

  const removeFromSyncQueue = useCallback(async (itemId: string) => {
    if (!serviceWorkerManager) return;

    try {
      setSyncError(null);
      
      await serviceWorkerManager.removeFromQueue(itemId);
      
      setSyncQueue(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      setSyncError('Failed to remove item from sync queue');
      console.error('Remove from sync queue failed:', err);
    }
  }, [serviceWorkerManager]);

  const triggerSync = useCallback(async () => {
    if (!serviceWorkerManager) return;

    try {
      setIsSyncing(true);
      setSyncError(null);
      
      await serviceWorkerManager.triggerBackgroundSync();
    } catch (err) {
      setSyncError('Failed to trigger sync');
      console.error('Trigger sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [serviceWorkerManager]);

  return {
    syncQueue,
    isSyncing,
    syncError,
    addToSyncQueue,
    getSyncQueue,
    removeFromSyncQueue,
    triggerSync
  };
};