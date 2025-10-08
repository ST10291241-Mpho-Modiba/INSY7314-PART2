// Banking App Service Worker
const CACHE_NAME = 'banking-app-v1';
const STATIC_CACHE_NAME = 'banking-static-v1';
const DYNAMIC_CACHE_NAME = 'banking-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/account',
  '/api/transactions',
  '/api/balance'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else {
    // Other requests - Stale While Revalidate
    event.respondWith(handleOtherRequests(request));
  }
});

// Network First strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response for critical endpoints
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.includes(api))) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to response headers
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'service-worker-cache');
      return response;
    }
    
    // Return offline fallback for critical API endpoints
    if (url.pathname.includes('/api/account') || url.pathname.includes('/api/balance')) {
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'You are currently offline. Showing cached data.',
          data: await getOfflineData(url.pathname)
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Served-By': 'service-worker-offline'
          }
        }
      );
    }
    
    throw error;
  }
}

// Cache First strategy for static assets
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset', request.url);
    throw error;
  }
}

// Stale While Revalidate strategy for other requests
async function handleOtherRequests(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Get offline data from IndexedDB or localStorage
async function getOfflineData(pathname) {
  try {
    if (pathname.includes('/api/account')) {
      const accountData = localStorage.getItem('offline_account_data');
      return accountData ? JSON.parse(accountData) : {
        balance: 0,
        accountNumber: '****0000',
        accountType: 'Checking'
      };
    }
    
    if (pathname.includes('/api/transactions')) {
      const transactionData = localStorage.getItem('offline_transaction_data');
      return transactionData ? JSON.parse(transactionData) : [];
    }
    
    return null;
  } catch (error) {
    console.error('Service Worker: Failed to get offline data', error);
    return null;
  }
}

// Background sync for queued transactions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncQueuedTransactions());
  }
});

// Sync queued transactions when online
async function syncQueuedTransactions() {
  try {
    const queuedTransactions = await getQueuedTransactions();
    
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
          await removeQueuedTransaction(transaction.id);
          
          // Notify the client about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'TRANSACTION_SYNCED',
                transaction: transaction
              });
            });
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync transaction', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Get queued transactions from IndexedDB
async function getQueuedTransactions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedTransactions'], 'readonly');
      const store = transaction.objectStore('queuedTransactions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queuedTransactions')) {
        db.createObjectStore('queuedTransactions', { keyPath: 'id' });
      }
    };
  });
}

// Remove synced transaction from queue
async function removeQueuedTransaction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedTransactions'], 'readwrite');
      const store = transaction.objectStore('queuedTransactions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action) {
    // Handle action buttons
    console.log('Service Worker: Notification action clicked', event.action);
  } else {
    // Handle notification body click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_OFFLINE_DATA') {
    // Cache data for offline use
    const { key, data } = event.data;
    localStorage.setItem(key, JSON.stringify(data));
  }
});

console.log('Service Worker: Script loaded');