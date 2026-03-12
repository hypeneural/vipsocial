import { AxiosError, isAxiosError } from "axios";
import api from "./api";

const ENDPOINT = "/news-radar";

export type NewsSourceType = "portal" | "prefeitura" | "blog" | "agencia" | "whatsapp";
export type NewsDiscoveryMode = "auto" | "feed" | "sitemap" | "html_listing";
export type NewsFeedQualityProfile = "full" | "partial" | "teaser_only";
export type NewsFetchDetailMode = "never" | "when_incomplete" | "always";
export type NewsExtractionStatus = "pending" | "extracted" | "extraction_failed";
export type NewsEnrichmentStatus = "none" | "enriched_l1" | "enriched_l2" | "enrichment_failed";
export type NewsUrgency = "baixa" | "media" | "alta";
export type NewsSourceRunStatus = "running" | "success" | "partial" | "failed";
export type NewsDiscoveryRunStatus = "pending" | "running" | "completed" | "failed";
export type NewsPreviewMode = "feed" | "html_listing";
export type NewsItemSortBy = "published_at_utc" | "created_at";
export type NewsSortDirection = "asc" | "desc";

export interface NewsRadarPaginatedResponse<T> {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface NewsSourceRun {
    id: number;
    news_source_id: number;
    started_at: string;
    finished_at?: string | null;
    status: NewsSourceRunStatus;
    items_found: number;
    items_new: number;
    items_failed: number;
    response_time_avg_ms?: number | null;
    error_message?: string | null;
    meta_json?: Record<string, unknown> | null;
}

export interface NewsSource {
    id: number;
    name: string;
    homepage_url: string;
    active: boolean;
    source_type: NewsSourceType;
    discovery_mode: NewsDiscoveryMode;
    feed_quality_profile?: NewsFeedQualityProfile | null;
    fetch_detail_mode: NewsFetchDetailMode;
    source_preset?: string | null;
    crawling_config?: Record<string, unknown> | null;
    throttle_config?: Record<string, unknown> | null;
    timezone_default?: string | null;
    date_formats?: string[] | null;
    render_js_required: boolean;
    last_sync_at?: string | null;
    next_sync_at?: string | null;
    sync_locked_until?: string | null;
    consecutive_failures: number;
    success_rate: number;
    avg_response_ms?: number | null;
    last_items_found: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    items_count?: number;
    raw_items_count?: number;
    runs?: NewsSourceRun[];
}

export interface NewsSourceSummary {
    id: number;
    name: string;
    homepage_url?: string | null;
    source_type?: NewsSourceType;
}

export interface NewsItemAiMetadata {
    id?: number;
    news_item_id?: number;
    city?: string | null;
    state_abbr?: string | null;
    news_theme_id?: number | null;
    urgency?: NewsUrgency | null;
    relevance_score?: number | null;
    entities?: Array<Record<string, unknown>> | null;
    five_ws?: Record<string, unknown> | null;
    suggested_titles?: string[] | null;
    summary_bullets?: string[] | null;
    ai_model_used?: string | null;
    ai_tokens_used?: number | null;
    enrichment_level?: string | null;
}

export interface NewsItemAiLog {
    id: number;
    news_item_id?: number;
    stage: string;
    status: "success" | "failed";
    model?: string | null;
    tokens_used?: number | null;
    error_message?: string | null;
    meta_json?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
}

export interface NewsAiModelHealthLogSnapshot {
    news_item_id?: number | null;
    status: "success" | "failed";
    tokens_used?: number | null;
    error_message?: string | null;
    meta_json?: Record<string, unknown> | null;
    created_at?: string | null;
}

export interface NewsAiModelHealth {
    stage: string;
    model: string;
    health_status: string;
    attempts_total: number;
    attempts_success: number;
    attempts_failed: number;
    failure_rate: number;
    success_rate: number;
    unresolved_failures: number;
    fallback_next_model_count: number;
    retry_same_model_count: number;
    last_attempt_at?: string | null;
    last_error_message?: string | null;
    last_failure_at?: string | null;
    last_success_at?: string | null;
    last_success_tokens_used?: number | null;
    latest_log?: NewsAiModelHealthLogSnapshot | null;
    latest_failure?: NewsAiModelHealthLogSnapshot | null;
    latest_success?: NewsAiModelHealthLogSnapshot | null;
    recent_logs?: NewsAiModelHealthLogSnapshot[];
    category_breakdown?: Record<string, number>;
    strategy_breakdown?: Record<string, number>;
    next_action_breakdown?: Record<string, number>;
    provider_status_breakdown?: Record<string, number>;
}

export interface NewsItemMedia {
    id: number;
    news_item_id?: number;
    type: string;
    url: string;
    width?: number | null;
    height?: number | null;
    alt_text?: string | null;
    position: number;
}

export interface NewsItemRawItem {
    id: number;
    raw_payload?: Record<string, unknown> | null;
    first_seen_at?: string | null;
    seen_count?: number;
}

export interface NewsItem {
    id: number;
    news_source_id: number;
    news_raw_item_id?: number | null;
    url: string;
    raw_url: string;
    guid?: string | null;
    title: string;
    subtitle?: string | null;
    author_raw?: string | null;
    author_normalized?: string | null;
    body_html?: string | null;
    body_text?: string | null;
    excerpt?: string | null;
    hero_image_url?: string | null;
    categories_raw?: string[] | null;
    language?: string | null;
    published_at_raw?: string | null;
    published_at_parsed?: string | null;
    published_at_utc?: string | null;
    published_at_timezone?: string | null;
    published_at_source?: string | null;
    modified_at_raw?: string | null;
    modified_at_utc?: string | null;
    extraction_completeness: number;
    content_source?: string | null;
    extraction_status: NewsExtractionStatus;
    enrichment_status: NewsEnrichmentStatus;
    is_duplicate_candidate: boolean;
    duplicate_of_news_item_id?: number | null;
    created_at?: string;
    updated_at?: string;
    source?: NewsSourceSummary;
    ai_metadata?: NewsItemAiMetadata | null;
    ai_logs?: NewsItemAiLog[];
    media?: NewsItemMedia[];
    raw_item?: NewsItemRawItem | null;
}

export interface NewsDashboard {
    dashboard_timezone?: string;
    dashboard_week_starts_at?: string;
    dashboard_generated_at?: string;
    today_window_start_local?: string;
    today_window_start_utc?: string;
    week_window_start_local?: string;
    week_window_start_utc?: string;
    total_sources: number;
    total_items: number;
    items_today: number;
    items_this_week: number;
    sources_with_failures: number;
    sources_locked: number;
    by_extraction_status: Record<string, number>;
    by_enrichment_status: Record<string, number>;
    by_source: Array<{
        news_source_id: number;
        count: number;
        source?: NewsSourceSummary | null;
    }>;
    failing_sources: Array<Pick<NewsSource, "id" | "name" | "consecutive_failures" | "last_sync_at">>;
    ai_model_health?: NewsAiModelHealth[];
}

export interface NewsSourceFilters {
    active?: boolean;
    source_type?: NewsSourceType;
    search?: string;
    failing?: boolean;
    sort?: "name" | "last_sync_at" | "success_rate" | "consecutive_failures" | "created_at";
    dir?: "asc" | "desc";
    page?: number;
    per_page?: number;
}

export interface NewsItemFilters {
    source_id?: number;
    extraction_status?: NewsExtractionStatus;
    enrichment_status?: NewsEnrichmentStatus;
    search?: string;
    date_from?: string;
    date_to?: string;
    city?: string;
    theme_id?: number;
    urgency?: NewsUrgency;
    sort_by?: NewsItemSortBy;
    sort_dir?: NewsSortDirection;
    page?: number;
    per_page?: number;
    after_id?: number;
}

export interface CreateNewsSourceDTO {
    name: string;
    homepage_url: string;
    source_type: NewsSourceType;
    discovery_mode: NewsDiscoveryMode;
    fetch_detail_mode?: NewsFetchDetailMode;
    feed_quality_profile?: NewsFeedQualityProfile | null;
    source_preset?: string | null;
    crawling_config?: Record<string, unknown>;
    throttle_config?: Record<string, unknown>;
    timezone_default?: string;
    date_formats?: string[];
    render_js_required?: boolean;
    notes?: string;
}

export interface UpdateNewsSourceDTO extends Partial<CreateNewsSourceDTO> {
    active?: boolean;
}

export interface NewsSourceSyncResponse {
    message: string;
    source_id: number;
}

export interface NewsPreviewItem {
    title?: string | null;
    url: string;
    date?: string | null;
    author?: string | null;
    excerpt?: string | null;
    image?: string | null;
    has_body?: boolean;
    has_image?: boolean;
}

export interface NewsFeedQualitySummary {
    score: number;
    profile: NewsFeedQualityProfile;
    flags: string[];
    field_coverage: Record<string, number>;
}

export interface NewsSourceDiscoveryResult {
    feed?: {
        url: string;
        title?: string | null;
        items_count: number;
        quality: NewsFeedQualitySummary;
        suggested_fetch_detail_mode: NewsFetchDetailMode;
        preview_items: NewsPreviewItem[];
    };
    sitemap?: {
        url: string;
        detected: boolean;
    };
    page?: {
        title?: string | null;
        has_feed: boolean;
        detected_cms?: string | null;
    };
}

export interface DiscoverNewsSourcePayload {
    url: string;
}

export interface DiscoverNewsSourceResponse {
    run_id: string;
    status: NewsDiscoveryRunStatus;
    result?: NewsSourceDiscoveryResult;
    error?: string;
    started_at?: string | null;
    finished_at?: string | null;
}

export interface PreviewNewsSourcePayload {
    mode: NewsPreviewMode;
    url: string;
    config?: Record<string, unknown>;
}

export interface PreviewNewsSourceResponse {
    preview: NewsPreviewItem[];
}

export interface TestNewsSelectorPayload {
    url: string;
    selector: string;
    run_id?: string;
}

export interface TestNewsSelectorResponse {
    selector: string;
    matches: number;
    results: Array<{
        text?: string | null;
        html?: string | null;
        tag?: string | null;
    }>;
}

interface ErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorPayload>;
        const message = axiosError.response?.data?.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }

        const validationErrors = axiosError.response?.data?.errors;
        if (validationErrors && typeof validationErrors === "object") {
            const firstEntry = Object.values(validationErrors).find(
                (value) => Array.isArray(value) && value.length > 0,
            );
            if (firstEntry?.[0]) {
                return firstEntry[0];
            }
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

async function request<T>(
    executor: () => Promise<{ data: T }>,
    fallbackMessage: string,
): Promise<T> {
    try {
        const response = await executor();
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage));
    }
}

export const newsRadarService = {
    async getDashboard(): Promise<NewsDashboard> {
        return request(
            () => api.get<NewsDashboard>(`${ENDPOINT}/dashboard`),
            "Nao foi possivel carregar o dashboard do radar.",
        );
    },

    async getItems(params: NewsItemFilters = {}): Promise<NewsRadarPaginatedResponse<NewsItem>> {
        return request(
            () => api.get<NewsRadarPaginatedResponse<NewsItem>>(`${ENDPOINT}/items`, { params }),
            "Nao foi possivel carregar o feed de noticias.",
        );
    },

    async getItemById(id: number): Promise<NewsItem> {
        return request(
            () => api.get<NewsItem>(`${ENDPOINT}/items/${id}`),
            "Nao foi possivel carregar os detalhes da noticia.",
        );
    },

    async getRelatedItems(id: number): Promise<{ data: NewsItem[] }> {
        return request(
            () => api.get<{ data: NewsItem[] }>(`${ENDPOINT}/items/${id}/related`),
            "Nao foi possivel carregar as noticias relacionadas.",
        );
    },

    async getSources(params: NewsSourceFilters = {}): Promise<NewsRadarPaginatedResponse<NewsSource>> {
        return request(
            () => api.get<NewsRadarPaginatedResponse<NewsSource>>(`${ENDPOINT}/sources`, { params }),
            "Nao foi possivel carregar as fontes.",
        );
    },

    async getSourceById(id: number): Promise<NewsSource> {
        return request(
            () => api.get<NewsSource>(`${ENDPOINT}/sources/${id}`),
            "Nao foi possivel carregar os detalhes da fonte.",
        );
    },

    async createSource(payload: CreateNewsSourceDTO): Promise<NewsSource> {
        return request(
            () => api.post<NewsSource>(`${ENDPOINT}/sources`, payload),
            "Nao foi possivel criar a fonte.",
        );
    },

    async updateSource(id: number, payload: UpdateNewsSourceDTO): Promise<NewsSource> {
        return request(
            () => api.put<NewsSource>(`${ENDPOINT}/sources/${id}`, payload),
            "Nao foi possivel atualizar a fonte.",
        );
    },

    async deleteSource(id: number): Promise<{ message: string }> {
        return request(
            () => api.delete<{ message: string }>(`${ENDPOINT}/sources/${id}`),
            "Nao foi possivel remover a fonte.",
        );
    },

    async syncSource(id: number): Promise<NewsSourceSyncResponse> {
        return request(
            () => api.post<NewsSourceSyncResponse>(`${ENDPOINT}/sources/${id}/sync`),
            "Nao foi possivel disparar a sincronizacao.",
        );
    },

    async getSourceRuns(id: number, page = 1): Promise<NewsRadarPaginatedResponse<NewsSourceRun>> {
        return request(
            () =>
                api.get<NewsRadarPaginatedResponse<NewsSourceRun>>(`${ENDPOINT}/sources/${id}/runs`, {
                    params: { page },
                }),
            "Nao foi possivel carregar o historico da fonte.",
        );
    },

    async discoverSource(payload: DiscoverNewsSourcePayload): Promise<DiscoverNewsSourceResponse> {
        return request(
            () => api.post<DiscoverNewsSourceResponse>(`${ENDPOINT}/sources/discover`, payload),
            "Nao foi possivel analisar a fonte.",
        );
    },

    async getDiscoveryStatus(runId: string): Promise<DiscoverNewsSourceResponse> {
        return request(
            () => api.get<DiscoverNewsSourceResponse>(`${ENDPOINT}/sources/discover/${runId}/status`),
            "Nao foi possivel consultar o status da analise.",
        );
    },

    async previewSource(payload: PreviewNewsSourcePayload): Promise<PreviewNewsSourceResponse> {
        return request(
            () => api.post<PreviewNewsSourceResponse>(`${ENDPOINT}/sources/preview`, payload),
            "Nao foi possivel gerar o preview.",
        );
    },

    async testSelector(payload: TestNewsSelectorPayload): Promise<TestNewsSelectorResponse> {
        return request(
            () => api.post<TestNewsSelectorResponse>(`${ENDPOINT}/sources/test-selector`, payload),
            "Nao foi possivel testar o seletor.",
        );
    },
};

export default newsRadarService;
