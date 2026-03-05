import { useQuery } from "@tanstack/react-query";
import analyticsService, {
    AnalyticsAcquisitionParams,
    AnalyticsCitiesParams,
    AnalyticsOverviewParams,
    AnalyticsQueryBase,
    AnalyticsTimeseriesParams,
    AnalyticsTopPagesParams,
} from "@/services/analytics.service";

export const analyticsKeys = {
    all: ["analytics"] as const,
    overview: (params?: AnalyticsOverviewParams) => [...analyticsKeys.all, "overview", params] as const,
    kpis: (params?: AnalyticsQueryBase) => [...analyticsKeys.all, "kpis", params] as const,
    topPages: (params?: AnalyticsTopPagesParams) => [...analyticsKeys.all, "top-pages", params] as const,
    cities: (params?: AnalyticsCitiesParams) => [...analyticsKeys.all, "cities", params] as const,
    acquisition: (params?: AnalyticsAcquisitionParams) => [...analyticsKeys.all, "acquisition", params] as const,
    realtime: () => [...analyticsKeys.all, "realtime"] as const,
    timeseries: (params: AnalyticsTimeseriesParams) => [...analyticsKeys.all, "timeseries", params] as const,
};

interface BaseQueryOptions {
    staleTime?: number;
    refetchInterval?: number;
}

export function useAnalyticsOverview(
    params?: AnalyticsOverviewParams,
    enabled = true,
    options?: BaseQueryOptions
) {
    return useQuery({
        queryKey: analyticsKeys.overview(params),
        queryFn: () => analyticsService.getOverview(params),
        enabled,
        staleTime: options?.staleTime ?? 30000,
        refetchInterval: options?.refetchInterval,
    });
}

export function useAnalyticsKpis(params?: AnalyticsQueryBase, enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.kpis(params),
        queryFn: () => analyticsService.getKpis(params),
        enabled,
        staleTime: options?.staleTime ?? 60000,
        refetchInterval: options?.refetchInterval,
    });
}

export function useAnalyticsTopPages(params?: AnalyticsTopPagesParams, enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.topPages(params),
        queryFn: () => analyticsService.getTopPages(params),
        enabled,
        staleTime: options?.staleTime ?? 300000,
        refetchInterval: options?.refetchInterval,
    });
}

export function useAnalyticsCities(params?: AnalyticsCitiesParams, enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.cities(params),
        queryFn: () => analyticsService.getCities(params),
        enabled,
        staleTime: options?.staleTime ?? 300000,
        refetchInterval: options?.refetchInterval,
    });
}

export function useAnalyticsAcquisition(params?: AnalyticsAcquisitionParams, enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.acquisition(params),
        queryFn: () => analyticsService.getAcquisition(params),
        enabled,
        staleTime: options?.staleTime ?? 300000,
        refetchInterval: options?.refetchInterval,
    });
}

export function useAnalyticsRealtime(enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.realtime(),
        queryFn: () => analyticsService.getRealtime(),
        enabled,
        staleTime: options?.staleTime ?? 20000,
        refetchInterval: options?.refetchInterval ?? 30000,
    });
}

export function useAnalyticsTimeseries(params: AnalyticsTimeseriesParams, enabled = true, options?: BaseQueryOptions) {
    return useQuery({
        queryKey: analyticsKeys.timeseries(params),
        queryFn: () => analyticsService.getTimeseries(params),
        enabled,
        staleTime: options?.staleTime ?? 60000,
        refetchInterval: options?.refetchInterval,
    });
}
