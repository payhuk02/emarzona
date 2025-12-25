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

  // Ignorer les requêtes vers des domaines externes (Google Fonts, APIs externes, etc.)
  // Ces requêtes doivent être gérées directement par le navigateur pour respecter la CSP
  const externalDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.exchangerate-api.com',
    'www.googletagmanager.com',
    'www.google-analytics.com',
  ];
  
  if (externalDomains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) {
    return; // Laisser le navigateur gérer ces requêtes directement
  }

  // Ignorer les requêtes cross-origin (sauf celles déjà gérées ci-dessus)
  // Le service worker ne devrait intercepter que les requêtes same-origin
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase.co')) {
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
        // Mettre en cache les réponses valides (sauf les requêtes POST/PUT/DELETE)
        if (response.status === 200 && request.method === 'GET') {
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
            return caches.match('/index.html').then((html) => {
              if (html) {
                return html;
              }
              // Fallback vers offline.html si disponible
              return caches.match('/offline.html');
            });
          }
          return new Response('Offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Background Sync pour les requêtes POST/PUT/DELETE en échec
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

/**
 * Synchronise les formulaires en attente
 */
async function syncForms() {
  // Récupérer les formulaires en attente depuis IndexedDB
  // et les renvoyer au serveur
  // (Implémentation à compléter selon les besoins)
  console.log('[SW] Syncing forms...');
}

// Push event - Gérer les notifications push avec son et affichage
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez reçu une nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {},
    requireInteraction: false,
  };

  // Parser les données du push
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
      };
    } catch (e) {
      // Si les données ne sont pas en JSON, utiliser le texte brut
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Afficher la notification avec son (silent: false par défaut)
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: {
      ...notificationData.data,
      url: notificationData.url,
    },
    requireInteraction: notificationData.requireInteraction,
    silent: false, // ✅ SON ACTIVÉ - La notification fera du bruit
    vibrate: [200, 100, 200], // ✅ Vibration pour mobile
    timestamp: Date.now(),
    actions: notificationData.data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event - Ouvrir l'application quand on clique sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler pour communication avec l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});
