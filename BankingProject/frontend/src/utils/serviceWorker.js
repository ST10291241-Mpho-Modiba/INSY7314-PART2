// Service Worker Registration and Management
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

// Service Worker registration
export function register(config) {
  if ('serviceWorker' in navigator) {
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
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
      
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

// Service Worker utilities for the app
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
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
  }

  handleOnlineStatusChange(isOnline) {
    console.log(`App is now ${isOnline ? 'online' : 'offline'}`);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('onlineStatusChange', {
      detail: { isOnline }
    }));

    if (isOnline && 'serviceWorker' in navigator) {
      // Trigger background sync when coming back online
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.sync) {
          registration.sync.register('background-sync-transactions');
        }
      });
    }
  }

  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    if (data.type === 'TRANSACTION_SYNCED') {
      // Notify the app about synced transaction
      window.dispatchEvent(new CustomEvent('transactionSynced', {
        detail: data.transaction
      }));
    }
  }

  // Cache data for offline use
  cacheOfflineData(key, data) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_OFFLINE_DATA',
        key,
        data
      });
    }
  }

  // Queue transaction for background sync
  async queueTransaction(transactionData) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['queuedTransactions'], 'readwrite');
      const store = transaction.objectStore('queuedTransactions');
      
      const queuedTransaction = {
        id: Date.now().toString(),
        data: transactionData,
        timestamp: new Date().toISOString(),
        status: 'queued'
      };
      
      await store.add(queuedTransaction);
      
      // Register for background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register('background-sync-transactions');
        }
      }
      
      return queuedTransaction;
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw error;
    }
  }

  // Get queued transactions
  async getQueuedTransactions() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['queuedTransactions'], 'readonly');
      const store = transaction.objectStore('queuedTransactions');
      return await store.getAll();
    } catch (error) {
      console.error('Failed to get queued transactions:', error);
      return [];
    }
  }

  // Open IndexedDB
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BankingAppDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('queuedTransactions')) {
          db.createObjectStore('queuedTransactions', { keyPath: 'id' });
        }
      };
    });
  }

  // Check if app is running in standalone mode (PWA)
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Get cache status
  async getCacheStatus() {
    if (!('caches' in window)) {
      return { supported: false };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = {};
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = keys.length;
      }
      
      return {
        supported: true,
        caches: cacheInfo,
        totalCaches: cacheNames.length
      };
    } catch (error) {
      console.error('Failed to get cache status:', error);
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
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
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
        
        return true;
      } catch (error) {
        console.error('Failed to update service worker:', error);
        return false;
      }
    }
    return false;
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();