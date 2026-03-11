import { startTransition, useDeferredValue, useMemo, useState } from "react";
import type { FeedView } from "./feed-utils";
import type {
    NewsItemFilters,
    NewsItemSortBy,
    NewsSortDirection,
} from "@/services/newsRadar.service";

export interface FeedFiltersState {
    search: string;
    city: string;
    sourceFilter: string;
    extractionFilter: string;
    enrichmentFilter: string;
    urgencyFilter: string;
    viewFilter: FeedView;
    sortBy: NewsItemSortBy;
    sortDirection: NewsSortDirection;
    page: number;
}

export function useFeedFiltersState() {
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [extractionFilter, setExtractionFilter] = useState("all");
    const [enrichmentFilter, setEnrichmentFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState("all");
    const [viewFilter, setViewFilter] = useState<FeedView>("all");
    const [sortBy, setSortBy] = useState<NewsItemSortBy>("published_at_utc");
    const [sortDirection, setSortDirection] = useState<NewsSortDirection>("desc");
    const [page, setPage] = useState(1);

    const deferredSearch = useDeferredValue(search);
    const deferredCity = useDeferredValue(city);

    const resetToFirstPage = () => {
        startTransition(() => setPage(1));
    };

    const itemFilters: NewsItemFilters = useMemo(
        () => ({
            page,
            per_page: 12,
            search: deferredSearch.trim() || undefined,
            city: deferredCity.trim() || undefined,
            source_id: sourceFilter === "all" ? undefined : Number(sourceFilter),
            extraction_status:
                extractionFilter === "all" ? undefined : extractionFilter,
            enrichment_status:
                enrichmentFilter === "all" ? undefined : enrichmentFilter,
            urgency: urgencyFilter === "all" ? undefined : urgencyFilter,
            sort_by: sortBy,
            sort_dir: sortDirection,
        }),
        [
            page,
            deferredSearch,
            deferredCity,
            sourceFilter,
            extractionFilter,
            enrichmentFilter,
            urgencyFilter,
            sortBy,
            sortDirection,
        ],
    );

    return {
        search,
        setSearch,
        city,
        setCity,
        sourceFilter,
        setSourceFilter,
        extractionFilter,
        setExtractionFilter,
        enrichmentFilter,
        setEnrichmentFilter,
        urgencyFilter,
        setUrgencyFilter,
        viewFilter,
        setViewFilter,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        page,
        setPage,
        resetToFirstPage,
        itemFilters,
    };
}
