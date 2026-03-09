import { useEffect, useState } from "react";
import createSlideshowEcho from "../lib/echo";
import type {
    SlideMedia,
    SlideMediaDeletedPayload,
    SlideMediaUpdatedPayload,
    SlideshowConnectionStatus,
    SlideshowExpiredPayload,
    SlideSettings,
} from "../types";

interface UseSlideshowRealtimeOptions {
    code: string;
    onNewMedia: (payload: SlideMedia) => void;
    onMediaUpdated: (payload: SlideMediaUpdatedPayload) => void;
    onMediaDeleted: (payload: SlideMediaDeletedPayload) => void;
    onSettingsUpdated: (payload: SlideSettings) => void;
    onExpired: (payload: SlideshowExpiredPayload) => void;
    onReconnect?: () => void;
}

export function useSlideshowRealtime({
    code,
    onNewMedia,
    onMediaUpdated,
    onMediaDeleted,
    onSettingsUpdated,
    onExpired,
    onReconnect,
}: UseSlideshowRealtimeOptions) {
    const [connectionStatus, setConnectionStatus] = useState<SlideshowConnectionStatus>("idle");

    useEffect(() => {
        const echo = createSlideshowEcho();

        if (!echo) {
            setConnectionStatus("error");
            return undefined;
        }

        const channelName = `slideshow.${code}`;
        const connector = echo.connector as {
            pusher?: {
                connection: {
                    bind: (event: string, callback: (payload?: unknown) => void) => void;
                    unbind: (event: string, callback: (payload?: unknown) => void) => void;
                };
            };
        };
        const pusherConnection = connector.pusher?.connection;
        let hasConnectedOnce = false;

        const handleStateChange = (payload?: unknown) => {
            const nextState = typeof payload === "object" && payload !== null && "current" in payload
                ? String((payload as { current?: string }).current)
                : "";

            if (nextState === "connected") {
                setConnectionStatus("connected");

                if (hasConnectedOnce) {
                    onReconnect?.();
                }

                hasConnectedOnce = true;
                return;
            }

            if (nextState === "connecting") {
                setConnectionStatus(hasConnectedOnce ? "reconnecting" : "connecting");
                return;
            }

            if (nextState === "disconnected") {
                setConnectionStatus("disconnected");
                return;
            }

            if (nextState === "unavailable" || nextState === "failed") {
                setConnectionStatus("error");
            }
        };

        const handleConnectionError = () => {
            setConnectionStatus("error");
        };

        setConnectionStatus("connecting");

        echo.channel(channelName)
            .listen(".slideshow.new-media", (payload: SlideMedia) => {
                onNewMedia(payload);
            })
            .listen(".slideshow.media-updated", (payload: SlideMediaUpdatedPayload) => {
                onMediaUpdated(payload);
            })
            .listen(".slideshow.media-deleted", (payload: SlideMediaDeletedPayload) => {
                onMediaDeleted(payload);
            })
            .listen(".slideshow.settings-updated", (payload: SlideSettings) => {
                onSettingsUpdated(payload);
            })
            .listen(".slideshow.event-expired", (payload: SlideshowExpiredPayload) => {
                onExpired(payload);
            });

        pusherConnection?.bind("state_change", handleStateChange);
        pusherConnection?.bind("error", handleConnectionError);

        return () => {
            pusherConnection?.unbind("state_change", handleStateChange);
            pusherConnection?.unbind("error", handleConnectionError);
            echo.leaveChannel(channelName);
            echo.disconnect();
            setConnectionStatus("disconnected");
        };
    }, [
        code,
        onExpired,
        onMediaDeleted,
        onMediaUpdated,
        onNewMedia,
        onReconnect,
        onSettingsUpdated,
    ]);

    return {
        connectionStatus,
    };
}

export default useSlideshowRealtime;
