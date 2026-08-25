const CACHE_NAME = 'portal-cij-v2'; // Mudamos para v2 para forçar a limpeza do cache antigo

// 1. Instalação: Salva os arquivos base e força a atualização imediata
self.addEventListener('install', event => {
    self.skipWaiting(); // Obriga o navegador a usar o novo Service Worker na hora
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

// 2. Ativação: Limpa qualquer cache velho (v1) que tenha ficado preso no dispositivo
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Estratégia de Busca: NETWORK FIRST (Internet Primeiro, Cache como Backup)
self.addEventListener('fetch', event => {
    // Ignora conexões diretas de banco de dados e APIs do Firebase
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('identitytoolkit') || 
        event.request.url.includes('google.com')) {
        return;
    }

    event.respondWith(
        // Tenta buscar a versão mais recente direto da internet
        fetch(event.request).then(networkResponse => {
            // Se deu certo, salva uma cópia nova no cache e mostra na tela
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            // Se falhar (ex: usuário está sem 4G/Wi-Fi), aí sim puxa do Cache Offline
            return caches.match(event.request);
        })
    );
});