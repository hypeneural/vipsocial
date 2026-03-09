import type {
    PersistedSlideshowState,
    PlayerVisualStatus,
    SlideRuntimeItem,
    SlideshowBootData,
    SlideshowPlayerState,
} from "../types";

export function createEmptyPlayerState(code: string): SlideshowPlayerState {
    return {
        code,
        status: "booting",
        event: null,
        settings: null,
        items: [],
        currentIndex: -1,
        updatedAt: new Date(0).toISOString(),
        storage: {
            persisted: false,
            quota: null,
            usage: null,
        },
    };
}

export function isRenderable(item?: SlideRuntimeItem | null): boolean {
    return item?.assetStatus === "ready" || item?.assetStatus === "stale";
}

export function resolvePlayableIndex(items: SlideRuntimeItem[], previousIndex: number): number {
    if (items.length === 0) {
        return -1;
    }

    if (previousIndex >= 0 && previousIndex < items.length && isRenderable(items[previousIndex])) {
        return previousIndex;
    }

    return items.findIndex(isRenderable);
}

export function markItemAsPlayed(items: SlideRuntimeItem[], index: number): SlideRuntimeItem[] {
    if (index < 0 || index >= items.length) {
        return items;
    }

    return items.map((item, itemIndex) => (
        itemIndex === index && !item.playedAt
            ? { ...item, playedAt: new Date().toISOString() }
            : item
    ));
}

export function nextReadyIndex(items: SlideRuntimeItem[], currentIndex: number): number {
    if (items.length === 0) {
        return -1;
    }

    const freshReadyIndex = items.findIndex((item, index) => (
        index !== currentIndex && isRenderable(item) && !item.playedAt
    ));

    if (freshReadyIndex !== -1) {
        return freshReadyIndex;
    }

    const readyIndices = items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => isRenderable(item))
        .map(({ index }) => index);

    if (readyIndices.length === 0) {
        return -1;
    }

    if (currentIndex < 0 || !readyIndices.includes(currentIndex)) {
        return readyIndices[0];
    }

    const currentReadyIndex = readyIndices.indexOf(currentIndex);
    return readyIndices[(currentReadyIndex + 1) % readyIndices.length];
}

export function buildPrefetchQueue(
    items: SlideRuntimeItem[],
    currentIndex: number,
    queueLimit?: number | null
): SlideRuntimeItem[] {
    const queue: SlideRuntimeItem[] = [];
    const seen = new Set<string>();
    const maxItems = Math.max(1, queueLimit ?? items.length);

    const push = (item?: SlideRuntimeItem) => {
        if (!item || seen.has(item.id) || queue.length >= maxItems) {
            return;
        }

        seen.add(item.id);
        queue.push(item);
    };

    push(items[currentIndex]);
    push(items[nextReadyIndex(items, currentIndex)]);

    for (let offset = 1; offset <= Math.min(5, items.length); offset += 1) {
        push(items[(Math.max(currentIndex, 0) + offset) % items.length]);
    }

    for (const item of items) {
        push(item);
    }

    return queue;
}

export function mergeServerSnapshot(
    previous: SlideshowPlayerState,
    snapshot: SlideshowBootData,
    fallbackStatus: PlayerVisualStatus = "playing"
): SlideshowPlayerState {
    const existingById = new Map(previous.items.map((item) => [item.id, item]));
    const nextItems: SlideRuntimeItem[] = snapshot.files.map((item) => {
        const existing = existingById.get(item.id);

        return {
            ...existing,
            ...item,
            assetStatus: existing?.assetStatus ?? "loading",
            orientation: existing?.orientation ?? null,
            width: existing?.width ?? null,
            height: existing?.height ?? null,
            cachedAt: existing?.cachedAt ?? null,
            lastError: existing?.lastError ?? null,
            playedAt: existing?.playedAt ?? null,
        };
    });

    const currentIndex = resolvePlayableIndex(nextItems, previous.currentIndex);

    return {
        ...previous,
        event: snapshot.event,
        settings: snapshot.settings,
        items: currentIndex >= 0 ? markItemAsPlayed(nextItems, currentIndex) : nextItems,
        currentIndex,
        status: nextItems.some(isRenderable) ? fallbackStatus : "idle",
        updatedAt: new Date().toISOString(),
    };
}

export function toPersistedState(state: SlideshowPlayerState): PersistedSlideshowState {
    return {
        code: state.code,
        status: state.status,
        event: state.event,
        settings: state.settings,
        items: state.items,
        currentIndex: state.currentIndex,
        updatedAt: state.updatedAt,
    };
}

export function selectCurrentItem(state: SlideshowPlayerState): SlideRuntimeItem | null {
    if (state.currentIndex < 0 || state.currentIndex >= state.items.length) {
        return null;
    }

    return state.items[state.currentIndex];
}
