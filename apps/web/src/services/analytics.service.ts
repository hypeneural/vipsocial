import api from "./api";

export type AnalyticsDatePreset =
    | "today"
    | "yesterday"
    | "last_7_days"
    | "last_30_days"
    | "month_to_date"
    | "custom";

export type AnalyticsCompare = "none" | "previous_period" | "previous_year";

export interface AnalyticsQueryBase {
    date_preset?: AnalyticsDatePreset;
    start_date?: string;
    end_date?: string;
    compare?: AnalyticsCompare;
}

export interface AnalyticsMeta {
    property_id: string;
    date_range: {
        preset: string;
        start: string;
        end: string;
    } | null;
    compare: string;
    timezone: string;
    source: "ga4" | "cache";
    stale: boolean;
    generated_at: string;
    cache_ttl_sec: number;
}

export interface AnalyticsApiResponse<T> {
    success: boolean;
    data: T;
    meta?: AnalyticsMeta;
    message?: string;
}

export interface AnalyticsKpisData {
    period: {
        start_date: string;
        end_date: string;
    };
    totals: {
        users: number;
        active_users: number;
        new_users: number;
        sessions: number;
        pageviews: number;
        avg_engagement_time_sec: number;
        engagement_rate: number;
    };
    comparison: {
        users_pct: number;
        active_users_pct: number;
        sessions_pct: number;
        pageviews_pct: number;
    };
}

export interface AnalyticsTopPageItem {
    rank: number;
    path: string;
    full_url: string | null;
    slug: string | null;
    title: string;
    views: number;
    percentage_of_total: number;
}

export interface AnalyticsTopPagesData {
    items: AnalyticsTopPageItem[];
    total_views: number;
}

export interface AnalyticsRealtimeData {
    active_users_30m: number;
}

export interface AnalyticsTimeseriesData {
    metric: string;
    ga4_metric: string;
    granularity: "day" | "week" | "month";
    points: Array<{
        period: string;
        label: string;
        value: number;
    }>;
}

export interface AnalyticsOverviewData {
    kpis?: AnalyticsKpisData;
    top_pages?: AnalyticsTopPagesData;
    realtime?: AnalyticsRealtimeData;
}

export interface AnalyticsOverviewParams extends AnalyticsQueryBase {
    include?: string;
    limit?: number;
    path_prefix?: string;
    exclude_prefix?: string;
}

export interface AnalyticsTopPagesParams extends AnalyticsQueryBase {
    limit?: number;
    path_prefix?: string;
    exclude_prefix?: string;
}

export interface AnalyticsTimeseriesParams extends AnalyticsQueryBase {
    metric: string;
    granularity: "day" | "week" | "month";
}

export const analyticsService = {
    getOverview: async (
        params?: AnalyticsOverviewParams
    ): Promise<AnalyticsApiResponse<AnalyticsOverviewData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsOverviewData>>("/analytics/overview", { params });
        return data;
    },

    getKpis: async (
        params?: AnalyticsQueryBase
    ): Promise<AnalyticsApiResponse<AnalyticsKpisData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsKpisData>>("/analytics/kpis", { params });
        return data;
    },

    getTopPages: async (
        params?: AnalyticsTopPagesParams
    ): Promise<AnalyticsApiResponse<AnalyticsTopPagesData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsTopPagesData>>("/analytics/top-pages", { params });
        return data;
    },

    getRealtime: async (): Promise<AnalyticsApiResponse<AnalyticsRealtimeData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsRealtimeData>>("/analytics/realtime");
        return data;
    },

    getTimeseries: async (
        params: AnalyticsTimeseriesParams
    ): Promise<AnalyticsApiResponse<AnalyticsTimeseriesData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsTimeseriesData>>("/analytics/timeseries", { params });
        return data;
    },
};

export default analyticsService;

