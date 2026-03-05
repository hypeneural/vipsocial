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

export function useAnalyticsOverview(params?: AnalyticsOverviewParams, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.overview(params),
        queryFn: () => analyticsService.getOverview(params),
        enabled,
    });
}

export function useAnalyticsKpis(params?: AnalyticsQueryBase, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.kpis(params),
        queryFn: () => analyticsService.getKpis(params),
        enabled,
    });
}

export function useAnalyticsTopPages(params?: AnalyticsTopPagesParams, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.topPages(params),
        queryFn: () => analyticsService.getTopPages(params),
        enabled,
    });
}

export function useAnalyticsCities(params?: AnalyticsCitiesParams, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.cities(params),
        queryFn: () => analyticsService.getCities(params),
        enabled,
    });
}

export function useAnalyticsAcquisition(params?: AnalyticsAcquisitionParams, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.acquisition(params),
        queryFn: () => analyticsService.getAcquisition(params),
        enabled,
    });
}

export function useAnalyticsRealtime(enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.realtime(),
        queryFn: () => analyticsService.getRealtime(),
        enabled,
        refetchInterval: 30000,
    });
}

export function useAnalyticsTimeseries(params: AnalyticsTimeseriesParams, enabled = true) {
    return useQuery({
        queryKey: analyticsKeys.timeseries(params),
        queryFn: () => analyticsService.getTimeseries(params),
        enabled,
    });
}
