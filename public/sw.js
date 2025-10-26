/**
 * Service Worker Avancé pour Payhuk
 * Features : Cache stratégies, Mode offline, Background sync, Notifications push
 */

const CACHE_VERSION = 'payhuk-v1.0.0';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  images: `${CACHE_VERSION}-images`,
  api: `${CACHE_VERSION}-api`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activer immédiatement le nouveau Service Worker
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Supprimer les anciens caches
            return name.startsWith('payhuk-') && !Object.values(CACHE_NAMES).includes(name);
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// Stratégies de cache
const strategies = {
  // Network First (pour les API calls)
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAMES.api);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },
  
  // Cache First (pour les assets statiques)
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAMES.static);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Stale While Revalidate (pour les images)
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAMES.images);
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
      cache.put(request, response.clone());
      return response;
    });
    
    return cachedResponse || fetchPromise;
  },
};

// Interception des requêtes (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API calls : Network First
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(strategies.networkFirst(request));
    return;
  }
  
  // Images : Stale While Revalidate
  if (request.destination === 'image') {
    event.respondWith(strategies.staleWhileRevalidate(request));
    return;
  }
  
  // Assets statiques : Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(strategies.cacheFirst(request));
    return;
  }
  
  // Navigation : Network First avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cache = caches.open(CACHE_NAMES.dynamic);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback à la page offline
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503 });
        })
    );
    return;
  }
  
  // Défaut : Network First
  event.respondWith(strategies.networkFirst(request));
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncOrders() {
  try {
    // Récupérer les commandes en attente depuis IndexedDB
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Nettoyer les commandes synchronisées
    await clearPendingOrders();
    
    // Notifier l'utilisateur
    self.registration.showNotification('Commandes synchronisées', {
      body: 'Vos commandes ont été synchronisées avec succès !',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
    });
  } catch (error) {
    console.error('[SW] Error syncing orders:', error);
  }
}

async function syncCart() {
  try {
    // Synchroniser le panier
    console.log('[SW] Syncing cart...');
    // Implémentation de la sync du panier
  } catch (error) {
    console.error('[SW] Error syncing cart:', error);
  }
}

// Notifications Push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Payhuk',
    body: 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Action personnalisée
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    // Gérer les actions spécifiques
  }
  
  // Ouvrir l'application
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Messages du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAMES.dynamic).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// Helpers IndexedDB (pour Background Sync)
async function getPendingOrders() {
  // TODO: Implémenter avec IndexedDB
  return [];
}

async function clearPendingOrders() {
  // TODO: Implémenter avec IndexedDB
}

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker loaded');
