import { useMemo } from "react";
import { Rss } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { NewsItem } from "@/services/newsRadar.service";
import { FeedCard } from "./FeedCard";
import { FeedCardSkeleton, FeedCardSkeletonGrid } from "./FeedCardSkeleton";
import { FeedLoadMoreTrigger } from "./FeedLoadMoreTrigger";
import { HIGH_RELEVANCE_SCORE, isRecentItem } from "./feed-utils";
import type { FeedView } from "./feed-utils";

interface FeedInfiniteListProps {
    pages: NewsItem[][];
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    viewFilter: FeedView;
    onSelectItem: (id: number) => void;
}

export function FeedInfiniteList({
    pages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    viewFilter,
    onSelectItem,
}: FeedInfiniteListProps) {
    const allItems = useMemo(() => pages.flat(), [pages]);

    const visibleItems = useMemo(() => {
        return allItems.filter((item) => {
            const highRelevance = (item.ai_metadata?.relevance_score ?? 0) >= HIGH_RELEVANCE_SCORE;

            if (viewFilter === "duplicates" && !item.is_duplicate_candidate) return false;
            if (viewFilter === "high" && !highRelevance) return false;
            if (viewFilter === "recent" && !isRecentItem(item)) return false;

            return true;
        });
    }, [allItems, viewFilter]);

    if (isLoading) {
        return <FeedCardSkeletonGrid count={8} />;
    }

    if (visibleItems.length === 0) {
        return (
            <EmptyState
                icon={Rss}
                title="Nenhum item encontrado"
                description="Ajuste os filtros ou sincronize novas fontes para popular o feed."
            />
        );
    }

    return (
        <div className="space-y-3 pb-20 md:pb-0">
            {visibleItems.map((item, index) => (
                <FeedCard
                    key={item.id}
                    item={item}
                    index={index}
                    onSelect={onSelectItem}
                />
            ))}

            {isFetchingNextPage && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <FeedCardSkeleton key={`next-skeleton-${i}`} />
                    ))}
                </div>
            )}

            <FeedLoadMoreTrigger
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
            />
        </div>
    );
}
