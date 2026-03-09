import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher?: typeof Pusher;
    }
}

window.Pusher = Pusher;

function parsePort(value?: string): number | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function createSlideshowEcho(): Echo<"pusher"> | null {
    const key = import.meta.env.VITE_PUSHER_APP_KEY;

    if (!key) {
        return null;
    }

    const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || undefined;
    const host = import.meta.env.VITE_PUSHER_HOST || undefined;
    const scheme = (import.meta.env.VITE_PUSHER_SCHEME || "https").toLowerCase();
    const port = parsePort(import.meta.env.VITE_PUSHER_PORT);
    const forceTLS = scheme === "https";

    return new Echo({
        broadcaster: "pusher",
        key,
        cluster,
        forceTLS,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        disableStats: true,
    });
}

export default createSlideshowEcho;
