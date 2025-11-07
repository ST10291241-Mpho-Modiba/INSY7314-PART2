// Enhanced Banking App Service Worker with Advanced Offline Capabilities
const CACHE_NAME = 'banking-app-v2';
const STATIC_CACHE_NAME = 'banking-static-v2';
const DYNAMIC_CACHE_NAME = 'banking-dynamic-v2';
const OFFLINE_CACHE_NAME = 'banking-offline-v2';

// Enhanced assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/offline.css',
  '/offline.js'
];

// API endpoints that should be cached with specific strategies
const CACHEABLE_APIS = {
  networkFirst: [
    '/api/account',
    '/api/balance',
    '/api/user/profile',
    '/api/notifications'
  ],
  cacheFirst: [
    '/api/transactions',
    '/api/payment-history',
    '/api/scheduled-payments'
  ],
  staleWhileRevalidate: [
    '/api/exchange-rates',
    '/api/bank-locations',
    '/api/help-content'
  ]
};

// Install event - cache static assets and create offline page
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
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
        }),
      
      // Create offline fallback page
      createOfflineFallback()
    ])
  );
});

// Create offline fallback page
async function createOfflineFallback() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Banking App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
        }
        .offline-container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 600;
        }
        p {
          margin: 0 0 24px 0;
          opacity: 0.9;
          line-height: 1.5;
        }
        .retry-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .cached-data {
          margin-top: 24px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>Don't worry! Your banking app is still working with cached data.</p>
        <button class="retry-button" onclick="window.location.reload()">Try Again</button>
        <div class="cached-data">
          <strong>Cached Features:</strong><br>
          • View account balance<br>
          • Browse recent transactions<br>
          • Access payment history<br>
          • View scheduled payments
        </div>
      </div>
      <script>
        // Auto-retry when online
        window.addEventListener('online', () => {
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
  
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const response = new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
  
  await cache.put('/offline.html', response);
}

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE_NAME && 
                  cacheName !== DYNAMIC_CACHE_NAME && 
                  cacheName !== OFFLINE_CACHE_NAME) {
                console.log('Service Worker: Deleting old cache', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        }),
      
      // Claim clients immediately
      self.clients.claim(),
      
      // Initialize IndexedDB
      initializeIndexedDB()
    ])
  );
});

// Initialize IndexedDB for offline data storage
async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('queuedTransactions')) {
        const transactionStore = db.createObjectStore('queuedTransactions', { 
          keyPath: 'id',
          autoIncrement: true
        });
        transactionStore.createIndex('timestamp', 'timestamp');
        transactionStore.createIndex('status', 'status');
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

// Enhanced fetch event with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for basic strategies
  if (request.method !== 'GET') {
    if (request.method === 'POST' && url.pathname.includes('/api/')) {
      event.respondWith(handlePostRequest(request));
    }
    return;
  }
  
  // Handle different types of requests with specific strategies
  // Bypass service worker caching for API requests to avoid CSP/CORS issues in dev
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  } else if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.includes('/offline')) {
    event.respondWith(handleOfflineRequest(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// Handle POST requests for offline queuing
async function handlePostRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed for POST request, queuing for sync');
    
    // Queue the request for background sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text()
    };
    
    await queueSyncRequest(requestData);
    
    // Return a response indicating the request was queued
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request queued for background sync',
        queued: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Enhanced API request handling with multiple strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Determine caching strategy based on endpoint
  let strategy = 'networkFirst';
  
  if (CACHEABLE_APIS.cacheFirst.some(api => url.pathname.includes(api))) {
    strategy = 'cacheFirst';
  } else if (CACHEABLE_APIS.staleWhileRevalidate.some(api => url.pathname.includes(api))) {
    strategy = 'staleWhileRevalidate';
  }
  
  switch (strategy) {
    case 'cacheFirst':
      return handleCacheFirst(request);
    case 'staleWhileRevalidate':
      return handleStaleWhileRevalidate(request);
    default:
      return handleNetworkFirst(request);
  }
}

// Network First strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'service-worker-cache');
      return response;
    }
    
    return createOfflineResponse(request);
  }
}

// Cache First strategy
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Refresh cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request, networkResponse.clone());
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate strategy
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Handle offline page requests
async function handleOfflineRequest(request) {
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  const cachedResponse = await cache.match('/offline.html');
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fallback offline page
  return new Response(
    '<h1>Offline</h1><p>You are currently offline. Please check your connection.</p>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Handle static assets
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

// Handle other requests
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

// Create offline response for critical endpoints
async function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Try to get data from IndexedDB first
  const offlineData = await getOfflineDataFromDB(url.pathname);
  if (offlineData) {
    return new Response(
      JSON.stringify({
        success: true,
        data: offlineData,
        offline: true,
        message: 'Showing cached data while offline'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'service-worker-offline-db'
        }
      }
    );
  }
  
  // Fallback to localStorage
  const fallbackData = await getOfflineData(url.pathname);
  
  return new Response(
    JSON.stringify({
      success: true,
      data: fallbackData,
      offline: true,
      message: 'You are currently offline. Showing cached data.'
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

// Get offline data from IndexedDB
async function getOfflineDataFromDB(pathname) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onerror = () => resolve(null);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('offlineData')) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      
      let key = 'default';
      if (pathname.includes('/api/account')) key = 'account';
      else if (pathname.includes('/api/transactions')) key = 'transactions';
      else if (pathname.includes('/api/balance')) key = 'balance';
      
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.data : null);
      };
      
      getRequest.onerror = () => resolve(null);
    };
    
    request.onerror = () => resolve(null);
  });
}

// Queue sync requests for background processing
async function queueSyncRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const syncItem = {
        type: 'api_request',
        data: requestData,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const addRequest = store.add(syncItem);
      
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Enhanced background sync for queued transactions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-transactions') {
    event.respondWith(syncQueuedTransactions());
  } else if (event.tag === 'background-sync-api-requests') {
    event.respondWith(syncQueuedApiRequests());
  }
});

// Sync queued transactions
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

// Sync queued API requests
async function syncQueuedApiRequests() {
  try {
    const queuedRequests = await getQueuedApiRequests();
    
    for (const queuedRequest of queuedRequests) {
      try {
        const response = await fetch(queuedRequest.data.url, {
          method: queuedRequest.data.method,
          headers: queuedRequest.data.headers,
          body: queuedRequest.data.body
        });
        
        if (response.ok) {
          await removeQueuedApiRequest(queuedRequest.id);
          
          // Notify the client about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'API_REQUEST_SYNCED',
                request: queuedRequest
              });
            });
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync API request', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: API request sync failed', error);
  }
}

// Get queued API requests from IndexedDB
async function getQueuedApiRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('type');
      const getRequest = index.getAll('api_request');
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

// Remove synced API request from queue
async function removeQueuedApiRequest(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      vibrate: data.vibrate || [100, 50, 100],
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || 'banking-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Banking App', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data;
  
  if (event.action) {
    // Handle action buttons
    console.log('Service Worker: Notification action clicked', event.action);
    
    if (event.action === 'view_transaction') {
      event.waitUntil(
        clients.openWindow('/transactions')
      );
    } else if (event.action === 'approve_payment') {
      // Handle payment approval
      event.waitUntil(
        handlePaymentApproval(data.paymentId)
      );
    }
  } else {
    // Handle notification body click
    const urlToOpen = data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // If we have a window open, focus it
          for (const client of windowClients) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise, open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Handle payment approval from notification
async function handlePaymentApproval(paymentId) {
  try {
    const response = await fetch('/api/payments/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId })
    });
    
    if (response.ok) {
      // Notify all clients about successful approval
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PAYMENT_APPROVED',
            paymentId: paymentId
          });
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Failed to approve payment', error);
  }
}

// Enhanced message handling
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (!event.data) return;
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_OFFLINE_DATA':
      cacheOfflineData(data.key, data.data);
      break;
      
    case 'CLEAR_OFFLINE_DATA':
      clearOfflineData();
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage(getCacheStatus());
      break;
      
    case 'SYNC_NOW':
      event.waitUntil(
        Promise.all([
          syncQueuedTransactions(),
          syncQueuedApiRequests()
        ])
      );
      break;
  }
});

// Cache offline data in IndexedDB
async function cacheOfflineData(key, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const dataItem = {
        key: key,
        data: data,
        timestamp: new Date().toISOString()
      };
      
      const putRequest = store.put(dataItem);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Clear offline data
async function clearOfflineData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Get cache status
async function getCacheStatus() {
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
    totalCaches: cacheNames.length,
    timestamp: new Date().toISOString()
  };
}

// Get queued transactions (existing function)
async function getQueuedTransactions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedTransactions'], 'readonly');
      const store = transaction.objectStore('queuedTransactions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// Remove queued transaction (existing function)
async function removeQueuedTransaction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BankingAppOfflineDB', 2);
    
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

// Get offline data (existing function)
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

console.log('Service Worker: Enhanced service worker loaded with advanced offline capabilities');