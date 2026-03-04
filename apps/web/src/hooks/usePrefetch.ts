import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ==========================================
// PREFETCH UTILITIES
// ==========================================

/**
 * Generic prefetch function creator
 * Use this to create prefetch functions for specific queries
 */
export function usePrefetch() {
    const queryClient = useQueryClient();

    const prefetchQuery = useCallback(
        async <T>(
            queryKey: readonly unknown[],
            queryFn: () => Promise<T>,
            staleTime = 1000 * 60 * 5 // 5 minutes default
        ) => {
            await queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime,
            });
        },
        [queryClient]
    );

    return { prefetchQuery, queryClient };
}

/**
 * Create a prefetch handler for hover events
 * Returns props to spread on the element
 */
export function usePrefetchOnHover<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: {
        delay?: number;
        staleTime?: number;
    }
) {
    const { queryClient } = usePrefetch();
    let timeoutId: NodeJS.Timeout | null = null;

    const onMouseEnter = useCallback(() => {
        const delay = options?.delay ?? 100;

        timeoutId = setTimeout(() => {
            queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime: options?.staleTime ?? 1000 * 60 * 5,
            });
        }, delay);
    }, [queryClient, queryKey, queryFn, options?.delay, options?.staleTime]);

    const onMouseLeave = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    }, []);

    const onFocus = onMouseEnter;
    const onBlur = onMouseLeave;

    return {
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
    };
}

/**
 * Prefetch a route's data before navigation
 */
export function usePrefetchRoute() {
    const { queryClient } = usePrefetch();

    const prefetchRouteData = useCallback(
        async (prefetchers: Array<{
            queryKey: readonly unknown[];
            queryFn: () => Promise<unknown>;
        }>) => {
            await Promise.all(
                prefetchers.map(({ queryKey, queryFn }) =>
                    queryClient.prefetchQuery({ queryKey, queryFn })
                )
            );
        },
        [queryClient]
    );

    return { prefetchRouteData };
}

export default usePrefetch;
