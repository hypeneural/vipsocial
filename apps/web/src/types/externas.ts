// Externas Module - Type Definitions (DB-backed)

/**
 * Event Category (from DB)
 */
export interface EventCategory {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
    sort_order: number;
    events_count?: number;
}

/**
 * Event Status (from DB)
 */
export interface EventStatusData {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
    sort_order: number;
    events_count?: number;
}

export type VipGalleryStatus = 'draft' | 'active' | 'paused' | 'archived';
export type VipSlideshowStatus = 'draft' | 'active' | 'paused' | 'archived' | 'expired';
export type VipSlideshowLayout = 'auto' | 'polaroid' | 'fullscreen' | 'split' | 'cinematic';
export type VipLogoMode = 'default' | 'custom' | 'none';
export type VipLogoAnchor =
    | 'top_left'
    | 'top_center'
    | 'top_right'
    | 'center_left'
    | 'center'
    | 'center_right'
    | 'bottom_left'
    | 'bottom_center'
    | 'bottom_right';

export interface VipCoverageStats {
    total_galleries: number;
    active_galleries: number;
    total_views: number;
    total_downloads: number;
}

export interface VipCoverageParticipantSummary {
    participant_phone?: string | null;
    sender_name?: string | null;
    total_photos: number;
}

export interface VipCoveragePhotoDetail {
    id: number;
    zapi_message_id: string;
    sender_name?: string | null;
    participant_phone?: string | null;
    caption?: string | null;
    short_text?: string | null;
    highlight_score: number;
    processing_status: string;
    is_approved: boolean;
    downloads_count: number;
    width?: number | null;
    height?: number | null;
    received_at?: string | null;
    published_at?: string | null;
    created_at: string;
    image_url?: string | null;
}

export interface VipCoveragePhotoDetailsResponse {
    event_id: number;
    event_title: string;
    total_photos: number;
    active_photos: number;
    inactive_photos: number;
    first_photo_sent_at?: string | null;
    last_photo_sent_at?: string | null;
    participants: VipCoverageParticipantSummary[];
    photos: VipCoveragePhotoDetail[];
}

export interface VipGalleryGroupOption {
    value: string;
    label: string;
}

export interface VipGalleryStatusOption {
    value: VipGalleryStatus;
    label: string;
}

export interface VipGalleryBanner {
    id: number;
    image_url: string;
    link_url?: string | null;
    alt_text?: string | null;
    sort_order: number;
    width?: number | null;
    height?: number | null;
}

export interface VipGalleryAdminOptions {
    groups: VipGalleryGroupOption[];
    statuses: VipGalleryStatusOption[];
    default_delete_keywords: string;
    default_pause_keywords: string;
    default_logo_url?: string | null;
    no_logo_sentinel: string;
    banner_guidelines?: {
        rendered_width: number;
        rendered_height: number;
        ratio_label: string;
    };
    logo_defaults?: {
        anchor: VipLogoAnchor;
        size_percent: number;
        min_size_percent: number;
        max_size_percent: number;
        safe_area_percent: number;
        offset_percent: number;
        anchors: VipLogoAnchor[];
    };
    slideshow_statuses?: VipSlideshowOption<VipSlideshowStatus>[];
    slideshow_layouts?: VipSlideshowOption<VipSlideshowLayout>[];
}

export interface VipSlideshowOption<T extends string = string> {
    value: T;
    label: string;
}

export interface VipGallerySlideshowMeta {
    statuses: VipSlideshowOption<VipSlideshowStatus>[];
    layouts: VipSlideshowOption<VipSlideshowLayout>[];
}

export interface VipGallerySlideshowData {
    id?: number | null;
    external_event_id: number;
    slideshow_code?: string | null;
    public_url?: string | null;
    is_enabled: boolean;
    status: VipSlideshowStatus;
    layout: VipSlideshowLayout;
    interval_ms: number;
    queue_limit: number;
    background_url?: string | null;
    partner_logo_path?: string | null;
    partner_logo_url?: string | null;
    show_neon: boolean;
    show_sender_credit: boolean;
    neon_text: string;
    instructions_text: string;
    expires_at?: string | null;
}

export interface VipGallerySlideshowResponse {
    exists: boolean;
    slideshow: VipGallerySlideshowData;
    meta: VipGallerySlideshowMeta;
}

export interface VipCoverageLogSummary {
    total_logs: number;
    received_logs: number;
    queued_logs: number;
    published_logs: number;
    failed_logs: number;
    total_photos: number;
    photos_processed: number;
    photos_failed: number;
    pending_jobs: number;
    pending_webhook_jobs: number;
    pending_processing_jobs: number;
    failed_jobs: number;
}

export interface VipCoverageQueueStatus {
    queue: string;
    pending: number;
}

export interface VipCoverageLogEntry {
    id: number;
    message_id?: string | null;
    phone?: string | null;
    group_label?: string | null;
    detected_type: string;
    routing_status: string;
    error_message?: string | null;
    created_at: string;
    event_id?: number | null;
    event_title?: string | null;
    photo_id?: number | null;
    photo_processing_status?: string | null;
    sender_name?: string | null;
    participant_phone?: string | null;
}

export interface VipCoverageLogsResponse {
    summary: VipCoverageLogSummary;
    queues: VipCoverageQueueStatus[];
    root_cause?: string | null;
    logs: VipCoverageLogEntry[];
}

/**
 * Contato do cliente
 */
export interface ClientContact {
    nome: string;
    whatsapp: string;
}

/**
 * Collaborator on a pivot (from API response)
 */
export interface EventCollaborator {
    id: number;
    name: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
    pivot: {
        funcao?: string;
    };
}

/**
 * Equipment on a pivot (from API response)
 */
export interface EventEquipmentItem {
    id: number;
    nome: string;
    marca?: string;
    modelo?: string;
    category?: {
        id: number;
        name: string;
        icon: string;
    };
    pivot: {
        checked: boolean;
    };
}

/**
 * Equipment type (for backwards compatibility in Equipment inventory)
 */
export type EquipmentType = 'camera' | 'lente' | 'microfone' | 'celular' | 'adaptador' | 'outro';

export const EQUIPMENT_TYPE_CONFIG: Record<EquipmentType, { label: string; icon: string }> = {
    camera: { label: 'Câmera', icon: 'Camera' },
    lente: { label: 'Lente', icon: 'Aperture' },
    microfone: { label: 'Microfone', icon: 'Mic' },
    celular: { label: 'Celular', icon: 'Smartphone' },
    adaptador: { label: 'Adaptador', icon: 'Plug' },
    outro: { label: 'Outro', icon: 'Package' },
};

/**
 * Equipment Status (for backwards compatibility)
 */
export type EquipmentStatus = 'disponivel' | 'em_uso' | 'manutencao';

export const EQUIPMENT_STATUS_CONFIG: Record<EquipmentStatus, { label: string; color: string }> = {
    disponivel: { label: 'Disponível', color: 'bg-green-500' },
    em_uso: { label: 'Em Uso', color: 'bg-yellow-500' },
    manutencao: { label: 'Manutenção', color: 'bg-red-500' },
};

/**
 * Equipment (for backwards compatibility)
 */
export interface Equipment {
    id: number;
    nome: string;
    tipo: EquipmentType;
    marca?: string;
    modelo?: string;
    patrimonio?: string;
    status: EquipmentStatus;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Evento externo (DB-backed)
 */
export interface ExternalEvent {
    id: number;
    titulo: string;
    category_id: number;
    category?: EventCategory;
    status_id: number;
    status?: EventStatusData;
    briefing?: string;
    data_hora: string;
    data_hora_fim?: string;
    local: string;
    endereco_completo?: string;
    contato_nome?: string;
    contato_whatsapp?: string;
    observacao_interna?: string;
    is_vip_gallery: boolean;
    vip_gallery_status?: VipGalleryStatus | null;
    whatsapp_group_id?: string | null;
    gallery_slug?: string | null;
    custom_logo_path?: string | null;
    custom_logo_url?: string | null;
    logo_size_percent?: number | null;
    logo_anchor?: VipLogoAnchor | null;
    logo_offset_x_percent?: number | null;
    logo_offset_y_percent?: number | null;
    views_count?: number;
    allow_pause_command?: boolean;
    allow_delete_command?: boolean;
    pause_command_keyword?: string | null;
    delete_command_keyword?: string | null;
    vip_gallery_banners?: VipGalleryBanner[];
    collaborators: EventCollaborator[];
    equipment: EventEquipmentItem[];
    created_at: string;
    updated_at: string;
}

export interface VipCoverageEvent extends ExternalEvent {
    vip_gallery_photos_count: number;
    vip_gallery_banners_count: number;
    vip_gallery_downloads_count: number;
    vip_gallery_public_url?: string | null;
    vip_gallery_is_active: boolean;
    vip_gallery_participants_summary: VipCoverageParticipantSummary[];
    vip_gallery_total_participants: number;
    vip_gallery_first_photo_sent_at?: string | null;
    vip_gallery_last_photo_sent_at?: string | null;
}

const GOOGLE_CALENDAR_TIME_ZONE = "America/Sao_Paulo";

const VIP_GALLERY_STATUS_TEXT: Record<VipGalleryStatus, string> = {
    draft: "Rascunho",
    active: "Ativa",
    paused: "Pausada",
    archived: "Arquivada",
};


const parseEventDate = (dateStr: string): Date => {
    // DB stores dates in São Paulo local time. Strip any UTC/timezone suffix
    // so that new Date() interprets the value as local time, not UTC.
    let normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
    // Remove trailing Z (UTC marker) or timezone offset like +00:00 / -03:00
    normalized = normalized.replace(/Z$/i, "").replace(/[+-]\d{2}:\d{2}$/, "");
    // Trim fractional seconds (.000000) to keep only YYYY-MM-DDTHH:mm:ss
    normalized = normalized.replace(/\.\d+$/, "");
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
};

const formatGoogleCalendarDate = (value: string | Date): string => {
    const date = value instanceof Date ? value : parseEventDate(value);
    // Format directly from the Date object (already in local time)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const formatCollaboratorLine = (collaborator: EventCollaborator): string => {
    const role = collaborator.pivot?.funcao?.trim() || collaborator.role?.trim();
    return role ? `- ${collaborator.name} (${role})` : `- ${collaborator.name}`;
};

const formatEquipmentLine = (equipment: EventEquipmentItem): string => {
    const details = [equipment.nome, equipment.marca, equipment.modelo]
        .filter((value): value is string => !!value && value.trim() !== "")
        .join(" | ");

    return `- ${details}`;
};

const buildGoogleCalendarDetails = (event: ExternalEvent): string => {
    const sections: string[] = [];
    const collaborators = event.collaborators?.map(formatCollaboratorLine) || [];
    const equipment = event.equipment?.map(formatEquipmentLine) || [];

    if (event.briefing?.trim()) {
        sections.push(`📝 Briefing\n${event.briefing.trim()}`);
    }

    sections.push(
        `👥 Colaboradores\n${collaborators.length > 0 ? collaborators.join("\n") : "- Nenhum colaborador vinculado"}`,
        `🎒 Equipamentos\n${equipment.length > 0 ? equipment.join("\n") : "- Nenhum equipamento vinculado"}`
    );

    if (event.contato_nome?.trim() || event.contato_whatsapp?.trim()) {
        const contactLines = [
            event.contato_nome?.trim() ? `- Nome: ${event.contato_nome.trim()}` : null,
            event.contato_whatsapp?.trim() ? `- WhatsApp: ${event.contato_whatsapp.trim()}` : null,
        ].filter((line): line is string => line !== null);

        sections.push(`📞 Contato do cliente\n${contactLines.join("\n")}`);
    }

    if (event.observacao_interna?.trim()) {
        sections.push(`📌 Observacoes internas\n${event.observacao_interna.trim()}`);
    }

    if (event.is_vip_gallery) {
        const vipLines = [
            `- Status: ${VIP_GALLERY_STATUS_TEXT[event.vip_gallery_status || "draft"]}`,
            event.gallery_slug?.trim() ? `- Galeria: https://www.coberturavip.com.br/${event.gallery_slug.trim()}` : null,
            event.allow_delete_command ? `- Delete command: ${event.delete_command_keyword || "Ativo"}` : null,
            event.allow_pause_command ? `- Pause command: ${event.pause_command_keyword || "Ativo"}` : null,
        ].filter((line): line is string => line !== null);

        sections.push(`📸 Cobertura VIP\n${vipLines.join("\n")}`);
    }

    return sections.join("\n\n");
};

/**
 * Helper: Gera URL do Google Calendar
 */
export const generateGoogleCalendarUrl = (event: ExternalEvent): string => {
    const start = parseEventDate(event.data_hora);
    const end = event.data_hora_fim
        ? parseEventDate(event.data_hora_fim)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const startDate = formatGoogleCalendarDate(start);
    const endDate = formatGoogleCalendarDate(end);
    const categoryName = (event.category?.name?.trim() || "Evento").toUpperCase();

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `${categoryName} | ${event.titulo}`,
        dates: `${startDate}/${endDate}`,
        ctz: GOOGLE_CALENDAR_TIME_ZONE,
        details: buildGoogleCalendarDetails(event),
        location: event.endereco_completo || event.local,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Helper: Gera link do WhatsApp
 */
export const generateWhatsAppUrl = (nome: string, whatsapp: string, message?: string): string => {
    const phone = whatsapp.replace(/\D/g, '');
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    const encodedMessage = message ? `&text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${phoneWithCountry}${encodedMessage}`;
};
