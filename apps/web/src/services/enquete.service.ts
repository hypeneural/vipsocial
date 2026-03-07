import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";

export type PollStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "closed"
  | "archived";

export type PollSelectionType = "single" | "multiple";
export type PollVoteLimitMode = "once_ever" | "once_per_day" | "once_per_window";
export type PollResultsVisibility = "live" | "after_vote" | "after_end" | "never";
export type PollAfterEndBehavior =
  | "hide_widget"
  | "show_closed_message"
  | "show_results_only";

export interface PollOption {
  id: number;
  public_id: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  image_thumb_url: string | null;
  votes?: number;
  percentage?: number;
}

export interface PollPlacementSummary {
  id: number;
  public_id: string;
  placement_name: string;
  canonical_url: string | null;
  is_active: boolean;
  site_name?: string | null;
  votes_accepted?: number;
  votes_blocked?: number;
  unique_sessions?: number;
}

export interface PollSiteDomain {
  id: number;
  poll_site_id: number;
  domain_pattern: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PollSite {
  id: number;
  name: string;
  public_key: string;
  has_secret_key: boolean;
  is_active: boolean;
  settings: Record<string, unknown>;
  domains_count: number;
  placements_count: number;
  domains: PollSiteDomain[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PollPlacement {
  id: number;
  public_id: string;
  poll_id: number;
  poll_site_id: number | null;
  placement_name: string;
  article_external_id: string | null;
  article_title: string | null;
  canonical_url: string | null;
  page_path: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  embed_url: string;
  embed_loader_url: string;
  site: {
    id: number;
    name: string;
    public_key: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Poll {
  id: number;
  public_id: string;
  title: string;
  question: string;
  slug: string | null;
  status: PollStatus;
  selection_type: PollSelectionType;
  max_choices: number | null;
  vote_limit_mode: PollVoteLimitMode;
  vote_cooldown_minutes: number | null;
  results_visibility: PollResultsVisibility;
  after_end_behavior: PollAfterEndBehavior;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  options: PollOption[];
  placements: PollPlacementSummary[];
  placements_count: number;
  options_count: number;
  valid_votes_count: number;
  blocked_attempts_count: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface PollOptionInput {
  id?: number;
  label: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreatePollSiteDTO {
  name: string;
  public_key?: string | null;
  secret_key?: string | null;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

export type UpdatePollSiteDTO = Partial<CreatePollSiteDTO>;

export interface CreatePollSiteDomainDTO {
  domain_pattern: string;
  is_active?: boolean;
}

export type UpdatePollSiteDomainDTO = CreatePollSiteDomainDTO;

export interface CreatePollPlacementDTO {
  poll_site_id?: number | null;
  placement_name: string;
  article_external_id?: string | null;
  article_title?: string | null;
  canonical_url?: string | null;
  page_path?: string | null;
  is_active?: boolean;
}

export type UpdatePollPlacementDTO = CreatePollPlacementDTO;

export interface CreatePollDTO {
  title: string;
  question: string;
  slug?: string | null;
  status: PollStatus;
  selection_type: PollSelectionType;
  max_choices?: number | null;
  vote_limit_mode: PollVoteLimitMode;
  vote_cooldown_minutes?: number | null;
  results_visibility: PollResultsVisibility;
  after_end_behavior: PollAfterEndBehavior;
  starts_at?: string | null;
  ends_at?: string | null;
  timezone?: string;
  settings?: Record<string, unknown>;
  options: PollOptionInput[];
}

export type UpdatePollDTO = Partial<CreatePollDTO>;

export interface PollFilters extends FilterParams {
  status?: PollStatus;
  selection_type?: PollSelectionType;
  include_archived?: boolean;
}

export interface PollStats {
  total_polls: number;
  live_polls: number;
  votes_accepted: number;
  votes_blocked: number;
  unique_sessions: number;
  impressions: number;
  conversion_rate: number;
}

export interface PollDashboardOverview {
  impressions: number;
  unique_sessions: number;
  votes_accepted: number;
  votes_blocked: number;
  conversion_rate: number;
  top_option: PollOption | null;
}

export interface PollTimeSeriesPoint {
  bucket_type: "hour" | "day";
  bucket_at: string;
  impressions: number;
  unique_sessions: number;
  votes_accepted: number;
  votes_blocked: number;
  conversion_rate: number;
  payload?: Record<string, unknown>;
}

export interface PollDashboardData {
  poll: Poll;
  overview: PollDashboardOverview;
  options: PollOption[];
  timeseries: PollTimeSeriesPoint[];
}

export interface PollTimeSeriesResponse {
  poll: Pick<Poll, "id" | "public_id" | "title" | "status">;
  window: string;
  bucket_type: "hour" | "day";
  series: PollTimeSeriesPoint[];
}

export interface PollLocationMetric {
  country: string;
  region: string;
  city: string;
  attempts: number;
  accepted: number;
  blocked: number;
}

export interface PollProviderMetric {
  provider: string;
  attempts: number;
  accepted: number;
  blocked: number;
}

export interface PollDeviceMetric {
  device_type: string;
  attempts: number;
  accepted: number;
  blocked: number;
}

export interface PollBrowserMetric {
  browser_family: string;
  attempts: number;
  accepted: number;
  blocked: number;
}

export interface PollVoteAttemptLog {
  id: string;
  poll_id: number;
  poll_placement_id: number | null;
  poll_session_id: string | null;
  status: string;
  block_reason: string | null;
  risk_score: number | null;
  ip_hash: string;
  fingerprint_hash: string | null;
  external_user_hash: string | null;
  browser_family: string | null;
  os_family: string | null;
  device_type: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  asn: string | null;
  provider: string | null;
  meta: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface PollVoteLog {
  id: string;
  poll_id: number;
  option_id: number;
  option_label: string | null;
  poll_placement_id: number | null;
  placement_name: string | null;
  poll_session_id: string | null;
  vote_attempt_id: string | null;
  status: string;
  accepted_at: string | null;
  invalidated_at: string | null;
  invalidated_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PollTimeSeriesParams {
  window?: "24h" | "7d" | "30d" | "90d";
  bucket_type?: "hour" | "day";
}

const readBlob = async (path: string): Promise<Blob> => {
  const { data } = await api.get(path, { responseType: "blob" });
  return data;
};

export const enqueteService = {
  getAll: async (params?: ListParams & PollFilters): Promise<PaginatedResponse<Poll>> => {
    const { data } = await api.get<PaginatedResponse<Poll>>("/enquetes", { params });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<Poll>> => {
    const { data } = await api.get<ApiResponse<Poll>>(`/enquetes/${id}`);
    return data;
  },

  create: async (dto: CreatePollDTO): Promise<ApiResponse<Poll>> => {
    const { data } = await api.post<ApiResponse<Poll>>("/enquetes", dto);
    return data;
  },

  update: async (id: number, dto: UpdatePollDTO): Promise<ApiResponse<Poll>> => {
    const { data } = await api.put<ApiResponse<Poll>>(`/enquetes/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete<ApiResponse<void>>(`/enquetes/${id}`);
    return data;
  },

  duplicate: async (id: number): Promise<ApiResponse<Poll>> => {
    const { data } = await api.post<ApiResponse<Poll>>(`/enquetes/${id}/duplicate`);
    return data;
  },

  updateStatus: async (id: number, status: PollStatus): Promise<ApiResponse<Poll>> => {
    const { data } = await api.patch<ApiResponse<Poll>>(`/enquetes/${id}/status`, { status });
    return data;
  },

  pause: async (id: number): Promise<ApiResponse<Poll>> => {
    const { data } = await api.post<ApiResponse<Poll>>(`/enquetes/${id}/pause`);
    return data;
  },

  close: async (id: number): Promise<ApiResponse<Poll>> => {
    const { data } = await api.post<ApiResponse<Poll>>(`/enquetes/${id}/close`);
    return data;
  },

  reopen: async (id: number): Promise<ApiResponse<Poll>> => {
    const { data } = await api.post<ApiResponse<Poll>>(`/enquetes/${id}/reopen`);
    return data;
  },

  getOverview: async (): Promise<ApiResponse<PollStats>> => {
    const { data } = await api.get<ApiResponse<PollStats>>("/enquetes/dashboard/overview");
    return data;
  },

  getStats: async (): Promise<ApiResponse<PollStats>> => {
    return enqueteService.getOverview();
  },

  getDashboard: async (id: number): Promise<ApiResponse<PollDashboardData>> => {
    const { data } = await api.get<ApiResponse<PollDashboardData>>(`/enquetes/${id}/dashboard`);
    return data;
  },

  getResults: async (id: number): Promise<ApiResponse<PollDashboardData>> => {
    return enqueteService.getDashboard(id);
  },

  getPollOverview: async (
    id: number
  ): Promise<ApiResponse<{ poll: Poll; overview: PollDashboardOverview }>> => {
    const { data } = await api.get<ApiResponse<{ poll: Poll; overview: PollDashboardOverview }>>(
      `/enquetes/${id}/metrics/overview`
    );
    return data;
  },

  getTimeSeries: async (
    id: number,
    params?: PollTimeSeriesParams
  ): Promise<ApiResponse<PollTimeSeriesResponse>> => {
    const { data } = await api.get<ApiResponse<PollTimeSeriesResponse>>(
      `/enquetes/${id}/metrics/timeseries`,
      { params }
    );
    return data;
  },

  getOptionsMetrics: async (id: number): Promise<ApiResponse<PollOption[]>> => {
    const { data } = await api.get<ApiResponse<PollOption[]>>(`/enquetes/${id}/metrics/options`);
    return data;
  },

  getPlacementsMetrics: async (id: number): Promise<ApiResponse<PollPlacementSummary[]>> => {
    const { data } = await api.get<ApiResponse<PollPlacementSummary[]>>(
      `/enquetes/${id}/metrics/placements`
    );
    return data;
  },

  getLocationsMetrics: async (id: number): Promise<ApiResponse<PollLocationMetric[]>> => {
    const { data } = await api.get<ApiResponse<PollLocationMetric[]>>(
      `/enquetes/${id}/metrics/locations`
    );
    return data;
  },

  getProvidersMetrics: async (id: number): Promise<ApiResponse<PollProviderMetric[]>> => {
    const { data } = await api.get<ApiResponse<PollProviderMetric[]>>(
      `/enquetes/${id}/metrics/providers`
    );
    return data;
  },

  getDevicesMetrics: async (id: number): Promise<ApiResponse<PollDeviceMetric[]>> => {
    const { data } = await api.get<ApiResponse<PollDeviceMetric[]>>(
      `/enquetes/${id}/metrics/devices`
    );
    return data;
  },

  getBrowsersMetrics: async (id: number): Promise<ApiResponse<PollBrowserMetric[]>> => {
    const { data } = await api.get<ApiResponse<PollBrowserMetric[]>>(
      `/enquetes/${id}/metrics/browsers`
    );
    return data;
  },

  getVoteAttempts: async (
    id: number,
    params?: ListParams
  ): Promise<PaginatedResponse<PollVoteAttemptLog>> => {
    const { data } = await api.get<PaginatedResponse<PollVoteAttemptLog>>(
      `/enquetes/${id}/vote-attempts`,
      { params }
    );
    return data;
  },

  getVotes: async (id: number, params?: ListParams): Promise<PaginatedResponse<PollVoteLog>> => {
    const { data } = await api.get<PaginatedResponse<PollVoteLog>>(`/enquetes/${id}/votes`, {
      params,
    });
    return data;
  },

  getVoteAttemptById: async (attemptId: string): Promise<ApiResponse<PollVoteAttemptLog>> => {
    const { data } = await api.get<ApiResponse<PollVoteAttemptLog>>(
      `/enquetes/vote-attempts/${attemptId}`
    );
    return data;
  },

  getVoteById: async (voteId: string): Promise<ApiResponse<PollVoteLog>> => {
    const { data } = await api.get<ApiResponse<PollVoteLog>>(`/enquetes/votes/${voteId}`);
    return data;
  },

  invalidateVote: async (voteId: string, reason: string): Promise<ApiResponse<unknown>> => {
    const { data } = await api.post<ApiResponse<unknown>>(`/enquetes/votes/${voteId}/invalidate`, {
      reason,
    });
    return data;
  },

  rebuildSnapshots: async (id: number): Promise<ApiResponse<{ poll_id: number }>> => {
    const { data } = await api.post<ApiResponse<{ poll_id: number }>>(
      `/enquetes/${id}/rebuild-snapshots`
    );
    return data;
  },

  getSites: async (): Promise<ApiResponse<PollSite[]>> => {
    const { data } = await api.get<ApiResponse<PollSite[]>>("/enquetes/sites");
    return data;
  },

  createSite: async (dto: CreatePollSiteDTO): Promise<ApiResponse<PollSite>> => {
    const { data } = await api.post<ApiResponse<PollSite>>("/enquetes/sites", dto);
    return data;
  },

  updateSite: async (id: number, dto: UpdatePollSiteDTO): Promise<ApiResponse<PollSite>> => {
    const { data } = await api.put<ApiResponse<PollSite>>(`/enquetes/sites/${id}`, dto);
    return data;
  },

  getSiteDomains: async (siteId: number): Promise<ApiResponse<PollSiteDomain[]>> => {
    const { data } = await api.get<ApiResponse<PollSiteDomain[]>>(`/enquetes/sites/${siteId}/domains`);
    return data;
  },

  createSiteDomain: async (
    siteId: number,
    dto: CreatePollSiteDomainDTO
  ): Promise<ApiResponse<PollSiteDomain>> => {
    const { data } = await api.post<ApiResponse<PollSiteDomain>>(
      `/enquetes/sites/${siteId}/domains`,
      dto
    );
    return data;
  },

  updateSiteDomain: async (
    id: number,
    dto: UpdatePollSiteDomainDTO
  ): Promise<ApiResponse<PollSiteDomain>> => {
    const { data } = await api.put<ApiResponse<PollSiteDomain>>(`/enquetes/domains/${id}`, dto);
    return data;
  },

  deleteSiteDomain: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete<ApiResponse<void>>(`/enquetes/domains/${id}`);
    return data;
  },

  getPlacements: async (pollId: number): Promise<ApiResponse<PollPlacement[]>> => {
    const { data } = await api.get<ApiResponse<PollPlacement[]>>(`/enquetes/${pollId}/placements`);
    return data;
  },

  createPlacement: async (
    pollId: number,
    dto: CreatePollPlacementDTO
  ): Promise<ApiResponse<PollPlacement>> => {
    const { data } = await api.post<ApiResponse<PollPlacement>>(`/enquetes/${pollId}/placements`, dto);
    return data;
  },

  updatePlacement: async (
    placementId: number,
    dto: UpdatePollPlacementDTO
  ): Promise<ApiResponse<PollPlacement>> => {
    const { data } = await api.put<ApiResponse<PollPlacement>>(
      `/enquetes/placements/${placementId}`,
      dto
    );
    return data;
  },

  togglePlacement: async (placementId: number): Promise<ApiResponse<PollPlacement>> => {
    const { data } = await api.patch<ApiResponse<PollPlacement>>(
      `/enquetes/placements/${placementId}/toggle`
    );
    return data;
  },

  uploadOptionImage: async (optionId: number, file: File): Promise<ApiResponse<PollOption>> => {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post<ApiResponse<PollOption>>(
      `/enquetes/options/${optionId}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
  },

  deleteOptionImage: async (optionId: number): Promise<ApiResponse<PollOption>> => {
    const { data } = await api.delete<ApiResponse<PollOption>>(`/enquetes/options/${optionId}/image`);
    return data;
  },

  exportVotesCsv: async (id: number): Promise<Blob> =>
    readBlob(`/enquetes/${id}/export/votes.csv`),

  exportVoteAttemptsCsv: async (id: number): Promise<Blob> =>
    readBlob(`/enquetes/${id}/export/vote-attempts.csv`),

  exportOptionsSummaryCsv: async (id: number): Promise<Blob> =>
    readBlob(`/enquetes/${id}/export/options-summary.csv`),

  exportPlacementsSummaryCsv: async (id: number): Promise<Blob> =>
    readBlob(`/enquetes/${id}/export/placements-summary.csv`),

  exportResults: async (id: number, _format: "csv" | "xlsx" | "pdf" = "csv"): Promise<Blob> => {
    return enqueteService.exportOptionsSummaryCsv(id);
  },
};

export default enqueteService;
