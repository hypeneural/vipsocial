import api from "./api";

export type SocialMetricsWindow = "7d" | "30d" | "90d";

export interface SocialMetricsMeta {
  window: string;
  generated_at: string;
  source: "db";
}

export interface SocialApiResponse<T> {
  success: boolean;
  data: T;
  meta?: SocialMetricsMeta;
  message?: string;
}

export interface SocialProfileMetricValue {
  code: string;
  label: string;
  group: string | null;
  unit: string | null;
  value_number: number | null;
  value_text: string | null;
  value_json: unknown;
  raw_key: string | null;
}

export interface SocialProfileSeriesPoint {
  date: string;
  label: string;
  value: number | null;
  captured_at: string | null;
}

export interface SocialDashboardCard {
  id: string;
  network: string;
  handle: string;
  display_name: string;
  external_profile_id: string | null;
  url: string | null;
  avatar_url: string | null;
  primary_metric_code: string;
  primary_metric_label: string;
  current_value: number | null;
  growth_day: number | null;
  growth_7d: number | null;
  growth_30d: number | null;
  growth_day_pct: number | null;
  growth_7d_pct: number | null;
  growth_30d_pct: number | null;
  status: "ok" | "error" | "pending";
  last_sync_error: string | null;
  last_snapshot_date: string | null;
  last_synced_at: string | null;
  metrics: SocialProfileMetricValue[];
}

export interface SocialDashboardSeries {
  profile_id: string;
  network: string;
  handle: string;
  display_name: string;
  points: SocialProfileSeriesPoint[];
}

export interface SocialDashboardData {
  window: SocialMetricsWindow;
  summary: {
    profiles_count: number;
    synced_today_count: number;
    failed_today_count: number;
    cost_today_usd: number;
  };
  cards: SocialDashboardCard[];
  series: Record<string, SocialDashboardSeries>;
}

export interface SocialDashboardParams {
  window?: SocialMetricsWindow;
}

const socialService = {
  getDashboard: async (
    params?: SocialDashboardParams
  ): Promise<SocialApiResponse<SocialDashboardData>> => {
    const { data } = await api.get<SocialApiResponse<SocialDashboardData>>(
      "/social/dashboard",
      { params }
    );

    return data;
  },
};

export default socialService;
