const CACHE_NAME = 'horas-extras-cache-v1';
const urlsToCache = [
    './', // Cacha el index.html
    'index.html',
    'css/style.css',
    'js/app.js',
    'js/helpers.js',
    'assets/trabajadores_maestro.csv', // ¡Importante: cachear el CSV!
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-512x512.png'
];

// Instalar Service Worker e iniciar el caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to add URLs to cache:', error);
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones y servir desde caché o red
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si encontramos en caché, lo servimos
                if (response) {
                    return response;
                }
                // Si no, vamos a la red
                return fetch(event.request)
                    .then(response => {
                        // Si la petición es exitosa, cacheamos la respuesta
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(error => {
                        // Manejo de errores de red, por ejemplo, devolver una página offline
                        console.error('Fetch failed:', event.request.url, error);
                        // Puedes devolver una página offline.html si la tuvieras
                        // return caches.match('offline.html');
                    });
            })
    );
});