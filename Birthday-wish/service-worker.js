// Service Worker for Birthday Notification

const CACHE_NAME = 'love-portal-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/service-worker.js'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  // Claim any clients immediately
  self.clients.claim();
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_BIRTHDAY_NOTIFICATION') {
    const { title, body, url } = event.data;
    self.registration.showNotification(title, {
      body: body,
      icon: '/favicon.ico', // Add a favicon.ico file or use another image path
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'birthday-notification',
      data: { url: url },
      actions: [
        { action: 'open', title: 'Open Portal' }
      ]
    });
  }
});

// Handle notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app and focus if already open
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        const url = event.notification.data.url || '/';
        
        // Check if there is already a window/tab open with this URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Fetch event - network first, then cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle navigations separately to allow the page to load fresh
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For all other requests, use network first, then cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Background sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'birthday-notification-sync') {
    event.waitUntil(checkBirthdayNotification());
  }
});

// Check if it's time to show the birthday notification
async function checkBirthdayNotification() {
  const today = new Date();
  
  // Check if today is May 12th
  if (today.getDate() === 12 && today.getMonth() === 4) { // May is month 4 (0-indexed)
    // If it's May 12th, show the birthday notification
    self.registration.showNotification('Happy Birthday Bristi! 🎂', {
      body: 'Wishing you a day filled with joy and beautiful memories! ❤️',
      icon: '/favicon.ico', // Add a favicon.ico file or use another image path
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'birthday-notification',
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'Open Portal' }
      ]
    });
  }
}

// Periodic checks using the Periodic Background Sync API (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'birthday-check') {
    event.waitUntil(checkBirthdayNotification());
  }
});

// Schedule periodic background sync (if supported)
async function registerPeriodicSync() {
  try {
    if ('periodicSync' in self.registration) {
      await self.registration.periodicSync.register('birthday-check', {
        minInterval: 24 * 60 * 60 * 1000 // Once a day
      });
    }
  } catch (error) {
    console.error('Periodic Sync could not be registered:', error);
  }
}
