/**
 * Service Worker pour PWA
 * Cache des assets statiques et support offline
 */

const CACHE_VERSION = 'emarzona-v2';
const STATIC_CACHE_NAME = `emarzona-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `emarzona-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `emarzona-images-${CACHE_VERSION}`;

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - Cache les assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - Nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return !name.startsWith('emarzona-') || 
                   (name !== STATIC_CACHE_NAME && 
                    name !== DYNAMIC_CACHE_NAME && 
                    name !== IMAGE_CACHE_NAME);
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Stratégie Cache First pour assets, Network First pour API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers Supabase Realtime (WebSocket)
  if (url.pathname.includes('/realtime/')) {
    return;
  }

  // Stratégie Cache First pour les assets statiques (JS, CSS, fonts)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/css/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Stratégie Cache First avec expiration pour les images
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.includes('/storage/v1/object/public/') // Supabase Storage
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Retourner depuis le cache immédiatement
          return cachedResponse;
        }
        // Si pas en cache, fetch et mettre en cache
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // En cas d'erreur, retourner une image placeholder si disponible
          return caches.match('/placeholder.svg');
        });
      })
    );
    return;
  }

  // Stratégie Network First pour les pages et API
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les réponses valides
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'erreur réseau, retourner depuis le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner une page offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
