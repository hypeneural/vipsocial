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
    collaborators: EventCollaborator[];
    equipment: EventEquipmentItem[];
    created_at: string;
    updated_at: string;
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
