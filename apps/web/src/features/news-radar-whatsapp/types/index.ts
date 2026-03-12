export interface ApiEnvelope<T, M = unknown> {
    success: boolean;
    data: T;
    message: string;
    meta?: M;
}

export interface CursorPaginationMeta {
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
    has_more_pages: boolean;
}

export interface WhatsAppNewsGroupRef {
    id: string;
    group_id?: string | null;
    provider?: string | null;
    provider_group_id?: string | null;
    name: string;
    default_label?: string | null;
    description?: string | null;
    news_ingest_enabled?: boolean;
    allow_media_download?: boolean;
    label?: string | null;
}

export interface UserWhatsAppNewsGroup {
    id: number;
    whatsapp_group_fk: string;
    is_active: boolean;
    sort_order: number;
    label_override: string | null;
    notification_mode: string | null;
    last_seen_event_id: number | null;
    last_seen_event_at: string | null;
    group: WhatsAppNewsGroupRef | null;
    stats: {
        unread_count: number;
        latest_event_at: string | null;
        latest_event_preview: string | null;
    };
}

export interface WhatsAppGroupSummary {
    whatsapp_group_fk: string;
    last_seen_event_id: number | null;
    last_seen_event_at: string | null;
    group: WhatsAppNewsGroupRef | null;
    stats: {
        total_events: number;
        unread_count: number;
        ignored_count: number;
        starred_count: number;
        latest_event_at: string | null;
    };
}

export type WhatsAppEventEditorialState =
    | "new"
    | "reviewed"
    | "ignored"
    | "bundled"
    | "promoted";

export type WhatsAppBundleUsageState =
    | "unused"
    | "used_in_open_bundle"
    | "used_in_promoted_bundle"
    | "used_in_multiple_bundles";

export interface UserWhatsAppEventState {
    is_ignored: boolean;
    is_starred: boolean;
    reviewed_at: string | null;
    last_seen_at: string | null;
}

export interface WhatsAppInboundEventMedia {
    id: number;
    kind: "image" | "video" | "document" | "audio" | "thumbnail" | string;
    source_url: string | null;
    thumbnail_source_url: string | null;
    mime_type: string | null;
    file_name: string | null;
    width: number | null;
    height: number | null;
    page_count: number | null;
    download_status: "pending" | "downloaded" | "failed" | "expired" | "skipped" | string;
}

export interface WhatsAppTimelineEvent {
    id: number;
    provider: string;
    instance_id: string;
    message_id: string;
    group_id_raw: string;
    chat_name: string | null;
    message_kind: string;
    processing_status: string;
    ignored_reason: string | null;
    download_status: "pending" | "downloaded" | "failed" | "expired" | "skipped" | string;
    participant_phone: string | null;
    participant_lid: string | null;
    sender_name: string | null;
    sender_photo: string | null;
    reference_message_id: string | null;
    reply_to_message_id: string | null;
    text_message: string | null;
    text_title: string | null;
    text_description: string | null;
    link_url: string | null;
    has_media: boolean;
    has_caption: boolean;
    is_deleted: boolean;
    is_forwarded: boolean;
    sent_at: string | null;
    received_at: string | null;
    edited_at: string | null;
    editorial_state: WhatsAppEventEditorialState;
    bundle_usage_state?: WhatsAppBundleUsageState | null;
    user_state: UserWhatsAppEventState;
    media: WhatsAppInboundEventMedia[];
}

export type WhatsAppBundleStatus =
    | "open"
    | "reviewing"
    | "ready"
    | "promoted"
    | "archived";

export type WhatsAppBundleCreationMode = "manual_selection" | "manual_plus_suggestions";

export interface WhatsAppNewsBundleEventSummary {
    id: number;
    message_id: string;
    message_kind: string;
    text_message: string | null;
    link_url: string | null;
    sender_name: string | null;
    sent_at: string | null;
    has_media: boolean;
}

export interface WhatsAppNewsBundleItem {
    id: number;
    sort_order: number;
    is_cover: boolean;
    event: WhatsAppNewsBundleEventSummary | null;
}

export interface WhatsAppNewsBundle {
    id: number;
    whatsapp_group_fk: string;
    status: WhatsAppBundleStatus;
    creation_mode: WhatsAppBundleCreationMode;
    assigned_to: number | null;
    title: string | null;
    headline_draft: string | null;
    subheadline_draft: string | null;
    lead_draft: string | null;
    summary: string | null;
    origin_summary: string | null;
    notes: string | null;
    editorial_notes: string | null;
    promotion_notes: string | null;
    city: string | null;
    urgency: string | null;
    category: string | null;
    categories_json: string[] | null;
    is_starred: boolean;
    cover_media_id: number | null;
    lock_version: number;
    message_count: number;
    media_count: number;
    primary_sender_name: string | null;
    has_updated_source_messages: boolean;
    first_message_at: string | null;
    last_message_at: string | null;
    review_started_at: string | null;
    promoted_at: string | null;
    archived_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    group?: {
        id: string | null;
        name: string | null;
        group_id: string | null;
    };
    items?: WhatsAppNewsBundleItem[];
}

export interface WhatsAppBundlePromotionResult {
    bundle: WhatsAppNewsBundle;
    news_item: {
        id: number;
        public_token: string;
        title: string;
        excerpt: string | null;
        news_source_id: number;
    };
    created: boolean;
}

export interface WhatsAppBundleMarkdownPreview {
    bundle_id: number;
    lock_version: number;
    markdown_text: string;
    markdown_hash: string;
}

export interface WhatsAppBundleMarkdownExport {
    bundle_id: number;
    export_id: number;
    bundle_lock_version: number;
    markdown_hash: string;
    expires_at: string | null;
    signed_url: string;
}

export interface WhatsAppNewsGroupListParams {
    include_inactive?: boolean;
}

export interface WhatsAppGroupTimelineParams {
    cursor?: string | null;
    per_page?: number;
    window?: string;
    from?: string;
    to?: string;
    message_kind?: string;
    search?: string;
    include_ignored?: boolean;
}

export interface WhatsAppNewsBundleListParams {
    group_fk?: string;
    status?: WhatsAppBundleStatus;
}

export interface CreateWhatsAppNewsBundlePayload {
    group_fk: string;
    title?: string;
    creation_mode?: WhatsAppBundleCreationMode;
    event_ids: number[];
}

export interface UpdateWhatsAppNewsBundlePayload {
    lock_version: number;
    title?: string | null;
    headline_draft?: string | null;
    subheadline_draft?: string | null;
    lead_draft?: string | null;
    summary?: string | null;
    origin_summary?: string | null;
    notes?: string | null;
    editorial_notes?: string | null;
    promotion_notes?: string | null;
    city?: string | null;
    urgency?: string | null;
    category?: string | null;
    categories_json?: string[] | null;
    assigned_to?: number | null;
}

export interface AddWhatsAppNewsBundleItemsPayload {
    lock_version: number;
    event_ids: number[];
}

export interface ExportWhatsAppBundleMarkdownPayload {
    lock_version: number;
    expires_in_minutes?: number;
}
