const CACHE_NAME = "cocktail-finder-v5";
const ASSETS = [
    "./",
    "./index.html",
    "./styles.css",
    "./scripts/app.js",
    "./data/recipes.json",
    "./assets/favicon.png",
    "./assets/favicon.svg"
];

// Install Event: Cache assets
self.addEventListener("install", (event) => {
    self.skipWaiting(); // Force activation immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Caching assets");
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event: Cleanup old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch Event: Network First, Fallback to Cache
self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If efficient network response, clone and update cache
                // Check if valid url (scheme http/https) to avoid errors with chrome-extension:// etc
                if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request);
            })
    );
});
