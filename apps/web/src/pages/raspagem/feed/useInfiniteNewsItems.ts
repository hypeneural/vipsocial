import { useInfiniteQuery } from "@tanstack/react-query";
import { newsRadarService, type NewsItemFilters, type NewsRadarPaginatedResponse, type NewsItem } from "@/services/newsRadar.service";

export function useInfiniteNewsItems(params?: Omit<NewsItemFilters, "page">) {
    return useInfiniteQuery<NewsRadarPaginatedResponse<NewsItem>>({
        queryKey: ["news-radar", "items", "infinite", params],
        queryFn: ({ pageParam }) =>
            newsRadarService.getItems({ ...params, page: pageParam as number }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
        refetchInterval: 60000,
        maxPages: 6,
    });
}
