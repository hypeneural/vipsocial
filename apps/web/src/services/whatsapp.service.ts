import api from "./api";

export type WhatsAppMetricsWindow = "7d" | "15d" | "30d";

export interface WhatsAppMetricsMeta {
  window: string;
  generated_at: string;
  source: "db";
}

export interface WhatsAppApiResponse<T> {
  success: boolean;
  data: T;
  meta?: WhatsAppMetricsMeta;
  message?: string;
}

export interface WhatsAppGroupsDashboardSeriesPoint {
  date: string;
  label: string;
  source: "snapshot" | "live" | "missing";
  captured: boolean;
  groups_count: number | null;
  total_memberships_current: number | null;
  unique_members_current: number | null;
  multi_group_members_current: number | null;
}

export interface WhatsAppGroupsDashboardGroup {
  group_id: string;
  name: string | null;
  subject: string | null;
  members_current: number;
  last_synced_at: string | null;
  rank: number;
  share_of_total_memberships_pct: number;
  movement: {
    joins: number;
    leaves: number;
    net_growth: number;
  };
}

export interface WhatsAppGroupsDashboardData {
  window: WhatsAppMetricsWindow;
  summary: {
    groups_count: number;
    total_memberships_current: number;
    unique_members_current: number;
    multi_group_members_current: number;
    multi_group_ratio: number;
    movement: {
      joins: number;
      leaves: number;
      net_growth: number;
    };
    unique_growth: {
      baseline: number;
      current: number;
      delta: number;
      delta_pct: number | null;
      captured_points: number;
      has_history: boolean;
      first_snapshot_date: string | null;
      last_snapshot_date: string | null;
    };
  };
  series: WhatsAppGroupsDashboardSeriesPoint[];
  groups: WhatsAppGroupsDashboardGroup[];
}

export interface WhatsAppGroupsDashboardParams {
  window?: WhatsAppMetricsWindow;
}

const whatsappService = {
  getGroupsDashboardMetrics: async (
    params?: WhatsAppGroupsDashboardParams
  ): Promise<WhatsAppApiResponse<WhatsAppGroupsDashboardData>> => {
    const { data } = await api.get<WhatsAppApiResponse<WhatsAppGroupsDashboardData>>(
      "/whatsapp/groups/metrics/dashboard",
      { params }
    );

    return data;
  },
};

export default whatsappService;
