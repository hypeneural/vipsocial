import { useCallback } from "react";
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

    const { isSyncing, resync } = useSlideshowBoot({
        code,
        onSnapshot: handleSnapshot,
        onExpired: handleExpired,
        onError: handleBootError,
    });

    const handleRealtimeExpired = useCallback((payload: { reason?: string }) => {
        markExpired(payload.reason || "O telao foi encerrado.");
    }, [markExpired]);

    const handleReconnect = useCallback(() => {
        void resync();
    }, [resync]);

    const { connectionStatus } = useSlideshowRealtime({
        code,
        onNewMedia: handleNewMedia,
        onMediaUpdated: handleMediaUpdated,
        onMediaDeleted: handleMediaDeleted,
        onSettingsUpdated: applySettings,
        onExpired: handleRealtimeExpired,
        onReconnect: handleReconnect,
    });

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
