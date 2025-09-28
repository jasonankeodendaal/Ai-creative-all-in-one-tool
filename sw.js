// sw.js - Pre-caching and stale-while-revalidate strategy
const CACHE_NAME = 'ai-ad-generator-v2';
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/index.tsx', // As it is referenced directly in HTML
    '/icon.svg',
    '/maskable_icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('ServiceWorker: Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('ai-ad-generator-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('ServiceWorker: Deleting old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
        // Tell the active service worker to take control of the page immediately.
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Always go to network for API calls or non-GET requests
  // The VEO API response is fetched from a googleusercontent URL, so it should not be cached.
  if (request.method !== 'GET' || request.url.includes('google')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // For other GET requests, use stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If fetch is successful, update cache
          if (networkResponse.ok) {
             cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // if network fails and we have no cached response, the promise will reject
            console.error("ServiceWorker: Fetch failed:", err);
            throw err;
        });

        // Return cached response immediately if available, while fetch continues in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});