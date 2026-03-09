import {
    createEmptyPlayerState,
    isRenderable,
    markItemAsPlayed,
    mergeServerSnapshot,
    nextReadyIndex,
    resolvePlayableIndex,
} from "./selectors";
import type {
    MediaOrientation,
    PlayerVisualStatus,
    SlideMedia,
    SlideMediaUpdatedPayload,
    SlideRuntimeItem,
    SlideshowBootData,
    SlideshowPlayerState,
    SlideSettings,
} from "../types";

type StorageState = NonNullable<SlideshowPlayerState["storage"]>;

export type SlideReadyMetadata = {
    width?: number;
    height?: number;
    orientation?: MediaOrientation;
    cachedAt: string;
};

export type SlideshowEngineAction =
    | { type: "reset"; code: string }
    | { type: "restore"; code: string; persisted?: Partial<SlideshowPlayerState> | null; storage?: Partial<StorageState> | null }
    | { type: "set-storage"; storage: Partial<StorageState> }
    | { type: "apply-snapshot"; snapshot: SlideshowBootData; fallbackStatus?: PlayerVisualStatus }
    | { type: "apply-settings"; settings: SlideSettings }
    | { type: "sync-error" }
    | { type: "mark-expired" }
    | { type: "new-media"; media: SlideMedia }
    | { type: "media-meta"; payload: SlideMediaUpdatedPayload }
    | { type: "media-loading"; candidate: SlideRuntimeItem; matchByIdOnly?: boolean; preserveExistingRender?: boolean }
    | { type: "media-ready"; candidate: SlideRuntimeItem; metadata: SlideReadyMetadata; matchByIdOnly?: boolean }
    | { type: "media-error"; candidate: SlideRuntimeItem; errorMessage: string; matchByIdOnly?: boolean }
    | { type: "media-deleted"; id: string }
    | { type: "advance" };

function mergeRuntimeItem(
    base: SlideRuntimeItem | undefined,
    media: SlideMedia
): SlideRuntimeItem {
    return {
        ...base,
        ...media,
        assetStatus: base?.assetStatus ?? "loading",
        orientation: base?.orientation ?? null,
        width: base?.width ?? null,
        height: base?.height ?? null,
        cachedAt: base?.cachedAt ?? null,
        lastError: null,
        playedAt: base?.playedAt ?? null,
    };
}

function matchesCandidate(
    item: SlideRuntimeItem,
    candidate: Pick<SlideRuntimeItem, "id" | "url">,
    matchByIdOnly = false
): boolean {
    return item.id === candidate.id && (matchByIdOnly || item.url === candidate.url);
}

function markPlayableState(
    current: SlideshowPlayerState,
    items: SlideRuntimeItem[],
    preferredIndex = current.currentIndex
): SlideshowPlayerState {
    const nextIndex = resolvePlayableIndex(items, preferredIndex);
    const nextStatus = items.some(isRenderable)
        ? (current.status === "expired" ? "expired" : "playing")
        : "idle";

    return {
        ...current,
        items: nextIndex >= 0 ? markItemAsPlayed(items, nextIndex) : items,
        currentIndex: nextIndex,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
    };
}

export function slideshowEngineReducer(
    current: SlideshowPlayerState,
    action: SlideshowEngineAction
): SlideshowPlayerState {
    switch (action.type) {
        case "reset":
            return createEmptyPlayerState(action.code);

        case "restore":
            return {
                ...createEmptyPlayerState(action.code),
                ...(action.persisted ?? {}),
                code: action.code,
                storage: {
                    ...createEmptyPlayerState(action.code).storage,
                    ...(action.persisted?.storage ?? {}),
                    ...(action.storage ?? {}),
                },
            };

        case "set-storage":
            return {
                ...current,
                storage: {
                    ...current.storage,
                    ...action.storage,
                },
            };

        case "apply-snapshot":
            return mergeServerSnapshot(current, action.snapshot, action.fallbackStatus);

        case "apply-settings":
            return {
                ...current,
                settings: {
                    ...current.settings,
                    ...action.settings,
                },
                updatedAt: new Date().toISOString(),
            };

        case "sync-error":
            return {
                ...current,
                status: current.items.some(isRenderable) ? current.status : "error",
                updatedAt: new Date().toISOString(),
            };

        case "mark-expired":
            return {
                ...current,
                status: "expired",
                updatedAt: new Date().toISOString(),
            };

        case "new-media": {
            const existingIndex = current.items.findIndex((item) => item.id === action.media.id);

            if (existingIndex !== -1) {
                const existing = current.items[existingIndex];
                const urlChanged = existing?.url !== action.media.url;

                const nextItems = current.items.map((item, index) => (
                    index === existingIndex
                        ? {
                            ...item,
                            ...action.media,
                            assetStatus: urlChanged ? "loading" : item.assetStatus,
                            playedAt: item.playedAt,
                            cachedAt: urlChanged ? null : item.cachedAt,
                            orientation: urlChanged ? null : item.orientation,
                            width: urlChanged ? null : item.width,
                            height: urlChanged ? null : item.height,
                            lastError: null,
                        }
                        : item
                ));

                return {
                    ...current,
                    items: nextItems,
                    updatedAt: new Date().toISOString(),
                };
            }

            const runtimeItem = mergeRuntimeItem(undefined, action.media);

            return {
                ...current,
                items: [runtimeItem, ...current.items],
                currentIndex: current.currentIndex >= 0 ? current.currentIndex + 1 : current.currentIndex,
                updatedAt: new Date().toISOString(),
            };
        }

        case "media-meta": {
            const exists = current.items.some((item) => item.id === action.payload.id);

            if (!exists) {
                return current;
            }

            const nextItems = current.items.map((item) => (
                item.id === action.payload.id
                    ? {
                        ...item,
                        sender_name: action.payload.sender_name ?? item.sender_name,
                        texto_curto: action.payload.texto_curto ?? item.texto_curto,
                        highlight_score: action.payload.highlight_score ?? item.highlight_score,
                        created_at: action.payload.created_at ?? item.created_at,
                    }
                    : item
            ));

            return {
                ...current,
                items: nextItems,
                updatedAt: new Date().toISOString(),
            };
        }

        case "media-loading": {
            if (action.preserveExistingRender) {
                return current;
            }

            const nextItems = current.items.map((item) => (
                matchesCandidate(item, action.candidate, action.matchByIdOnly)
                    ? { ...item, assetStatus: "loading", lastError: null }
                    : item
            ));

            return {
                ...current,
                items: nextItems,
                updatedAt: new Date().toISOString(),
            };
        }

        case "media-ready": {
            const nextItems = current.items.map((item) => (
                matchesCandidate(item, action.candidate, action.matchByIdOnly)
                    ? {
                        ...item,
                        ...action.candidate,
                        assetStatus: "ready",
                        width: action.metadata.width ?? item.width ?? null,
                        height: action.metadata.height ?? item.height ?? null,
                        orientation: action.metadata.orientation ?? item.orientation ?? null,
                        cachedAt: action.metadata.cachedAt,
                        lastError: null,
                    }
                    : item
            ));

            return markPlayableState(current, nextItems);
        }

        case "media-error": {
            const nextItems = current.items.map((item) => (
                matchesCandidate(item, action.candidate, action.matchByIdOnly)
                    ? {
                        ...item,
                        assetStatus: item.cachedAt ? "stale" : "error",
                        lastError: action.errorMessage,
                    }
                    : item
            ));

            return {
                ...current,
                items: nextItems,
                updatedAt: new Date().toISOString(),
            };
        }

        case "media-deleted": {
            const removedIndex = current.items.findIndex((item) => item.id === action.id);

            if (removedIndex === -1) {
                return current;
            }

            const nextItems = current.items.filter((item) => item.id !== action.id);
            let nextCurrentIndex = current.currentIndex;

            if (removedIndex < current.currentIndex) {
                nextCurrentIndex -= 1;
            } else if (removedIndex === current.currentIndex) {
                nextCurrentIndex = resolvePlayableIndex(nextItems, current.currentIndex);
            }

            const nextStatus = nextItems.some(isRenderable)
                ? (current.status === "expired" ? "expired" : "playing")
                : "idle";

            return {
                ...current,
                items: nextCurrentIndex >= 0 ? markItemAsPlayed(nextItems, nextCurrentIndex) : nextItems,
                currentIndex: nextCurrentIndex,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
            };
        }

        case "advance": {
            const nextIndex = nextReadyIndex(current.items, current.currentIndex);

            if (nextIndex === -1) {
                return current;
            }

            return {
                ...current,
                currentIndex: nextIndex,
                items: markItemAsPlayed(current.items, nextIndex),
                updatedAt: new Date().toISOString(),
            };
        }

        default:
            return current;
    }
}

export default slideshowEngineReducer;
