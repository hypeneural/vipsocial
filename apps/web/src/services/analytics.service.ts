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
    debug_quota?: boolean;
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
    quota?: Record<string, { consumed?: number; remaining?: number }>;
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
    host_name?: string | null;
    full_url: string | null;
    slug: string | null;
    title: string;
    views: number;
    unique_users: number;
    percentage_of_total: number;
}

export interface AnalyticsTopPagesData {
    items: AnalyticsTopPageItem[];
    total_views: number;
    total_unique_users: number;
}

export interface AnalyticsCityItem {
    rank: number;
    city: string;
    pageviews: number;
    users: number;
    share_pageviews_pct: number;
}

export interface AnalyticsCitiesData {
    items: AnalyticsCityItem[];
    total_pageviews: number;
}

export type AnalyticsAcquisitionMode = "session" | "first_user";

export interface AnalyticsAcquisitionItem {
    rank: number;
    origin?: string;
    source_key?: string;
    channel_raw?: string;
    source_raw?: string;
    source_normalized?: string;
    group?: string;
    group_label?: string;
    confidence?: "high" | "medium" | "low";
    sessions?: number;
    users: number;
    pageviews?: number;
    share_sessions_pct?: number;
    share_pageviews_pct?: number;
    share_users_pct?: number;
}

export interface AnalyticsAcquisitionData {
    mode: AnalyticsAcquisitionMode;
    items: AnalyticsAcquisitionItem[];
    totals: {
        sessions?: number;
        users: number;
        pageviews?: number;
    };
}

export interface AnalyticsRealtimeData {
    active_users_30m: number;
}

export interface AnalyticsTimeseriesData {
    metric: string | null;
    ga4_metric: string | null;
    metrics?: string[];
    ga4_metrics?: string[];
    granularity: "day" | "week" | "month";
    points: Array<{
        period: string;
        label: string;
        value?: number;
        values?: Record<string, number>;
    }>;
}

export interface AnalyticsOverviewData {
    kpis?: AnalyticsKpisData;
    top_pages?: AnalyticsTopPagesData;
    cities?: AnalyticsCitiesData;
    acquisition?: AnalyticsAcquisitionData;
    realtime?: AnalyticsRealtimeData;
}

export interface AnalyticsOverviewParams extends AnalyticsQueryBase {
    include?: string;
    limit?: number;
    path_prefix?: string;
    exclude_prefix?: string;
    host_name?: string;
    mode?: AnalyticsAcquisitionMode;
}

export interface AnalyticsTopPagesParams extends AnalyticsQueryBase {
    limit?: number;
    path_prefix?: string;
    exclude_prefix?: string;
    host_name?: string;
}

export interface AnalyticsCitiesParams extends AnalyticsQueryBase {
    limit?: number;
    host_name?: string;
}

export interface AnalyticsAcquisitionParams extends AnalyticsQueryBase {
    mode?: AnalyticsAcquisitionMode;
    limit?: number;
}

export interface AnalyticsTimeseriesParams extends AnalyticsQueryBase {
    metric?: string;
    metrics?: string[];
    granularity: "day" | "week" | "month";
    keep_empty_rows?: boolean | 0 | 1;
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

    getCities: async (
        params?: AnalyticsCitiesParams
    ): Promise<AnalyticsApiResponse<AnalyticsCitiesData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsCitiesData>>("/analytics/cities", { params });
        return data;
    },

    getAcquisition: async (
        params?: AnalyticsAcquisitionParams
    ): Promise<AnalyticsApiResponse<AnalyticsAcquisitionData>> => {
        const { data } = await api.get<AnalyticsApiResponse<AnalyticsAcquisitionData>>("/analytics/acquisition", { params });
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
