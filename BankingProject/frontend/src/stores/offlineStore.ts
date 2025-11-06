import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// Offline Store
interface OfflineState {
  // Connection status
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none';
  lastOnline: string | null;
  
  // Sync status
  isSyncing: boolean;
  syncError: string | null;
  lastSync: string | null;
  syncQueue: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: any;
    timestamp: string;
    retries: number;
    maxRetries: number;
  }>;
  
  // Cached data
  cache: {
    transactions: any[];
    accounts: any[];
    notifications: any[];
    userProfile: any;
    paymentMethods: any[];
  };
  
  // Cache metadata
  cacheTimestamps: Record<string, string>;
  cacheExpiry: Record<string, number>; // milliseconds
  
  // Actions
  setOnlineStatus: (isOnline: boolean, connectionType?: OfflineState['connectionType']) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setLastSync: (syncTime: string) => void;
  
  addToSyncQueue: (item: Omit<OfflineState['syncQueue'][0], 'id' | 'timestamp' | 'retries'>) => void;
  removeFromSyncQueue: (id: string) => void;
  updateSyncQueueItem: (id: string, updates: Partial<OfflineState['syncQueue'][0]>) => void;
  clearSyncQueue: () => void;
  
  setCache: (key: string, data: any, expiry?: number) => void;
  getCache: (key: string) => any;
  removeCache: (key: string) => void;
  clearCache: () => void;
  isCacheValid: (key: string) => boolean;
  
  // Sync methods
  triggerSync: () => Promise<void>;
  processSyncItem: (item: OfflineState['syncQueue'][0]) => Promise<void>;
  
  // Computed values
  hasPendingSync: () => boolean;
  getSyncQueueByType: (type: string) => OfflineState['syncQueue'];
  getCacheKeys: () => string[];
  getCacheSize: () => number;
}

export const useOfflineStore = create<OfflineState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        isOnline: navigator.onLine,
        connectionType: 'none',
        lastOnline: null,
        
        isSyncing: false,
        syncError: null,
        lastSync: null,
        syncQueue: [],
        
        cache: {
          transactions: [],
          accounts: [],
          notifications: [],
          userProfile: null,
          paymentMethods: [],
        },
        
        cacheTimestamps: {},
        cacheExpiry: {
          transactions: 5 * 60 * 1000, // 5 minutes
          accounts: 10 * 60 * 1000, // 10 minutes
          notifications: 2 * 60 * 1000, // 2 minutes
          userProfile: 15 * 60 * 1000, // 15 minutes
          paymentMethods: 30 * 60 * 1000, // 30 minutes
        },
        
        setOnlineStatus: (isOnline, connectionType) => {
          set((state) => ({
            isOnline,
            connectionType: connectionType || state.connectionType,
            lastOnline: isOnline ? new Date().toISOString() : state.lastOnline,
          }));
          
          // Auto-sync when coming back online
          if (isOnline && get().hasPendingSync()) {
            get().triggerSync();
          }
        },
        
        setSyncing: (isSyncing) => set({ isSyncing }),
        setSyncError: (error) => set({ syncError: error }),
        setLastSync: (syncTime) => set({ lastSync: syncTime }),
        
        addToSyncQueue: (item) => {
          const id = Date.now().toString();
          const syncItem = {
            ...item,
            id,
            timestamp: new Date().toISOString(),
            retries: 0,
            maxRetries: 3,
          };
          
          set((state) => ({
            syncQueue: [...state.syncQueue, syncItem],
          }));
        },
        
        removeFromSyncQueue: (id) => {
          set((state) => ({
            syncQueue: state.syncQueue.filter(item => item.id !== id),
          }));
        },
        
        updateSyncQueueItem: (id, updates) => {
          set((state) => ({
            syncQueue: state.syncQueue.map(item =>
              item.id === id ? { ...item, ...updates } : item
            ),
          }));
        },
        
        clearSyncQueue: () => set({ syncQueue: [] }),
        
        setCache: (key, data, expiry) => {
          set((state) => ({
            cache: {
              ...state.cache,
              [key]: data,
            },
            cacheTimestamps: {
              ...state.cacheTimestamps,
              [key]: new Date().toISOString(),
            },
            cacheExpiry: expiry ? {
              ...state.cacheExpiry,
              [key]: expiry,
            } : state.cacheExpiry,
          }));
        },
        
        getCache: (key) => {
          const state = get();
          if (!get().isCacheValid(key)) {
            return null;
          }
          return state.cache[key as keyof OfflineState['cache']];
        },
        
        removeCache: (key) => {
          set((state) => {
            const newCache = { ...state.cache };
            const newTimestamps = { ...state.cacheTimestamps };
            delete newCache[key as keyof OfflineState['cache']];
            delete newTimestamps[key];
            
            return {
              cache: newCache,
              cacheTimestamps: newTimestamps,
            };
          });
        },
        
        clearCache: () => {
          set({
            cache: {
              transactions: [],
              accounts: [],
              notifications: [],
              userProfile: null,
              paymentMethods: [],
            },
            cacheTimestamps: {},
          });
        },
        
        isCacheValid: (key) => {
          const state = get();
          const timestamp = state.cacheTimestamps[key];
          const expiry = state.cacheExpiry[key];
          
          if (!timestamp || !expiry) return false;
          
          const cacheTime = new Date(timestamp).getTime();
          const now = Date.now();
          
          return (now - cacheTime) < expiry;
        },
        
        // Sync functionality
        triggerSync: async () => {
          const state = get();
          if (state.isSyncing || !state.isOnline) return;
          
          set({ isSyncing: true, syncError: null });
          
          try {
            // Process sync queue
            const failedItems: OfflineState['syncQueue'] = [];
            
            for (const item of state.syncQueue) {
              try {
                // Simulate API call - this would be replaced with actual API calls
                await get().processSyncItem(item);
                // Item processed successfully, remove from queue
              } catch (error) {
                console.error('Sync item failed:', error);
                const updatedItem = {
                  ...item,
                  retries: item.retries + 1,
                };
                
                if (updatedItem.retries < updatedItem.maxRetries) {
                  failedItems.push(updatedItem);
                }
              }
            }
            
            set({
              syncQueue: failedItems,
              isSyncing: false,
              lastSync: new Date().toISOString(),
            });
            
          } catch (error) {
            console.error('Sync failed:', error);
            set({
              isSyncing: false,
              syncError: error instanceof Error ? error.message : 'Sync failed',
            });
          }
        },
        
        processSyncItem: async (item: OfflineState['syncQueue'][0]) => {
          // This would be implemented with actual API calls
          // For now, it's a placeholder
          console.log('Processing sync item:', item);
          return Promise.resolve();
        },
        
        // Computed values
        hasPendingSync: () => {
          return get().syncQueue.length > 0;
        },
        
        getSyncQueueByType: (type) => {
          return get().syncQueue.filter(item => item.type === type);
        },
        
        getCacheKeys: () => {
          return Object.keys(get().cache);
        },
        
        getCacheSize: () => {
          const state = get();
          return Object.keys(state.cache).length;
        },
      })),
      {
        name: 'offline-store',
        partialize: (state) => ({
          syncQueue: state.syncQueue,
          cache: state.cache,
          cacheTimestamps: state.cacheTimestamps,
          lastSync: state.lastSync,
        }),
      }
    ),
    {
      name: 'offline-store',
    }
  )
);

// Subscribe to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false);
  });
  
  // Monitor connection type if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    connection.addEventListener('change', () => {
      useOfflineStore.getState().setOnlineStatus(
        navigator.onLine,
        connection.effectiveType
      );
    });
  }
}