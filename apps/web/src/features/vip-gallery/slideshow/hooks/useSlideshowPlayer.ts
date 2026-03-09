import { useCallback, useEffect, useRef } from "react";
import useSlideshowBoot from "./useSlideshowBoot";
import useSlideshowEngine from "./useSlideshowEngine";
import useSlideshowRealtime from "./useSlideshowRealtime";

export function useSlideshowPlayer(code: string) {
    const engine = useSlideshowEngine(code);
    const {
        state,
        currentItem,
        errorMessage,
        applySnapshot,
        applySettings,
        handleStatusChanged,
        handleNewMedia,
        handleMediaUpdated,
        handleMediaDeleted,
        markExpired,
        markSyncError,
    } = engine;

    const handleBootError = useCallback((message: string) => {
        markSyncError(message);
    }, [markSyncError]);

    const handleSnapshot = useCallback((snapshot: Parameters<typeof applySnapshot>[0]) => {
        applySnapshot(snapshot);
    }, [applySnapshot]);

    const handleExpired = useCallback((message?: string | null) => {
        markExpired(message);
    }, [markExpired]);

    const handleRealtimeExpired = useCallback((payload: { reason?: string }) => {
        markExpired(payload.reason || "O telao foi encerrado.");
    }, [markExpired]);

    const { connectionStatus } = useSlideshowRealtime({
        code,
        onNewMedia: handleNewMedia,
        onMediaUpdated: handleMediaUpdated,
        onMediaDeleted: handleMediaDeleted,
        onSettingsUpdated: applySettings,
        onStatusChanged: handleStatusChanged,
        onExpired: handleRealtimeExpired,
    });

    const { isSyncing, resync } = useSlideshowBoot({
        code,
        connectionStatus,
        onSnapshot: handleSnapshot,
        onExpired: handleExpired,
        onError: handleBootError,
    });

    const previousConnectionStatusRef = useRef(connectionStatus);

    useEffect(() => {
        const previousStatus = previousConnectionStatusRef.current;

        if (
            connectionStatus === "connected"
            && previousStatus !== "connected"
            && previousStatus !== "idle"
        ) {
            void resync();
        }

        previousConnectionStatusRef.current = connectionStatus;
    }, [connectionStatus, resync]);

    return {
        state,
        currentItem,
        errorMessage,
        isSyncing,
        connectionStatus,
        resync,
    };
}

export default useSlideshowPlayer;
