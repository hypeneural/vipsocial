/// <reference lib="webworker" />

const CACHE_NAME = "vipsocial-v1";
const RUNTIME_CACHE = "runtime-v1";

// Assets to cache on install
const PRECACHE_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Precaching assets");
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Activate immediately
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log("[SW] Deleting old cache:", name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Take control immediately
    (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event: FetchEvent) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API requests (always fetch from network)
    if (url.pathname.startsWith("/api")) {
        return;
    }

    // Skip browser extensions
    if (!url.protocol.startsWith("http")) return;

    // For navigation requests, try network first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache for offline use
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache or offline page
                    return caches.match(request).then((cached) => {
                        return cached || caches.match("/");
                    });
                })
        );
        return;
    }

    // For static assets, try cache first then network
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    // Return cached and update in background
                    const fetchPromise = fetch(request).then((response) => {
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, response.clone());
                        });
                        return response;
                    });
                    return cached;
                }
                // Not in cache, fetch and cache
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // For other requests, network first
    event.respondWith(
        fetch(request)
            .then((response) => {
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event: SyncEvent) => {
    if (event.tag === "sync-pending") {
        console.log("[SW] Background sync triggered");
        // Handle pending sync operations
    }
});

// Push notifications
self.addEventListener("push", (event: PushEvent) => {
    const data = event.data?.json() ?? {};
    const title = data.title || "VipSocial";
    const options: NotificationOptions = {
        body: data.body || "Você tem uma nova notificação",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: data.tag || "default",
        data: data.url || "/",
    };

    event.waitUntil(
        (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener("notificationclick", (event: NotificationEvent) => {
    event.notification.close();
    const url = event.notification.data || "/";

    event.waitUntil(
        (self as unknown as ServiceWorkerGlobalScope).clients.matchAll({ type: "window" }).then((clients) => {
            // Focus existing window or open new
            for (const client of clients) {
                if (client.url === url && "focus" in client) {
                    return (client as WindowClient).focus();
                }
            }
            return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url);
        })
    );
});

export { };
