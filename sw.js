const CACHE_NAME = "cocktail-finder-v1";
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
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            // Return cached response if found
            if (cached) return cached;

            // Otherwise fetch from network
            return fetch(event.request).catch(() => {
                // If offline and request is for main page, return index (optional fallback)
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
