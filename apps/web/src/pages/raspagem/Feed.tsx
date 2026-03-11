import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
    useNewsDashboard,
    useNewsItem,
    useNewsSources,
    useRelatedNewsItems,
} from "@/hooks/useNewsRadar";
import type { FeedView } from "./feed/feed-utils";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedStats } from "./feed/FeedStats";
import { FeedFilters } from "./feed/FeedFilters";
import { FeedInfiniteList } from "./feed/FeedInfiniteList";
import { FeedDetailDialog } from "./feed/FeedDetailDialog";
import { useFeedFiltersState } from "./feed/useFeedFiltersState";
import { useInfiniteNewsItems } from "./feed/useInfiniteNewsItems";

const RaspagemFeed = () => {
    const filters = useFeedFiltersState();
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    const dashboardQuery = useNewsDashboard();
    const sourcesQuery = useNewsSources({
        per_page: 100,
        sort: "name",
        dir: "asc",
    });

    const { page: _page, ...infiniteParams } = filters.itemFilters;
    const itemsQuery = useInfiniteNewsItems(infiniteParams);

    const itemDetailQuery = useNewsItem(selectedItemId ?? undefined);
    const relatedItemsQuery = useRelatedNewsItems(selectedItemId ?? undefined);

    const isRefreshing =
        dashboardQuery.isFetching || itemsQuery.isFetching || sourcesQuery.isFetching;

    const refreshAll = () => {
        dashboardQuery.refetch();
        itemsQuery.refetch();
        sourcesQuery.refetch();

        if (selectedItemId) {
            itemDetailQuery.refetch();
            relatedItemsQuery.refetch();
        }
    };

    const pages = itemsQuery.data?.pages.map((p) => p.data) ?? [];

    return (
        <AppShell>
            <FeedHeader isRefreshing={isRefreshing} onRefresh={refreshAll} />

            <FeedStats
                dashboard={dashboardQuery.data}
                isLoading={dashboardQuery.isLoading}
            />

            <FeedFilters
                search={filters.search}
                onSearchChange={filters.setSearch}
                city={filters.city}
                onCityChange={filters.setCity}
                sourceFilter={filters.sourceFilter}
                onSourceFilterChange={filters.setSourceFilter}
                extractionFilter={filters.extractionFilter}
                onExtractionFilterChange={filters.setExtractionFilter}
                enrichmentFilter={filters.enrichmentFilter}
                onEnrichmentFilterChange={filters.setEnrichmentFilter}
                urgencyFilter={filters.urgencyFilter}
                onUrgencyFilterChange={filters.setUrgencyFilter}
                viewFilter={filters.viewFilter}
                onViewFilterChange={filters.setViewFilter as (v: FeedView) => void}
                sortBy={filters.sortBy}
                onSortByChange={filters.setSortBy}
                sortDirection={filters.sortDirection}
                onSortDirectionChange={filters.setSortDirection}
                sources={(sourcesQuery.data?.data ?? []).map((s) => ({
                    id: s.id,
                    name: s.name,
                }))}
                onResetPage={filters.resetToFirstPage}
                onSetPage={filters.setPage}
            />

            <FeedInfiniteList
                pages={pages}
                isLoading={itemsQuery.isLoading}
                hasNextPage={itemsQuery.hasNextPage}
                isFetchingNextPage={itemsQuery.isFetchingNextPage}
                fetchNextPage={itemsQuery.fetchNextPage}
                viewFilter={filters.viewFilter}
                onSelectItem={setSelectedItemId}
            />

            <FeedDetailDialog
                selectedItemId={selectedItemId}
                onClose={() => setSelectedItemId(null)}
                itemDetailQuery={itemDetailQuery}
                relatedItemsQuery={relatedItemsQuery}
                onSelectRelated={setSelectedItemId}
            />
        </AppShell>
    );
};

export default RaspagemFeed;
