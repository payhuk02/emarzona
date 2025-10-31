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
      // Cache les assets de manière individuelle pour gérer les erreurs gracieusement
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Failed to cache ${asset}:`, err);
            // Ne pas throw pour éviter de casser l'installation du SW
            return null;
          })
        )
      );
    })
  );
  
  // Activer immédiatement le nouveau Service Worker
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
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
      }),
      // Réclamer les clients immédiatement
      self.clients.claim(),
      // Nettoyer les références aux chunks obsolètes
      caches.open(CACHE_NAMES.static).then((cache) => {
        return cache.keys().then((requests) => {
          // Vérifier que tous les fichiers existent encore
          return Promise.allSettled(
            requests.map((request) => {
              return fetch(request, { method: 'HEAD' })
                .then((response) => {
                  // Si 404, supprimer du cache
                  if (response.status === 404) {
                    console.warn('[SW] Removing 404 resource from cache:', request.url);
                    return cache.delete(request);
                  }
                })
                .catch(() => {
                  // Si erreur réseau, supprimer aussi
                  console.warn('[SW] Removing unreachable resource from cache:', request.url);
                  return cache.delete(request);
                });
            })
          );
        });
      }).catch((err) => {
        console.warn('[SW] Error cleaning static cache:', err);
      })
    ])
  );
});

// Stratégies de cache
const strategies = {
  // Network First (pour les API calls)
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const responseClone = response.clone();
        const cache = await caches.open(CACHE_NAMES.api);
        cache.put(request, responseClone).catch((err) => {
          console.warn('[SW] Failed to cache API response:', err);
        });
      }
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // Retourner une réponse d'erreur au lieu de throw
      console.warn('[SW] Network error and no cache:', request.url, error);
      return new Response(JSON.stringify({ error: 'Network error' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  
  // Cache First (pour les assets statiques)
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Vérifier que le cache n'est pas obsolète en testant la réponse
      return cachedResponse;
    }
    
    try {
      const response = await fetch(request);
      
      // Si 404, supprimer du cache s'il existe et retourner erreur
      if (response.status === 404) {
        console.warn('[SW] Resource not found (404):', request.url);
        const cache = await caches.open(CACHE_NAMES.static);
        await cache.delete(request); // Nettoyer si présent
        // Retourner une réponse qui redirige vers l'index pour SPA
        if (request.url.includes('.js') || request.url.includes('.css')) {
          // Pour les chunks, ne pas casser l'app, laisser le navigateur gérer
          return response;
        }
        return response;
      }
      
      if (response.ok) {
        const responseClone = response.clone();
        const cache = await caches.open(CACHE_NAMES.static);
        cache.put(request, responseClone).catch((err) => {
          console.warn('[SW] Failed to cache static asset:', err);
        });
      }
      return response;
    } catch (error) {
      // Ne pas throw, retourner une réponse d'erreur pour éviter les erreurs non gérées
      console.warn('[SW] Cache first fetch failed:', request.url, error);
      // Si c'est un chunk JS/CSS manquant, retourner une réponse qui ne casse pas l'app
      if (request.url.includes('.js') || request.url.includes('.css')) {
        return new Response('', {
          status: 404,
          statusText: 'Not Found'
        });
      }
      return new Response('Asset not available', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  },
  
  // Stale While Revalidate (pour les images)
  staleWhileRevalidate: async (request) => {
    try {
      const cache = await caches.open(CACHE_NAMES.images);
      const cachedResponse = await caches.match(request);
      
      // Lancer le fetch en arrière-plan sans bloquer
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            cache.put(request, responseClone).catch((err) => {
              console.warn('[SW] Failed to cache response:', err);
            });
          }
          return response;
        })
        .catch((error) => {
          // Ne pas throw, juste logger l'erreur
          console.warn('[SW] Failed to fetch in staleWhileRevalidate:', request.url, error);
          // Retourner une réponse d'erreur au lieu de null
          return new Response('Fetch failed', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      
      // Retourner la version cache immédiatement si disponible, sinon attendre le fetch
      if (cachedResponse) {
        // Lancer le fetch en arrière-plan mais ne pas attendre
        fetchPromise.catch(() => {}); // Ignorer les erreurs du fetch en arrière-plan
        return cachedResponse;
      }
      
      // Si pas de cache, attendre le fetch
      const freshResponse = await fetchPromise;
      if (freshResponse && freshResponse.status !== 503) {
        return freshResponse;
      }
      
      // Si le fetch échoue et pas de cache, retourner une réponse d'erreur
      return new Response('Resource not available', { 
        status: 503,
        statusText: 'Service Unavailable'
      });
    } catch (error) {
      console.warn('[SW] Error in staleWhileRevalidate:', error);
      return new Response('Resource not available', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
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
  
  // Ignorer les requêtes vers des domaines externes (Google Fonts, etc.)
  // Ces ressources sont déjà gérées via <link> dans le HTML et peuvent être bloquées par CSP
  const externalDomains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  if (externalDomains.some(domain => url.hostname.includes(domain))) {
    // Laisser le navigateur gérer ces requêtes normalement sans interception
    return;
  }
  
  // API calls : Network First
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      strategies.networkFirst(request).catch((error) => {
        console.warn('[SW] Network first failed:', error);
        return new Response(JSON.stringify({ error: 'Network error' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Images : Stale While Revalidate
  if (request.destination === 'image') {
    event.respondWith(
      strategies.staleWhileRevalidate(request).catch((error) => {
        console.warn('[SW] Stale while revalidate failed:', error);
        return new Response('Image not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }
  
  // Assets statiques : Cache First (seulement pour les ressources locales)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    // Vérifier que c'est une ressource locale
    if (url.origin === self.location.origin || url.hostname.includes('supabase.co')) {
      event.respondWith(
        strategies.cacheFirst(request).catch((error) => {
          console.warn('[SW] Cache first failed:', error);
          // Retourner une réponse vide plutôt que throw pour éviter les erreurs
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
      );
      return;
    }
    // Pour les ressources externes, ne pas intercepter
    return;
  }
  
  // Navigation : Network First avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cloner avant de mettre en cache
          const responseClone = response.clone();
          const cache = caches.open(CACHE_NAMES.dynamic);
          cache.then((c) => c.put(request, responseClone)).catch((err) => {
            console.warn('[SW] Failed to cache navigation:', err);
          });
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
  event.respondWith(
    strategies.networkFirst(request).catch((error) => {
      console.warn('[SW] Default strategy failed:', error);
      return new Response(JSON.stringify({ error: 'Network error' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    })
  );
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

// Gestion des erreurs globales
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
  // Empêcher la propagation de l'erreur
  event.preventDefault();
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
  // Empêcher l'erreur de remonter et casser l'application
  event.preventDefault();
});

console.log('[SW] Service Worker loaded');
