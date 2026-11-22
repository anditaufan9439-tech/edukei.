const CACHE_NAME = 'jejak-evav-3d-offline-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './audio.js',
  './world3d.js',
  './game.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './vendor/tailwindcss.js',
  './vendor/three.min.js'
];

// Instalasi Service Worker & Pre-cache seluruh aset lokal agar jalan 100% tanpa jaringan
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Bersihkan cache lama saat ada pembaruan versi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Strategi Cache-First dengan fallback jaringan (mengizinkan akses offline penuh)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache font Google / aset tambahan jika online agar tersedia offline berikutnya
          if (networkResponse && networkResponse.status === 200) {
            const url = event.request.url;
            if (url.startsWith(self.location.origin) || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
