import { useEffect, useRef, useState } from "react";
import createSlideshowEcho from "../lib/echo";
import type {
    SlideMedia,
    SlideMediaDeletedPayload,
    SlideMediaUpdatedPayload,
    SlideshowConnectionStatus,
    SlideshowExpiredPayload,
    SlideshowStatusChangedPayload,
    SlideSettings,
} from "../types";

interface UseSlideshowRealtimeOptions {
    code: string;
    onNewMedia: (payload: SlideMedia) => void;
    onMediaUpdated: (payload: SlideMediaUpdatedPayload) => void;
    onMediaDeleted: (payload: SlideMediaDeletedPayload) => void;
    onSettingsUpdated: (payload: SlideSettings) => void;
    onStatusChanged: (payload: SlideshowStatusChangedPayload) => void;
    onExpired: (payload: SlideshowExpiredPayload) => void;
    onReconnect?: () => void;
}

export function useSlideshowRealtime({
    code,
    onNewMedia,
    onMediaUpdated,
    onMediaDeleted,
    onSettingsUpdated,
    onStatusChanged,
    onExpired,
    onReconnect,
}: UseSlideshowRealtimeOptions) {
    const [connectionStatus, setConnectionStatus] = useState<SlideshowConnectionStatus>("idle");
    const callbacksRef = useRef({
        onNewMedia,
        onMediaUpdated,
        onMediaDeleted,
        onSettingsUpdated,
        onStatusChanged,
        onExpired,
        onReconnect,
    });

    useEffect(() => {
        callbacksRef.current = {
            onNewMedia,
            onMediaUpdated,
            onMediaDeleted,
            onSettingsUpdated,
            onStatusChanged,
            onExpired,
            onReconnect,
        };
    }, [
        onExpired,
        onMediaDeleted,
        onMediaUpdated,
        onNewMedia,
        onReconnect,
        onStatusChanged,
        onSettingsUpdated,
    ]);

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
                    callbacksRef.current.onReconnect?.();
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
                callbacksRef.current.onNewMedia(payload);
            })
            .listen(".slideshow.media-updated", (payload: SlideMediaUpdatedPayload) => {
                callbacksRef.current.onMediaUpdated(payload);
            })
            .listen(".slideshow.media-deleted", (payload: SlideMediaDeletedPayload) => {
                callbacksRef.current.onMediaDeleted(payload);
            })
            .listen(".slideshow.settings-updated", (payload: SlideSettings) => {
                callbacksRef.current.onSettingsUpdated(payload);
            })
            .listen(".slideshow.status-changed", (payload: SlideshowStatusChangedPayload) => {
                callbacksRef.current.onStatusChanged(payload);
            })
            .listen(".slideshow.event-expired", (payload: SlideshowExpiredPayload) => {
                callbacksRef.current.onExpired(payload);
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
    }, [code]);

    return {
        connectionStatus,
    };
}

export default useSlideshowRealtime;
