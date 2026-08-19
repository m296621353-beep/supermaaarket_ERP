// Service Worker for Supermarket ERP PWA
// v2: network-first for page navigation & JS/CSS so updates show immediately.
// Bump CACHE_NAME on every deploy so old caches are purged automatically.
const CACHE_NAME = 'supermarket-erp-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Ignore firebase / firestore network calls (managed natively by Firestore SDK offline persistence)
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('identitytoolkit')) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate';
  const isAppCode = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/index.html';

  // Network-first for the HTML page itself and JS/CSS bundles:
  // always try to fetch the latest version first, fall back to cache only when offline.
  if (isNavigation || isAppCode) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (isNavigation) return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-first (with background refresh) for everything else: icons, fonts, images.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {});
    })
  );
});
