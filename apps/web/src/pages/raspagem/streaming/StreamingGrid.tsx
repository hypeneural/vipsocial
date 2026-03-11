import { Rss } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { NewsItem } from "@/services/newsRadar.service";
import { StreamingCard } from "./StreamingCard";

interface StreamingGridProps {
    items: NewsItem[];
    isLoading: boolean;
    isError: boolean;
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

export function StreamingGrid({ items, isLoading, isError }: StreamingGridProps) {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item, index) => (
                <StreamingCard
                    key={item.id}
                    item={item}
                    isNew={index < 3}
                />
            ))}
        </div>
    );
}
