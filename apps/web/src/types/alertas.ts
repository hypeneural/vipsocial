// Alertas WhatsApp Module - Type Definitions

// ==========================================
// DESTINOS (Grupos de WhatsApp)
// ==========================================
export interface Destination {
    destination_id: number;
    phone_number: string;              // Número/ID do grupo
    name: string;                      // Nome amigável
    tags: string[];                    // Ex: ["tijucas", "esportes"]
    active: boolean;
    created_at: string;
    updated_at: string;

    // Computed (frontend)
    alertCount?: number;
    lastSentAt?: string;
}

// ==========================================
// ALERTAS (Mensagens)
// ==========================================
export interface Alert {
    alert_id: number;
    title: string;                     // Título interno (para gestão)
    message: string;                   // Mensagem a ser enviada (suporta \n)
    active: boolean;
    created_at: string;
    updated_at: string;

    // Relacionamentos
    schedules: AlertSchedule[];
    destinations: Destination[];       // Via alert_destinations
}

// ==========================================
// AGENDAMENTOS (Quando enviar)
// ==========================================
export interface AlertSchedule {
    schedule_id: number;
    alert_id: number;
    days_of_week: string;              // "0111110" (Dom-Sáb, 0=não, 1=sim)
    times: string[];                   // ["10:00", "14:00"]
    specific_date: string | null;      // Data específica (ex: "2026-01-25")
    repeat_interval: number | null;    // Intervalo de repetição (minutos)
    schedule_active: boolean;
    created_at: string;
    updated_at: string;
}

// ==========================================
// LOGS (Histórico de Envios)
// ==========================================
export interface AlertLog {
    log_id: number;
    alert_id: number;
    alert_title: string;
    destination_id: number;
    destination_name: string;
    sent_at: string;                   // Quando foi enviado
    success: boolean;                  // true=sucesso, false=falhou
    response_message_id: string | null; // ID da mensagem na API do WhatsApp
    error_message: string | null;      // Mensagem de erro (se houver)
    created_at: string;
}

// ==========================================
// PROGRAMAS DE TV (Fase 2)
// ==========================================
export interface TVProgram {
    program_id: number;
    name: string;                      // "Jornal VIP", "Esporte Total"
    description?: string;
    start_time: string;                // "12:00"
    end_time: string;                  // "12:30"
    days_of_week: string;              // "0111110" (Seg-Sex)
    active: boolean;
    alert_offset_minutes: number;      // 15 = alerta 15 min antes
    linked_alert_id?: number;          // Alerta vinculado
}

// ==========================================
// PRÓXIMOS DISPAROS
// ==========================================
export interface NextFiring {
    alert_id: number;
    alert_title: string;
    scheduled_time: string;            // "11:45"
    destination_count: number;
    time_until: string;                // "Em 12 minutos"
    time_until_ms: number;
}

// ==========================================
// DASHBOARD STATS
// ==========================================
export interface AlertsStats {
    total_destinations: number;
    active_destinations: number;
    total_alerts: number;
    active_alerts: number;
    next_firings_count: number;
    sent_last_7_days: number;
    failed_last_7_days: number;
}

// ==========================================
// HELPERS
// ==========================================

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/**
 * Decodifica string binária para array de dias
 * "0111110" → ["Seg", "Ter", "Qua", "Qui", "Sex"]
 */
export const decodeDaysOfWeek = (daysString: string): string[] => {
    return daysString.split('').reduce((acc, char, index) => {
        if (char === '1') acc.push(DAY_NAMES[index]);
        return acc;
    }, [] as string[]);
};

/**
 * Codifica array de dias para string binária
 * ["Seg", "Ter", "Qua", "Qui", "Sex"] → "0111110"
 */
export const encodeDaysOfWeek = (days: string[]): string => {
    return DAY_NAMES.map(day => days.includes(day) ? '1' : '0').join('');
};

/**
 * Formata dias para exibição amigável
 * "0111110" → "Seg a Sex"
 */
export const formatDaysOfWeek = (daysString: string): string => {
    const days = decodeDaysOfWeek(daysString);

    if (days.length === 0) return "Nenhum dia";
    if (days.length === 7) return "Todos os dias";
    if (daysString === "0111110") return "Seg a Sex";
    if (daysString === "1000001") return "Fins de semana";

    return days.join(", ");
};

/**
 * Formata mensagem WhatsApp para HTML
 * Suporta *bold*, _italic_, ~strikethrough~, \n
 */
export const formatWhatsAppMessage = (text: string): string => {
    return text
        .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/~([^~]+)~/g, '<del>$1</del>')
        .replace(/\n/g, '<br>');
};

/**
 * Calcula tempo até o próximo disparo
 */
export const calculateTimeUntil = (scheduledTime: string, now: Date = new Date()): {
    display: string;
    ms: number
} => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    // Se já passou hoje, considera amanhã
    if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
    }

    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    let display: string;
    if (diffMins < 60) {
        display = `Em ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        display = `Em ${diffHours}h ${remainingMins}min`;
    } else {
        const days = Math.floor(diffHours / 24);
        display = `Em ${days} dia${days !== 1 ? 's' : ''}`;
    }

    return { display, ms: diffMs };
};

/**
 * Formata horário para exibição
 */
export const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
};

/**
 * Formata número de telefone para exibição
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');

    // Formato brasileiro: +55 47 99999-9999
    if (numbers.length === 13) {
        return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }
    if (numbers.length === 11) {
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    return phone;
};

/**
 * Constantes
 */
export const MAX_MESSAGE_LENGTH = 4096; // Limite WhatsApp
export { DAY_NAMES, DAY_NAMES_FULL };
