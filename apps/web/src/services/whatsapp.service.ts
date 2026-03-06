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

export interface WhatsAppConnectionStateProfile {
  lid: string | null;
  name: string | null;
  about: string | null;
  img_url: string | null;
  is_business: boolean | null;
}

export interface WhatsAppConnectionStateDevice {
  session_id: number | null;
  session_name: string | null;
  device_model: string | null;
  original_device: string | null;
}

export interface WhatsAppConnectionStateData {
  connected: boolean;
  checked_at: string;
  connection_source: "status+device" | "qr+device" | "status+qr";
  smartphone_connected: boolean | null;
  status_message: string | null;
  phone: string | null;
  formatted_phone: string | null;
  qr_code: string | null;
  qr_available: boolean;
  qr_expires_in_sec: number | null;
  qr_error: string | null;
  profile: WhatsAppConnectionStateProfile;
  device: WhatsAppConnectionStateDevice;
  device_error: string | null;
}

export interface WhatsAppConnectionStateParams {
  fresh?: boolean;
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
  getConnectionState: async (
    params?: WhatsAppConnectionStateParams
  ): Promise<WhatsAppApiResponse<WhatsAppConnectionStateData>> => {
    const { data } = await api.get<WhatsAppApiResponse<WhatsAppConnectionStateData>>(
      "/whatsapp/connection-state",
      { params }
    );

    return data;
  },

  disconnect: async (): Promise<WhatsAppApiResponse<Record<string, unknown>>> => {
    const { data } = await api.get<WhatsAppApiResponse<Record<string, unknown>>>(
      "/whatsapp/disconnect"
    );

    return data;
  },

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
