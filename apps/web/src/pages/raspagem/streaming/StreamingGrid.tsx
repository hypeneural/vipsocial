import { useEffect, useRef } from "react";
import { Loader2, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import type { NewsItem } from "@/services/newsRadar.service";
import { StreamingCard } from "./StreamingCard";

interface StreamingGridProps {
    items: NewsItem[];
    isLoading: boolean;
    isError: boolean;
    hasOlderItems: boolean;
    isFetchingOlder: boolean;
    onLoadOlder: () => void;
}

function StreamingGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
                <div
                    key={`streaming-skeleton-${i}`}
                    className="animate-pulse overflow-hidden rounded-2xl border border-border/50 bg-card"
                >
                    <div className="aspect-video bg-muted" />
                    <div className="space-y-2 p-3">
                        <div className="h-3 w-16 rounded bg-muted" />
                        <div className="h-4 w-full rounded bg-muted" />
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="flex gap-2">
                            <div className="h-3 w-16 rounded bg-muted" />
                            <div className="h-3 w-12 rounded bg-muted" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StreamingLoadMoreSentinel({
    hasOlderItems,
    isFetchingOlder,
    onLoadOlder,
}: {
    hasOlderItems: boolean;
    isFetchingOlder: boolean;
    onLoadOlder: () => void;
}) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasOlderItems) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasOlderItems && !isFetchingOlder) {
                    onLoadOlder();
                }
            },
            { rootMargin: "300px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasOlderItems, isFetchingOlder, onLoadOlder]);

    if (!hasOlderItems) return null;

    return (
        <div className="mt-6 flex flex-col items-center gap-3">
            <div ref={sentinelRef} className="h-1 w-full" />

            {isFetchingOlder ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando mais notícias...
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={onLoadOlder}
                >
                    Carregar mais
                </Button>
            )}
        </div>
    );
}

export function StreamingGrid({
    items,
    isLoading,
    isError,
    hasOlderItems,
    isFetchingOlder,
    onLoadOlder,
}: StreamingGridProps) {
    if (isLoading) {
        return <StreamingGridSkeleton />;
    }

    if (isError && items.length === 0) {
        return (
            <EmptyState
                icon={Rss}
                title="Sem conexão com o radar"
                description="Tentando reconectar automaticamente..."
            />
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={Rss}
                title="Nenhuma notícia encontrada"
                description="Aguardando novas matérias do NewsRadar..."
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {items.map((item, index) => (
                    <StreamingCard
                        key={item.id}
                        item={item}
                        isNew={index < 3}
                    />
                ))}
            </div>

            <StreamingLoadMoreSentinel
                hasOlderItems={hasOlderItems}
                isFetchingOlder={isFetchingOlder}
                onLoadOlder={onLoadOlder}
            />
        </>
    );
}
