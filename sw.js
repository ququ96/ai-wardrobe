/* AI衣橱 PWA Service Worker - 离线缓存增强版 */
const CACHE_NAME = 'ai-wardrobe-v2';
/* 预缓存核心资源（安装时立即缓存） */
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-512.png',
  './icon-192.png'
];

/* 安装：预缓存核心资源 */
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(PRECACHE.filter(url => url !== './icon-192.png'))
        .catch(() => cache.addAll(['./index.html', './manifest.json', './icon-512.png']))
    )
  );
  self.skipWaiting();
});

/* 激活：清除旧版本缓存 */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 网络请求：缓存优先策略，离线时返回缓存 */
self.addEventListener('fetch', evt => {
  const req = evt.request;
  /* 只处理GET请求 */
  if (req.method !== 'GET') return;
  evt.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        /* 缓存成功的同源GET请求（运行时缓存，实现离线可用） */
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        /* 网络失败时，返回缓存的index.html作为离线兜底 */
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
