// Service Worker Registration and Management
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

// Robust runtime dev detection: disable SW on localhost even if NODE_ENV is mis-set
const isDevRuntime = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') || isLocalhost;

// Service Worker registration with enhanced configuration
export function register(config) {
  if ('serviceWorker' in navigator) {
    // Disable service worker in development to avoid stale caches and SW-related errors
    const isDev = isDevRuntime;
    if (isDev) {
      try {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
      } catch (e) {
        // no-op
      }
      console.log('Service Worker: Skipped registration in development');
      return;
    }
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker: Controller changed');
        window.dispatchEvent(new CustomEvent('serviceWorkerUpdated'));
      });
    }
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              );
              
              // Notify app about available update
              window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', {
                detail: { registration }
              }));
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Content is cached for offline use.');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.'
      );
    });
}

// Unregister service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Enhanced Service Worker Manager with advanced offline capabilities
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.offlineData = new Map();
    // In dev runtime, do not set up SW or IndexedDB to avoid noisy errors
    if (isDevRuntime) {
      this.db = null;
      return;
    }
    this.setupEventListeners();
    this.initializeOfflineStorage();
  }

  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Service Worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }

    // Visibility change - sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerBackgroundSync();
      }
    });

    // Focus event - sync when window gets focus
    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.triggerBackgroundSync();
      }
    });
  }

  async initializeOfflineStorage() {
    try {
      // Initialize IndexedDB
      this.db = await this.openDB();
      
      // Load cached offline data
      await this.loadOfflineData();
      
      console.log('Service Worker Manager: Offline storage initialized');
    } catch (error) {
      console.error('Service Worker Manager: Failed to initialize offline storage', error);
    }
  }

  handleOnlineStatusChange(isOnline) {
    console.log(`Service Worker Manager: App is now ${isOnline ? 'online' : 'offline'}`);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('onlineStatusChange', {
      detail: { isOnline, timestamp: new Date().toISOString() }
    }));

    if (isOnline) {
      // Trigger background sync when coming back online
      this.triggerBackgroundSync();
      
      // Attempt to sync any pending data
      this.syncPendingData();
    } else {
      // Notify about offline mode
      window.dispatchEvent(new CustomEvent('offlineModeActivated', {
        detail: { message: 'App is now in offline mode. Some features may be limited.' }
      }));
    }
  }

  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    if (!data) return;

    switch (data.type) {
      case 'TRANSACTION_SYNCED':
        this.handleTransactionSynced(data.transaction);
        break;
        
      case 'API_REQUEST_SYNCED':
        this.handleApiRequestSynced(data.request);
        break;
        
      case 'PAYMENT_APPROVED':
        this.handlePaymentApproved(data.paymentId);
        break;
        
      case 'CACHE_STATUS':
        this.handleCacheStatusUpdate(data.status);
        break;
    }
  }

  handleTransactionSynced(transaction) {
    console.log('Service Worker Manager: Transaction synced', transaction);
    
    // Remove from local queue
    this.removeFromLocalQueue(transaction.id);
    
    // Notify the app
    window.dispatchEvent(new CustomEvent('transactionSynced', {
      detail: transaction
    }));
    
    // Show success notification
    this.showNotification('Transaction Synced', 'Your pending transaction has been processed successfully.');
  }

  handleApiRequestSynced(request) {
    console.log('Service Worker Manager: API request synced', request);
    
    // Notify the app
    window.dispatchEvent(new CustomEvent('apiRequestSynced', {
      detail: request
    }));
  }

  handlePaymentApproved(paymentId) {
    console.log('Service Worker Manager: Payment approved', paymentId);
    
    window.dispatchEvent(new CustomEvent('paymentApproved', {
      detail: { paymentId }
    }));
    
    this.showNotification('Payment Approved', 'Your payment has been approved successfully.');
  }

  handleCacheStatusUpdate(status) {
    console.log('Service Worker Manager: Cache status updated', status);
    
    window.dispatchEvent(new CustomEvent('cacheStatusUpdated', {
      detail: status
    }));
  }

  // Cache data for offline use with enhanced storage
  async cacheOfflineData(key, data, options = {}) {
    try {
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        expiresAt: options.expiresAt || null,
        version: options.version || 1
      };
      
      // Store in IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        await store.put({ key, ...cacheData });
      }
      
      // Store in memory cache
      this.offlineData.set(key, cacheData);
      
      // Also notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_OFFLINE_DATA',
          data: { key, data: cacheData }
        });
      }
      
      console.log('Service Worker Manager: Data cached for offline use', key);
      return true;
    } catch (error) {
      console.error('Service Worker Manager: Failed to cache offline data', error);
      return false;
    }
  }

  // Get cached offline data
  async getOfflineData(key) {
    try {
      // Check memory cache first
      const memoryData = this.offlineData.get(key);
      if (memoryData) {
        // Check if data is expired
        if (!memoryData.expiresAt || new Date() < new Date(memoryData.expiresAt)) {
          return memoryData.data;
        }
      }
      
      // Check IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const req = store.get(key);
        const result = await this._awaitIDBRequest(req);
        
        if (result && (!result.expiresAt || new Date() < new Date(result.expiresAt))) {
          // Update memory cache
          this.offlineData.set(key, result);
          return result.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Service Worker Manager: Failed to get offline data', error);
      return null;
    }
  }

  // Queue transaction for background sync with enhanced features
  async queueTransaction(transactionData, options = {}) {
    try {
      const queuedTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        data: transactionData,
        timestamp: new Date().toISOString(),
        status: 'queued',
        priority: options.priority || 'normal',
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        expiresAt: options.expiresAt || null
      };
      
      // Store in IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['queuedTransactions'], 'readwrite');
        const store = transaction.objectStore('queuedTransactions');
        await store.add(queuedTransaction);
      }
      
      // Register for background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register('background-sync-transactions');
        }
      }
      
      console.log('Service Worker Manager: Transaction queued for sync', queuedTransaction.id);
      
      // Notify the app
      window.dispatchEvent(new CustomEvent('transactionQueued', {
        detail: queuedTransaction
      }));
      
      return queuedTransaction;
    } catch (error) {
      console.error('Service Worker Manager: Failed to queue transaction', error);
      throw error;
    }
  }

  // Get queued transactions with filtering
  async getQueuedTransactions(options = {}) {
    try {
      if (!this.db) return [];
      
      const transaction = this.db.transaction(['queuedTransactions'], 'readonly');
      const store = transaction.objectStore('queuedTransactions');
      
      let request;
      
      if (options.status) {
        const index = store.index('status');
        request = index.getAll(options.status);
      } else {
        request = store.getAll();
      }
      
      const result = await this._awaitIDBRequest(request);
      const items = Array.isArray(result)
        ? result
        : result && typeof result === 'object'
          ? Object.values(result)
          : [];
      
      // Filter by priority if specified
      if (options.priority) {
        return items.filter(item => item.priority === options.priority);
      }
      
      // Filter expired transactions
      if (!options.includeExpired) {
        const now = new Date();
        return items.filter(item => !item.expiresAt || new Date(item.expiresAt) > now);
      }
      
      return items;
    } catch (error) {
      console.error('Service Worker Manager: Failed to get queued transactions', error);
      return [];
    }
  }

  // Remove transaction from queue
  async removeFromQueue(transactionId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['queuedTransactions'], 'readwrite');
        const store = transaction.objectStore('queuedTransactions');
        await store.delete(transactionId);
      }
      
      console.log('Service Worker Manager: Transaction removed from queue', transactionId);
    } catch (error) {
      console.error('Service Worker Manager: Failed to remove transaction from queue', error);
    }
  }

  // Trigger background sync
  async triggerBackgroundSync() {
    // Short-circuit in development: avoid interacting with navigator.serviceWorker
    if (isDevRuntime) {
      console.log('Service Worker Manager: Background sync skipped in development');
      return;
    }
    if (this.syncInProgress) {
      console.log('Service Worker Manager: Sync already in progress');
      return;
    }
    
    try {
      this.syncInProgress = true;
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.sync) {
          // Register multiple sync tags
          await Promise.all([
            registration.sync.register('background-sync-transactions'),
            registration.sync.register('background-sync-api-requests')
          ]);
          
          console.log('Service Worker Manager: Background sync triggered');
        } else {
          // Fallback: manually sync data
          await this.manualSync();
        }
      }
    } catch (error) {
      console.error('Service Worker Manager: Failed to trigger background sync', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Manual sync fallback when background sync is not available
  async manualSync() {
    console.log('Service Worker Manager: Performing manual sync');
    
    try {
      const queuedTransactions = await this.getQueuedTransactions();
      
      for (const transaction of queuedTransactions) {
        try {
          const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction.data)
          });
          
          if (response.ok) {
            await this.removeFromQueue(transaction.id);
            this.handleTransactionSynced(transaction);
          } else if (transaction.retryCount < transaction.maxRetries) {
            // Update retry count
            transaction.retryCount++;
            transaction.status = 'retrying';
            
            const transactionUpdate = this.db.transaction(['queuedTransactions'], 'readwrite');
            const store = transactionUpdate.objectStore('queuedTransactions');
            await store.put(transaction);
          }
        } catch (error) {
          console.error('Service Worker Manager: Manual sync failed for transaction', transaction.id, error);
        }
      }
    } catch (error) {
      console.error('Service Worker Manager: Manual sync failed', error);
    }
  }

  // Sync pending data when coming online
  async syncPendingData() {
    console.log('Service Worker Manager: Syncing pending data');
    
    try {
      // Get all queued items
      const [transactions, apiRequests] = await Promise.all([
        this.getQueuedTransactions(),
        this.getQueuedApiRequests()
      ]);
      
      if (transactions.length > 0 || apiRequests.length > 0) {
        console.log(`Service Worker Manager: Found ${transactions.length} transactions and ${apiRequests.length} API requests to sync`);
        
        // Trigger background sync
        await this.triggerBackgroundSync();
        
        // Show notification
        this.showNotification('Syncing Data', 'Your pending data is being synchronized...');
      }
    } catch (error) {
      console.error('Service Worker Manager: Failed to sync pending data', error);
    }
  }

  // Get queued API requests
  async getQueuedApiRequests() {
    try {
      if (!this.db) return [];
      
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('type');
      const request = index.getAll('api_request');
      
      return await this._awaitIDBRequest(request);
    } catch (error) {
      console.error('Service Worker Manager: Failed to get queued API requests', error);
      return [];
    }
  }

  // Open IndexedDB connection
  openDB() {
    // Short-circuit in development
    if (isDevRuntime) {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BankingAppOfflineDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('queuedTransactions')) {
          const transactionStore = db.createObjectStore('queuedTransactions', { 
            keyPath: 'id'
          });
          transactionStore.createIndex('timestamp', 'timestamp');
          transactionStore.createIndex('status', 'status');
          transactionStore.createIndex('priority', 'priority');
        }
        
        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { 
            keyPath: 'key'
          });
          dataStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { 
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Load offline data from IndexedDB
  async loadOfflineData() {
    try {
      if (!this.db) return;
      
      const transaction = this.db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.getAll();
      
      const results = await this._awaitIDBRequest(request);
      const list = Array.isArray(results)
        ? results
        : results && typeof results === 'object'
          ? Object.values(results)
          : [];
      
      (Array.isArray(list) ? list : []).forEach(item => {
        this.offlineData.set(item.key, item);
      });
      
      console.log('Service Worker Manager: Loaded offline data', this.offlineData.size);
    } catch (error) {
      console.error('Service Worker Manager: Failed to load offline data', error);
    }
  }

  // Helper: await native IndexedDB request and return its result
  _awaitIDBRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if app is running in standalone mode (PWA)
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Get cache status with detailed information
  async getCacheStatus() {
    if (!('caches' in window)) {
      return { supported: false };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = {};
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = {
          entries: keys.length,
          size: keys.length // Approximate size
        };
        totalSize += keys.length;
      }
      
      return {
        supported: true,
        caches: cacheInfo,
        totalCaches: cacheNames.length,
        totalSize: totalSize,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Service Worker Manager: Failed to get cache status', error);
      return { supported: true, error: error.message };
    }
  }

  // Clear all caches
  async clearCaches() {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('Service Worker Manager: All caches cleared');
      return true;
    } catch (error) {
      console.error('Service Worker Manager: Failed to clear caches', error);
      return false;
    }
  }

  // Update service worker
  async updateServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        console.log('Service Worker Manager: Service worker updated');
        return true;
      } catch (error) {
        console.error('Service Worker Manager: Failed to update service worker', error);
        return false;
      }
    }
    return false;
  }

  // Show notification (if permissions granted)
  showNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    }
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get connection information
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        type: connection.type
      };
    }
    
    return null;
  }

  // Check if running offline
  isOffline() {
    return !this.isOnline;
  }

  // Get offline capabilities status
  getOfflineCapabilities() {
    return {
      offlineStorage: !!this.db,
      backgroundSync: 'sync' in ServiceWorkerRegistration.prototype,
      pushNotifications: 'Notification' in window,
      cacheStorage: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator
    };
  }
}

// Create singleton instance only outside development to avoid noisy errors in dev
export const serviceWorkerManager = (!isDevRuntime)
  ? new ServiceWorkerManager()
  : null;

// Export utility functions
export const offlineUtils = {
  // Check if feature is available offline
  isFeatureAvailableOffline(feature) {
    const offlineFeatures = [
      'view_balance',
      'view_transactions',
      'view_payment_history',
      'view_scheduled_payments',
      'queue_payments',
      'view_notifications'
    ];
    
    return offlineFeatures.includes(feature);
  },

  // Get offline data age
  getOfflineDataAge(timestamp) {
    if (!timestamp) return null;
    
    const age = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  // Format offline data
  formatOfflineData(data, type) {
    if (!data) return null;
    
    return {
      ...data,
      _offline: true,
      _cachedAt: new Date().toISOString(),
      _dataType: type
    };
  },

  // Validate offline data
  validateOfflineData(data, schema) {
    if (!data || !schema) return false;
    
    try {
      // Basic validation - can be enhanced with JSON Schema
      for (const [key, type] of Object.entries(schema)) {
        if (data[key] === undefined) return false;
        if (type && typeof data[key] !== type) return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Initialize service worker on module load
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isDevRuntime) {
  // Auto-register service worker
  register({
    onUpdate: (registration) => {
      console.log('Service Worker: Update available');
      window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', {
        detail: { registration }
      }));
    },
    onSuccess: (registration) => {
      console.log('Service Worker: Registered successfully');
      window.dispatchEvent(new CustomEvent('serviceWorkerRegistered', {
        detail: { registration }
      }));
    }
  });
}