import { useCallback, useEffect, useRef, useState } from "react";
import { newsRadarService } from "@/services/newsRadar.service";
import type { NewsItem } from "@/services/newsRadar.service";

const MAX_ITEMS = 200;
const POLL_INTERVAL = 60000;

export interface StreamingState {
    items: NewsItem[];
    isLoading: boolean;
    isError: boolean;
    newCount: number;
    lastUpdatedAt: Date | null;
    consecutiveErrors: number;
}

export function useStreamingFeed() {
    const [state, setState] = useState<StreamingState>({
        items: [],
        isLoading: true,
        isError: false,
        newCount: 0,
        lastUpdatedAt: null,
        consecutiveErrors: 0,
    });

    const seenIdsRef = useRef(new Set<number>());
    const maxIdRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const newCountTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchItems = useCallback(async (isInitial: boolean) => {
        try {
            const params: Record<string, unknown> = {
                per_page: 50,
            };

            if (!isInitial && maxIdRef.current > 0) {
                params.after_id = maxIdRef.current;
            }

            const response = await newsRadarService.getItems(params);
            const fetchedItems = response.data;

            if (fetchedItems.length === 0 && !isInitial) {
                setState((prev) => ({
                    ...prev,
                    isError: false,
                    lastUpdatedAt: new Date(),
                    consecutiveErrors: 0,
                }));
                return;
            }

            const newItems = fetchedItems.filter(
                (item) => !seenIdsRef.current.has(item.id),
            );

            for (const item of newItems) {
                seenIdsRef.current.add(item.id);
                if (item.id > maxIdRef.current) {
                    maxIdRef.current = item.id;
                }
            }

            setState((prev) => {
                const merged = isInitial
                    ? newItems
                    : [...newItems, ...prev.items];

                const trimmed = merged
                    .sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    })
                    .slice(0, MAX_ITEMS);

                return {
                    items: trimmed,
                    isLoading: false,
                    isError: false,
                    newCount: isInitial ? 0 : newItems.length,
                    lastUpdatedAt: new Date(),
                    consecutiveErrors: 0,
                };
            });

            if (!isInitial && newItems.length > 0) {
                if (newCountTimerRef.current) {
                    clearTimeout(newCountTimerRef.current);
                }
                newCountTimerRef.current = setTimeout(() => {
                    setState((prev) => ({ ...prev, newCount: 0 }));
                }, 3000);
            }
        } catch {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                isError: true,
                consecutiveErrors: prev.consecutiveErrors + 1,
            }));
        }
    }, []);

    useEffect(() => {
        fetchItems(true);

        intervalRef.current = setInterval(() => {
            fetchItems(false);
        }, POLL_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (newCountTimerRef.current) clearTimeout(newCountTimerRef.current);
        };
    }, [fetchItems]);

    return state;
}
