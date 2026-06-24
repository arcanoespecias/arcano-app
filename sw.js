// ===================== ARCANO SERVICE WORKER =====================
// Estrategia: NETWORK-FIRST con cache de respaldo
// Esto asegura que SIEMPRE se obtiene la ultima version del servidor.
// Solo usa cache si no hay conexion (offline).

const SW_VERSION = 'v17';

// Instalar: limpiar caches viejos y activarse inmediatamente
self.addEventListener('install', function(event) {
  console.log('[Arcano SW] Installing ' + SW_VERSION);
  // Limpiar todos los caches viejos
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.skipWaiting(); })
  );
});

// Activar: tomar control de todas las paginas inmediatamente
self.addEventListener('activate', function(event) {
  console.log('[Arcano SW] Activating ' + SW_VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch: SIEMPRE intentar red primero
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // No interceptar requests a GitHub API (sync)
  if (url.hostname === 'api.github.com') return;

  // Para navegacion (HTML): siempre red, con cache de respaldo
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function(response) {
          // Guardar en cache para uso offline
          var clone = response.clone();
          caches.open('arcano-nav-' + SW_VERSION).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          // Sin red: usar lo que haya en cache
          return caches.match(event.request).then(function(cached) {
            return cached || new Response('Sin conexion', { status: 503, statusText: 'Offline' });
          });
        })
    );
    return;
  }

  // Para assets (JS, CSS, imagenes): siempre red, cache de respaldo
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(function(response) {
        // Guardar en cache para offline
        var clone = response.clone();
        caches.open('arcano-assets-' + SW_VERSION).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Sin red: buscar en cache (cualquier version)
        return caches.match(event.request).then(function(cached) {
          return cached || new Response('', { status: 404 });
        });
      })
  );
});

// Escuchar mensajes desde la app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_ALL') {
    caches.keys().then(function(keys) {
      keys.forEach(function(k) { caches.delete(k); });
    });
  }
});