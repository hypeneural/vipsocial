// Distribution Flow Module - Type Definitions

// ==========================================
// CONTROLE GLOBAL
// ==========================================
export interface DistributionControl {
    id: number;
    enabled: boolean;
    updated_at: string;
    updated_by?: string;
}

// ==========================================
// CANAIS
// ==========================================
export type ChannelType = 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'email';

export interface Channel {
    channel_id: number;
    name: string;
    type: ChannelType;
    icon: string;
    color: string;
    enabled: boolean;
    destinations_count: number;
    messages_today: number;
    success_rate: number;
    created_at: string;
    updated_at: string;
}

export interface ChannelDestination {
    destination_id: number;
    channel_id: number;
    identifier: string;
    name: string;
    enabled: boolean;
    created_at: string;
}

// ==========================================
// MENSAGENS
// ==========================================
export type MessageStatus = 'pending' | 'sent' | 'failed' | 'deleted';

export interface Message {
    id: number;
    title: string;
    link: string;
    urlImage: string;
    channel: ChannelType;
    destination_name: string;
    status: MessageStatus;
    sent_at: string | null;
    deleted_at: string | null;
    error_message: string | null;
    created_at: string;
}

export interface NewsGrouped {
    id: number;
    title: string;
    link: string;
    urlImage: string;
    deleted: boolean;
    total_sent: number;
    total_failed: number;
    messages: Message[];
    created_at: string;
}

// ==========================================
// RESPOSTA DA API
// ==========================================
export interface NewsDistributionResponse {
    status: 'success' | 'error';
    currentPage: number;
    totalPages: number;
    totalDistinctLinks: number;
    data: NewsGrouped[];
}

// ==========================================
// HISTÓRICO
// ==========================================
export type ActionType = 'toggle_global' | 'toggle_channel' | 'delete_news' | 'send_news' | 'retry_failed';

export interface HistoryEntry {
    id: number;
    action: ActionType;
    description: string;
    user: string | null;
    created_at: string;
}

// ==========================================
// ESTATÍSTICAS
// ==========================================
export interface DistributionStats {
    news_today: number;
    sent_today: number;
    success_rate: number;
    failed_today: number;
    deleted_today: number;
}

// ==========================================
// CONFIGURAÇÃO DE CANAIS
// ==========================================
export const CHANNEL_CONFIG: Record<ChannelType, { icon: string; color: string; label: string; bgColor: string }> = {
    whatsapp: {
        icon: 'MessageCircle',
        color: '#25D366',
        bgColor: 'bg-[#25D366]/10',
        label: 'WhatsApp',
    },
    telegram: {
        icon: 'Send',
        color: '#0088CC',
        bgColor: 'bg-[#0088CC]/10',
        label: 'Telegram',
    },
    facebook: {
        icon: 'Facebook',
        color: '#1877F2',
        bgColor: 'bg-[#1877F2]/10',
        label: 'Facebook',
    },
    instagram: {
        icon: 'Instagram',
        color: '#E4405F',
        bgColor: 'bg-[#E4405F]/10',
        label: 'Instagram',
    },
    twitter: {
        icon: 'Twitter',
        color: '#1DA1F2',
        bgColor: 'bg-[#1DA1F2]/10',
        label: 'Twitter/X',
    },
    email: {
        icon: 'Mail',
        color: '#EA4335',
        bgColor: 'bg-[#EA4335]/10',
        label: 'Email',
    },
};

// ==========================================
// STATUS CONFIG
// ==========================================
export const STATUS_CONFIG: Record<MessageStatus, { label: string; color: string; bgColor: string }> = {
    pending: {
        label: 'Pendente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10',
    },
    sent: {
        label: 'Enviado',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
    },
    failed: {
        label: 'Falhou',
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
    },
    deleted: {
        label: 'Deletado',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
    },
};

// ==========================================
// HELPERS
// ==========================================

/**
 * Calcula status consolidado de uma notícia
 */
export const getConsolidatedStatus = (messages: Message[]): MessageStatus => {
    if (messages.every(m => m.status === 'deleted')) return 'deleted';
    if (messages.some(m => m.status === 'failed')) return 'failed';
    if (messages.some(m => m.status === 'pending')) return 'pending';
    return 'sent';
};

/**
 * Formata data relativa
 */
export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    return `há ${diffDays} dias`;
};

/**
 * Formata data e hora
 */
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
