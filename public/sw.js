/**
 * Service Worker PWA — Emarzona
 * - Assets versionnés (hash Vite) : network-first, pas de cache stale post-deploy
 * - Images : cache-first avec bucket dédié
 * - Shell HTML : network-first + fallback offline
 */

const CACHE_VERSION = '__EMARZONA_BUILD_ID__';
const STATIC_CACHE_NAME = `emarzona-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `emarzona-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `emarzona-images-${CACHE_VERSION}`;
/** Limite d'entrées images pour éviter de saturer le quota Cache Storage */
const IMAGE_CACHE_MAX_ENTRIES = 150;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

/** Fichiers émis par Vite avec hash de contenu (évite chunks obsolètes après deploy). */
function isHashedBuildAsset(pathname) {
  return /\/(js|assets|fonts)\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|mjs|woff2?)$/i.test(pathname);
}

function networkFirst(request, cacheName, { cacheOk = true } = {}) {
  return fetch(request)
    .then(response => {
      if (cacheOk && response.status === 200 && cacheName) {
        const clone = response.clone();
        caches.open(cacheName).then(cache => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

async function trimImageCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

/** Stale-while-revalidate : affiche le cache, met à jour en arrière-plan. */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(cache =>
    cache.match(request).then(cached => {
      const networkUpdate = fetch(request)
        .then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            void cache.put(request, clone).then(() =>
              trimImageCache(cacheName, IMAGE_CACHE_MAX_ENTRIES)
            );
          }
          return response;
        })
        .catch(() => undefined);
      if (cached) {
        void networkUpdate;
        return cached;
      }
      return networkUpdate;
    })
  );
}

/** Network-only pour JS/CSS hashés — jamais servir un vieux chunk depuis le cache SW. */
function networkOnlyHashedAsset(request) {
  return fetch(request).catch(() => undefined);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(
            name =>
              name.startsWith('emarzona-') &&
              name !== STATIC_CACHE_NAME &&
              name !== DYNAMIC_CACHE_NAME &&
              name !== IMAGE_CACHE_NAME
          )
          .map(name => caches.delete(name))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.includes('/realtime/')) return;

  // Ne jamais intercepter les API Supabase (auth, REST, Edge Functions)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  const externalDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.exchangerate-api.com',
    'www.googletagmanager.com',
    'www.google-analytics.com',
  ];

  if (
    externalDomains.some(
      domain => url.hostname === domain || url.hostname.endsWith('.' + domain)
    )
  ) {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // JS/CSS/fonts versionnés : toujours le réseau (évite white screen post-release)
  if (
    isHashedBuildAsset(url.pathname) ||
    (url.pathname.startsWith('/js/') && url.pathname.endsWith('.js')) ||
    (url.pathname.startsWith('/assets/') &&
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')))
  ) {
    event.respondWith(
      networkOnlyHashedAsset(request).then(
        response =>
          response ||
          new Response('Asset unavailable offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
      )
    );
    return;
  }

  // Fonts / CSS non hashés (legacy) : network-first
  if (
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    (url.pathname.endsWith('.css') && !isHashedBuildAsset(url.pathname))
  ) {
    event.respondWith(networkFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // Images Supabase : stale-while-revalidate (affiche le cache, met à jour en arrière-plan)
  if (url.pathname.includes('/storage/v1/object/public/')) {
    event.respondWith(
      staleWhileRevalidate(request, IMAGE_CACHE_NAME).catch(() =>
        caches.match('/placeholder.svg')
      )
    );
    return;
  }

  // Images statiques locales : cache-first
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            // Clone synchronously before the page consumes the body
            if (response.status === 200) {
              const clone = response.clone();
              void caches.open(IMAGE_CACHE_NAME).then(cache =>
                cache
                  .put(request, clone)
                  .then(() => trimImageCache(IMAGE_CACHE_NAME, IMAGE_CACHE_MAX_ENTRIES))
              );
            }
            return response;
          })
          .catch(() => caches.match('/placeholder.svg'));
      })
    );
    return;
  }

  // Navigation & API : network-first
  event.respondWith(
    networkFirst(request, DYNAMIC_CACHE_NAME).catch(() => {
      if (request.mode === 'navigate') {
        return caches.match('/index.html').then(html => html || caches.match('/offline.html'));
      }
      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

async function syncForms() {
  // Extension point pour la file offline
}

self.addEventListener('push', event => {
  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez reçu une nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {},
    requireInteraction: false,
    soundEnabled: true,
    vibrationEnabled: true,
    vibrationIntensity: 'medium',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.type || notificationData.tag,
        data: data.data || data.metadata || {},
        requireInteraction: data.requireInteraction || false,
        url: data.url || data.action_url || '/',
        soundEnabled:
          data.soundEnabled !== undefined ? data.soundEnabled : notificationData.soundEnabled,
        vibrationEnabled:
          data.vibrationEnabled !== undefined
            ? data.vibrationEnabled
            : notificationData.vibrationEnabled,
        vibrationIntensity: data.vibrationIntensity || notificationData.vibrationIntensity,
      };
    } catch {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const getVibrationPattern = () => {
    if (!notificationData.vibrationEnabled) return [];
    switch (notificationData.vibrationIntensity) {
      case 'light':
        return [100, 50, 100];
      case 'heavy':
        return [300, 150, 300];
      default:
        return [200, 100, 200];
    }
  };

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: { ...notificationData.data, url: notificationData.url },
    requireInteraction: notificationData.requireInteraction,
    silent: !notificationData.soundEnabled,
    vibrate: getVibrationPattern(),
    timestamp: Date.now(),
    actions: notificationData.data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => cache.addAll(urls))
    );
  }
});
