import type { PersistedSlideshowState } from "../types";

const DB_NAME = "vip-slideshow-player";
const DB_VERSION = 1;
const STATE_STORE = "slideshow_states";

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB indisponivel"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STATE_STORE)) {
                db.createObjectStore(STATE_STORE, { keyPath: "code" });
            }
        };
    });
}

function withStore<T>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void
): Promise<T> {
    return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STATE_STORE, mode);
        const store = transaction.objectStore(STATE_STORE);

        transaction.onerror = () => reject(transaction.error);
        handler(store, resolve, reject);
    }));
}

export async function getPersistedSlideshowState(code: string): Promise<PersistedSlideshowState | null> {
    return withStore<PersistedSlideshowState | null>("readonly", (store, resolve, reject) => {
        const request = store.get(code);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve((request.result as PersistedSlideshowState | undefined) ?? null);
    });
}

export async function savePersistedSlideshowState(state: PersistedSlideshowState): Promise<void> {
    return withStore<void>("readwrite", (store, resolve, reject) => {
        const request = store.put(state);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function clearPersistedSlideshowState(code: string): Promise<void> {
    return withStore<void>("readwrite", (store, resolve, reject) => {
        const request = store.delete(code);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function requestPersistentStorage(): Promise<boolean> {
    if (!("storage" in navigator) || !navigator.storage.persist) {
        return false;
    }

    try {
        return await navigator.storage.persist();
    } catch {
        return false;
    }
}

export async function estimateStorageUsage(): Promise<{ quota?: number; usage?: number }> {
    if (!("storage" in navigator) || !navigator.storage.estimate) {
        return {};
    }

    try {
        const estimate = await navigator.storage.estimate();
        return {
            quota: estimate.quota,
            usage: estimate.usage,
        };
    } catch {
        return {};
    }
}
