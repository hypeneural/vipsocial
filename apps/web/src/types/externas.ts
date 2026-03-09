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
}

/**
 * Helper: Gera URL do Google Calendar
 */
export const generateGoogleCalendarUrl = (event: ExternalEvent): string => {
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatDate(event.data_hora);
    const endDate = event.data_hora_fim
        ? formatDate(event.data_hora_fim)
        : formatDate(new Date(new Date(event.data_hora).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.titulo,
        dates: `${startDate}/${endDate}`,
        details: event.briefing || '',
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
