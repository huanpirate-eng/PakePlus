// Service Worker for offline functionality
const CACHE_NAME = 'quiter-v1';
const STATIC_CACHE = 'quiter-static-v1';
const DYNAMIC_CACHE = 'quiter-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/learning.html',
    '/community.html',
    '/css/styles.css',
    '/js/utils.js',
    '/js/loading.js',
    '/js/search.js',
    '/js/performance.js',
    '/js/validation.js',
    '/js/offline.js',
    '/js/darkmode.js'
];

// 安装事件
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static assets', error);
            })
    );
});

// 激活事件
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 删除旧版本的缓存
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只处理同源请求
    if (url.origin !== location.origin) {
        return;
    }
    
    // 对于导航请求（页面请求）
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // 如果网络请求成功，返回响应并缓存
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    // 网络请求失败，尝试从缓存获取
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // 如果缓存中也没有，返回离线页面
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // 对于其他请求（CSS、JS、图片等）
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // 从缓存返回，同时在后台更新缓存
                    fetch(request)
                        .then(response => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => {
                                        cache.put(request, responseClone);
                                    });
                            }
                        })
                        .catch(() => {
                            // 网络请求失败，忽略
                        });
                    
                    return cachedResponse;
                }
                
                // 缓存中没有，尝试网络请求
                return fetch(request)
                    .then(response => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.log('Service Worker: Network request failed', error);
                        
                        // 对于图片请求，返回占位符
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">图片加载失败</text></svg>',
                                {
                                    headers: {
                                        'Content-Type': 'image/svg+xml'
                                    }
                                }
                            );
                        }
                        
                        throw error;
                    });
            })
    );
});

// 后台同步
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // 通知主线程执行同步
            self.clients.matchAll()
                .then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'BACKGROUND_SYNC',
                            payload: 'sync-offline-data'
                        });
                    });
                })
        );
    }
});

// 推送通知
self.addEventListener('push', event => {
    console.log('Service Worker: Push received', event);
    
    const options = {
        body: event.data ? event.data.text() : '您有新的消息',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Quiter', options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // 打开应用
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 关闭通知
        event.notification.close();
    } else {
        // 默认行为：打开应用
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 消息处理
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        caches.keys()
            .then(cacheNames => {
                const promises = cacheNames.map(cacheName => {
                    return caches.open(cacheName)
                        .then(cache => cache.keys())
                        .then(keys => ({
                            name: cacheName,
                            count: keys.length
                        }));
                });
                
                return Promise.all(promises);
            })
            .then(cacheStats => {
                event.ports[0].postMessage({
                    type: 'CACHE_STATS',
                    payload: cacheStats
                });
            });
    }
});

// 错误处理
self.addEventListener('error', event => {
    console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});