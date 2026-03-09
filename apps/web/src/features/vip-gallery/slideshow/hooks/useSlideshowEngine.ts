import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
    prefetchBrandingAsset,
    prefetchSlideAsset,
    removeCachedSlideAsset,
} from "../engine/cache";
import {
    createEmptyPlayerState,
    buildPrefetchQueue,
    isRenderable,
    selectCurrentItem,
    toPersistedState,
} from "../engine/selectors";
import {
    clearPersistedSlideshowState,
    estimateStorageUsage,
    getPersistedSlideshowState,
    requestPersistentStorage,
    savePersistedSlideshowState,
} from "../engine/storage";
import slideshowEngineReducer from "../engine/reducer";
import type {
    PlayerVisualStatus,
    SlideMedia,
    SlideMediaUpdatedPayload,
    SlideRuntimeItem,
    SlideshowBootData,
    SlideshowStatusChangedPayload,
    SlideSettings,
} from "../types";

export function useSlideshowEngine(code: string) {
    const [state, dispatch] = useReducer(slideshowEngineReducer, createEmptyPlayerState(code));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const stateRef = useRef(state);
    const codeRef = useRef(code);
    const prefetchMapRef = useRef(new Map<string, Promise<void>>());

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        codeRef.current = code;
        dispatch({ type: "reset", code });
        setErrorMessage(null);
    }, [code]);

    const refreshStorageInfo = useCallback(async () => {
        const [persisted, storageEstimate] = await Promise.all([
            requestPersistentStorage(),
            estimateStorageUsage(),
        ]);

        dispatch({
            type: "set-storage",
            storage: {
                persisted,
                quota: storageEstimate.quota ?? null,
                usage: storageEstimate.usage ?? null,
            },
        });
    }, []);

    useEffect(() => {
        let active = true;

        const restoreLocalState = async () => {
            const [saved, persisted, storageEstimate] = await Promise.all([
                getPersistedSlideshowState(code).catch(() => null),
                requestPersistentStorage(),
                estimateStorageUsage(),
            ]);

            if (!active) {
                return;
            }

            dispatch({
                type: "restore",
                code,
                persisted: saved ?? null,
                storage: {
                    persisted,
                    quota: storageEstimate.quota ?? null,
                    usage: storageEstimate.usage ?? null,
                },
            });
        };

        void restoreLocalState();

        return () => {
            active = false;
        };
    }, [code]);

    useEffect(() => {
        savePersistedSlideshowState(toPersistedState(state)).catch(() => {
            // Persistencia local nao pode quebrar o player.
        });
    }, [state]);

    const ensureRuntimeItemReady = useCallback(async (
        candidate: SlideRuntimeItem,
        options: { preserveExistingRender?: boolean; matchByIdOnly?: boolean } = {}
    ) => {
        const requestKey = `${candidate.id}:${candidate.url}`;
        const existingRequest = prefetchMapRef.current.get(requestKey);

        if (existingRequest) {
            return existingRequest;
        }

        const task = (async () => {
            dispatch({
                type: "media-loading",
                candidate,
                matchByIdOnly: options.matchByIdOnly,
                preserveExistingRender: options.preserveExistingRender,
            });

            try {
                const metadata = await prefetchSlideAsset(candidate);

                dispatch({
                    type: "media-ready",
                    candidate,
                    metadata,
                    matchByIdOnly: options.matchByIdOnly,
                });
            } catch (error) {
                dispatch({
                    type: "media-error",
                    candidate,
                    matchByIdOnly: options.matchByIdOnly,
                    errorMessage: error instanceof Error ? error.message : "Falha ao cachear a midia",
                });
            } finally {
                prefetchMapRef.current.delete(requestKey);
                void refreshStorageInfo();
            }
        })();

        prefetchMapRef.current.set(requestKey, task);
        await task;
    }, [refreshStorageInfo]);

    const primeSnapshotAssets = useCallback(async (
        snapshot: SlideshowBootData,
        items: SlideRuntimeItem[],
        currentIndex: number
    ) => {
        await Promise.all([
            prefetchBrandingAsset(snapshot.settings.background),
            prefetchBrandingAsset(snapshot.settings.partnerLogo),
        ]);

        const queue = buildPrefetchQueue(items, currentIndex, snapshot.settings.limite);

        for (const item of queue) {
            await ensureRuntimeItemReady(item);
        }
    }, [ensureRuntimeItemReady]);

    const applySnapshot = useCallback((snapshot: SlideshowBootData, fallbackStatus: PlayerVisualStatus = "playing") => {
        const nextState = slideshowEngineReducer(stateRef.current, {
            type: "apply-snapshot",
            snapshot,
            fallbackStatus,
        });

        dispatch({
            type: "apply-snapshot",
            snapshot,
            fallbackStatus,
        });

        setErrorMessage(null);
        void primeSnapshotAssets(snapshot, nextState.items, nextState.currentIndex);
    }, [primeSnapshotAssets]);

    const markSyncError = useCallback((message: string) => {
        dispatch({ type: "sync-error" });
        setErrorMessage(message);
    }, []);

    const applySettings = useCallback((settings: SlideSettings) => {
        dispatch({ type: "apply-settings", settings });
        void Promise.all([
            prefetchBrandingAsset(settings.background),
            prefetchBrandingAsset(settings.partnerLogo),
        ]);
    }, []);

    const handleStatusChanged = useCallback((payload: SlideshowStatusChangedPayload) => {
        dispatch({
            type: "status-changed",
            payload,
        });
    }, []);

    const markExpired = useCallback((message?: string | null) => {
        dispatch({ type: "mark-expired" });
        setErrorMessage(message || "O telao foi encerrado.");
        void clearPersistedSlideshowState(codeRef.current);
    }, []);

    const handleNewMedia = useCallback((payload: SlideMedia) => {
        const current = stateRef.current;
        const existing = current.items.find((item) => item.id === payload.id) ?? null;
        const shouldPrefetch = !existing || existing.url !== payload.url;

        dispatch({
            type: "new-media",
            media: payload,
        });

        if (shouldPrefetch) {
            const candidate: SlideRuntimeItem = {
                ...(existing ?? {
                    assetStatus: "loading",
                    orientation: null,
                    width: null,
                    height: null,
                    cachedAt: null,
                    lastError: null,
                    playedAt: null,
                }),
                ...payload,
                assetStatus: "loading",
                orientation: shouldPrefetch ? null : existing?.orientation ?? null,
                width: shouldPrefetch ? null : existing?.width ?? null,
                height: shouldPrefetch ? null : existing?.height ?? null,
                cachedAt: shouldPrefetch ? null : existing?.cachedAt ?? null,
                lastError: null,
            };

            void ensureRuntimeItemReady(candidate);
        }
    }, [ensureRuntimeItemReady]);

    const handleMediaUpdated = useCallback((payload: SlideMediaUpdatedPayload) => {
        const existingItem = stateRef.current.items.find((item) => item.id === payload.id) ?? null;

        if (!existingItem) {
            if (payload.url) {
                handleNewMedia({
                    id: payload.id,
                    url: payload.url,
                    type: payload.type ?? "image",
                    sender_name: payload.sender_name ?? null,
                    sender_key: payload.sender_key ?? null,
                    texto_curto: payload.texto_curto ?? null,
                    highlight_score: payload.highlight_score ?? 0,
                    created_at: payload.created_at ?? null,
                });
            }
            return;
        }

        dispatch({
            type: "media-meta",
            payload,
        });

        if (!payload.url || payload.url === existingItem.url) {
            return;
        }

        const candidate: SlideRuntimeItem = {
            ...existingItem,
            url: payload.url,
            type: payload.type ?? existingItem.type,
            sender_name: payload.sender_name ?? existingItem.sender_name,
            sender_key: payload.sender_key ?? existingItem.sender_key,
            texto_curto: payload.texto_curto ?? existingItem.texto_curto,
            highlight_score: payload.highlight_score ?? existingItem.highlight_score,
            created_at: payload.created_at ?? existingItem.created_at,
        };

        void ensureRuntimeItemReady(candidate, {
            preserveExistingRender: true,
            matchByIdOnly: true,
        });
    }, [ensureRuntimeItemReady, handleNewMedia]);

    const handleMediaDeleted = useCallback((id: string) => {
        const removedUrl = stateRef.current.items.find((item) => item.id === id)?.url ?? null;

        dispatch({
            type: "media-deleted",
            id,
        });

        if (removedUrl) {
            void removeCachedSlideAsset(removedUrl);
        }
    }, []);

    const advance = useCallback(() => {
        dispatch({ type: "advance" });
    }, []);

    useEffect(() => {
        if (!state.settings || state.status !== "playing") {
            return;
        }

        const readyCount = state.items.filter(isRenderable).length;

        if (readyCount === 0) {
            return;
        }

        const timeout = window.setTimeout(() => {
            advance();
        }, state.settings.intervalo);

        return () => window.clearTimeout(timeout);
    }, [advance, state.currentIndex, state.items, state.settings, state.status]);

    const currentItem = useMemo(() => selectCurrentItem(state), [state]);

    return {
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
        refreshStorageInfo,
        clearErrorMessage: () => setErrorMessage(null),
    };
}

export default useSlideshowEngine;
