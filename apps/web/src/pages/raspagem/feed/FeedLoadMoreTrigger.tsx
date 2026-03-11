import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedLoadMoreTriggerProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
}

export function FeedLoadMoreTrigger({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: FeedLoadMoreTriggerProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (!hasNextPage) return null;

    return (
        <div className="mt-4 flex flex-col items-center gap-3">
            <div ref={sentinelRef} className="h-1 w-full" />

            {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando mais...
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={fetchNextPage}
                >
                    Carregar mais
                </Button>
            )}
        </div>
    );
}
