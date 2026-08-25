const CACHE_NAME = 'portal-cij-v1';

// Assim que instalar, salva a página inicial e o core offline
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './core.js',
                './manifest.json'
            ]);
        })
    );
});

// Intercepta as requisições para funcionar sem internet
self.addEventListener('fetch', event => {
    // Evita conflito com o banco de dados do Firebase
    if (event.request.url.includes('firestore.googleapis.com')) return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            return fetch(event.request).then(networkResponse => {
                // Salva dinamicamente qualquer nova página/módulo que o usuário acessar
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Fallback caso não tenha internet e a tela não esteja em cache
            return new Response('Módulo não acessado anteriormente. Conecte-se à internet para carregar esta tela pela primeira vez.');
        })
    );
});