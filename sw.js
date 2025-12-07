// Service Worker for 數學勇者傳說 PWA
const CACHE_NAME = 'math-hero-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './game.js',
    './manifest.json',
    './icon/icon-72x72.png',
    './icon/icon-96x96.png',
    './icon/icon-128x128.png',
    './icon/icon-144x144.png',
    './icon/icon-152x152.png',
    './icon/icon-192x192.png',
    './icon/icon-384x384.png',
    './icon/icon-512x512.png'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('已開啟快取');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('所有資源已快取');
                return self.skipWaiting();
            })
    );
});

// 啟動 Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker 已啟動');
            return self.clients.claim();
        })
    );
});

// 攔截請求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果有快取，返回快取
                if (response) {
                    return response;
                }

                // 否則，從網路取得
                return fetch(event.request).then(response => {
                    // 檢查是否為有效回應
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 複製回應
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // 離線時返回主頁面
                return caches.match('./index.html');
            })
    );
});
