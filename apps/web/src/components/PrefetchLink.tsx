import { Link as RouterLink, LinkProps } from "react-router-dom";
import { forwardRef, ReactNode, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ==========================================
// PREFETCH LINK CONFIG
// ==========================================

interface PrefetchConfig {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
}

interface PrefetchLinkProps extends Omit<LinkProps, "to"> {
    to: string;
    children: ReactNode;
    prefetch?: PrefetchConfig[];
    prefetchDelay?: number;
    className?: string;
}

/**
 * Enhanced Link component that prefetches data on hover
 * 
 * @example
 * <PrefetchLink
 *   to="/roteiros"
 *   prefetch={[
 *     { queryKey: roteiroKeys.list(), queryFn: () => roteiroService.getAll() }
 *   ]}
 * >
 *   Roteiros
 * </PrefetchLink>
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
    ({ to, children, prefetch = [], prefetchDelay = 100, className, ...props }, ref) => {
        const queryClient = useQueryClient();
        const [hasPrefetched, setHasPrefetched] = useState(false);
        let timeoutId: NodeJS.Timeout | null = null;

        const handleMouseEnter = useCallback(() => {
            if (hasPrefetched || prefetch.length === 0) return;

            timeoutId = setTimeout(() => {
                prefetch.forEach(({ queryKey, queryFn }) => {
                    queryClient.prefetchQuery({
                        queryKey,
                        queryFn,
                        staleTime: 1000 * 60 * 5, // 5 minutes
                    });
                });
                setHasPrefetched(true);
            }, prefetchDelay);
        }, [queryClient, prefetch, prefetchDelay, hasPrefetched]);

        const handleMouseLeave = useCallback(() => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }, []);

        return (
            <RouterLink
                ref={ref}
                to={to}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleMouseEnter}
                onBlur={handleMouseLeave}
                className={className}
                {...props}
            >
                {children}
            </RouterLink>
        );
    }
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
