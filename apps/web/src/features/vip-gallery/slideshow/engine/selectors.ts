import type {
    PersistedSlideshowState,
    PlayerVisualStatus,
    SlideRuntimeItem,
    SlideshowBootData,
    SlideshowControlStatus,
    SlideshowPlayerState,
} from "../types";

type IndexedRuntimeItem = {
    item: SlideRuntimeItem;
    index: number;
    senderKey: string;
};

type SenderBucket = {
    senderKey: string;
    entries: IndexedRuntimeItem[];
    hasShown: boolean;
    lastShownAt: number | null;
    newestCreatedAt: number;
    oldestPlayedAt: number | null;
};

function parseTimestamp(value?: string | null): number {
    if (!value) {
        return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function resolveSenderKey(item: Pick<SlideRuntimeItem, "id" | "sender_key" | "sender_name">): string {
    const senderKey = item.sender_key?.trim();

    if (senderKey) {
        return senderKey;
    }

    const senderName = item.sender_name?.trim().toLocaleLowerCase("pt-BR");

    if (senderName) {
        return `sender:${senderName}`;
    }

    return `photo:${item.id}`;
}

export function resolveVisualStatus(
    controlStatus: SlideshowControlStatus | undefined,
    items: SlideRuntimeItem[],
    fallbackStatus: PlayerVisualStatus = "playing"
): PlayerVisualStatus {
    switch (controlStatus) {
        case "expired":
            return "expired";
        case "archived":
            return "archived";
        case "paused":
            return "paused";
        case "disabled":
            return "disabled";
        case "draft":
            return "idle";
        case "active":
            return items.some(isRenderable) ? fallbackStatus : "idle";
        default:
            return items.some(isRenderable) ? fallbackStatus : "idle";
    }
}

function buildRenderableEntries(items: SlideRuntimeItem[], currentIndex: number): {
    readyEntries: IndexedRuntimeItem[];
    readyEntriesWithoutCurrent: IndexedRuntimeItem[];
    currentSenderKey: string | null;
} {
    const readyEntries = items
        .map((item, index) => ({
            item,
            index,
            senderKey: resolveSenderKey(item),
        }))
        .filter(({ item }) => isRenderable(item));

    const readyEntriesWithoutCurrent = readyEntries.filter(({ index }) => index !== currentIndex);
    const currentSenderKey = currentIndex >= 0 && currentIndex < items.length
        ? resolveSenderKey(items[currentIndex])
        : null;

    return {
        readyEntries,
        readyEntriesWithoutCurrent,
        currentSenderKey,
    };
}

function buildSenderBuckets(entries: IndexedRuntimeItem[], allItems: SlideRuntimeItem[]): SenderBucket[] {
    const lastShownBySender = new Map<string, number | null>();
    const hasShownBySender = new Map<string, boolean>();

    for (const item of allItems) {
        const senderKey = resolveSenderKey(item);
        const playedAt = parseTimestamp(item.playedAt);

        if (playedAt > 0) {
            hasShownBySender.set(senderKey, true);
            const current = lastShownBySender.get(senderKey) ?? null;
            lastShownBySender.set(senderKey, current === null ? playedAt : Math.max(current, playedAt));
        } else if (!hasShownBySender.has(senderKey)) {
            hasShownBySender.set(senderKey, false);
        }
    }

    const bucketsBySender = new Map<string, IndexedRuntimeItem[]>();

    for (const entry of entries) {
        const bucket = bucketsBySender.get(entry.senderKey) ?? [];
        bucket.push(entry);
        bucketsBySender.set(entry.senderKey, bucket);
    }

    return Array.from(bucketsBySender.entries()).map(([senderKey, senderEntries]) => ({
        senderKey,
        entries: senderEntries.sort((left, right) => left.index - right.index),
        hasShown: hasShownBySender.get(senderKey) ?? false,
        lastShownAt: lastShownBySender.get(senderKey) ?? null,
        newestCreatedAt: Math.max(...senderEntries.map(({ item }) => parseTimestamp(item.created_at))),
        oldestPlayedAt: senderEntries
            .map(({ item }) => parseTimestamp(item.playedAt))
            .filter((value) => value > 0)
            .sort((left, right) => left - right)[0] ?? null,
    }));
}

function pickBucket(
    buckets: SenderBucket[],
    currentSenderKey: string | null,
    comparator: (left: SenderBucket, right: SenderBucket) => number
): SenderBucket | null {
    if (buckets.length === 0) {
        return null;
    }

    const sortedBuckets = [...buckets].sort(comparator);
    const alternativeBuckets = currentSenderKey
        ? sortedBuckets.filter((bucket) => bucket.senderKey !== currentSenderKey)
        : sortedBuckets;

    return alternativeBuckets[0] ?? sortedBuckets[0] ?? null;
}

function pickFairUnseenIndex(
    entries: IndexedRuntimeItem[],
    allItems: SlideRuntimeItem[],
    currentSenderKey: string | null
): number {
    const buckets = buildSenderBuckets(entries, allItems);
    const firstUnseenBuckets = buckets.filter((bucket) => !bucket.hasShown);

    if (firstUnseenBuckets.length > 0) {
        const chosenBucket = pickBucket(firstUnseenBuckets, currentSenderKey, (left, right) => (
            right.newestCreatedAt - left.newestCreatedAt || left.entries[0]!.index - right.entries[0]!.index
        ));

        return chosenBucket?.entries[0]?.index ?? -1;
    }

    const chosenBucket = pickBucket(buckets, currentSenderKey, (left, right) => {
        const leftShownAt = left.lastShownAt ?? Number.MIN_SAFE_INTEGER;
        const rightShownAt = right.lastShownAt ?? Number.MIN_SAFE_INTEGER;

        if (leftShownAt !== rightShownAt) {
            return leftShownAt - rightShownAt;
        }

        return right.newestCreatedAt - left.newestCreatedAt || left.entries[0]!.index - right.entries[0]!.index;
    });

    return chosenBucket?.entries[0]?.index ?? -1;
}

function pickFairReplayIndex(
    entries: IndexedRuntimeItem[],
    allItems: SlideRuntimeItem[],
    currentSenderKey: string | null
): number {
    const buckets = buildSenderBuckets(entries, allItems);
    const chosenBucket = pickBucket(buckets, currentSenderKey, (left, right) => {
        const leftShownAt = left.lastShownAt ?? Number.MIN_SAFE_INTEGER;
        const rightShownAt = right.lastShownAt ?? Number.MIN_SAFE_INTEGER;

        if (leftShownAt !== rightShownAt) {
            return leftShownAt - rightShownAt;
        }

        const leftOldestPlayed = left.oldestPlayedAt ?? Number.MIN_SAFE_INTEGER;
        const rightOldestPlayed = right.oldestPlayedAt ?? Number.MIN_SAFE_INTEGER;

        if (leftOldestPlayed !== rightOldestPlayed) {
            return leftOldestPlayed - rightOldestPlayed;
        }

        return left.entries[0]!.index - right.entries[0]!.index;
    });

    return chosenBucket?.entries[0]?.index ?? -1;
}

export function createEmptyPlayerState(code: string): SlideshowPlayerState {
    return {
        code,
        status: "booting",
        event: null,
        settings: null,
        items: [],
        currentIndex: -1,
        lastStatusChangeAt: null,
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
        itemIndex === index
            ? { ...item, playedAt: new Date().toISOString() }
            : item
    ));
}

export function nextReadyIndex(items: SlideRuntimeItem[], currentIndex: number): number {
    if (items.length === 0) {
        return -1;
    }

    const {
        readyEntries,
        readyEntriesWithoutCurrent,
        currentSenderKey,
    } = buildRenderableEntries(items, currentIndex);

    if (readyEntries.length === 0) {
        return -1;
    }

    const unseenEntries = readyEntriesWithoutCurrent.filter(({ item }) => !item.playedAt);

    if (unseenEntries.length > 0) {
        return pickFairUnseenIndex(unseenEntries, items, currentSenderKey);
    }

    const replaySource = readyEntriesWithoutCurrent.length > 0
        ? readyEntriesWithoutCurrent
        : readyEntries;

    const replayIndex = pickFairReplayIndex(replaySource, items, currentSenderKey);

    if (replayIndex !== -1) {
        return replayIndex;
    }

    return readyEntries[0]?.index ?? -1;
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
    const nextStatus = resolveVisualStatus(snapshot.event.status, nextItems, fallbackStatus);
    const shouldMarkAsPlayed = nextStatus === "playing" && currentIndex >= 0;

    return {
        ...previous,
        event: snapshot.event,
        settings: snapshot.settings,
        items: shouldMarkAsPlayed ? markItemAsPlayed(nextItems, currentIndex) : nextItems,
        currentIndex,
        status: nextStatus,
        lastStatusChangeAt: new Date().toISOString(),
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
        lastStatusChangeAt: state.lastStatusChangeAt,
        updatedAt: state.updatedAt,
    };
}

export function selectCurrentItem(state: SlideshowPlayerState): SlideRuntimeItem | null {
    if (state.currentIndex < 0 || state.currentIndex >= state.items.length) {
        return null;
    }

    return state.items[state.currentIndex];
}
