/* Service Worker для офлайн-режима */
const CACHE_NAME = "geo-map-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png",
  "./nejnoe-probujdenie-2148.mp3",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
];

// Устанавливаем — кэшируем основные файлы
self.addEventListener("install", event => {
  console.log("[SW] Установка…");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Кэширую файлы…");
      return cache.addAll(ASSETS).catch(err => {
        console.warn("[SW] Некоторые файлы не закэшированы:", err);
      });
    })
  );
  self.skipWaiting();
});

// Активируем — удаляем старые кэши
self.addEventListener("activate", event => {
  console.log("[SW] Активация…");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Перехватываем запросы — сначала кэш, потом сеть
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Кэшируем успешные GET-запросы
        if (!response || response.status !== 200 || event.request.method !== "GET") {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Если сеть недоступна и нет в кэше — показываем главную
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
