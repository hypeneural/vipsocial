/**
 * Service Worker Registration Utility
 */

interface SWRegistrationOptions {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
}

const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(/^127(?:\.\d+){0,2}\.\d+$/)
);

export async function registerSW(options: SWRegistrationOptions = {}) {
    if (!("serviceWorker" in navigator)) {
        console.log("[SW] Service workers not supported");
        return;
    }

    // Only register in production or for testing
    if (import.meta.env.DEV && !import.meta.env.VITE_SW_DEV) {
        console.log("[SW] Skipping registration in development");
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
        });

        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        // New content available
                        console.log("[SW] New content available, refresh to update");
                        options.onUpdate?.(registration);
                    } else {
                        // Content cached for offline use
                        console.log("[SW] Content cached for offline use");
                        options.onSuccess?.(registration);
                    }
                }
            };
        };

        console.log("[SW] Registered successfully");
        return registration;
    } catch (error) {
        console.error("[SW] Registration failed:", error);
        options.onError?.(error as Error);
    }
}

export async function unregisterSW() {
    if (!("serviceWorker" in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const result = await registration.unregister();
        console.log("[SW] Unregistered:", result);
        return result;
    } catch (error) {
        console.error("[SW] Unregister failed:", error);
        return false;
    }
}

/**
 * Check if there's a new service worker waiting
 */
export async function checkForUpdates(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return registration.waiting !== null;
    } catch (error) {
        console.error("[SW] Update check failed:", error);
        return false;
    }
}

/**
 * Skip waiting and activate new SW
 */
export async function skipWaitingAndReload() {
    const registration = await navigator.serviceWorker.ready;

    if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
    }
}

export default registerSW;
