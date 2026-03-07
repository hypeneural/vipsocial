export interface Destination {
    destination_id: number;
    phone_number: string;
    name: string;
    tags: string[];
    active: boolean;
    target_kind?: "whatsapp_phone" | "whatsapp_group";
    target_value?: string;
    archived_at?: string | null;
    last_sent_at?: string | null;
    alert_count?: number;
    created_at: string;
    updated_at: string;
}

export interface AlertScheduleRule {
    schedule_id: number;
    schedule_type: "weekly" | "specific_date";
    day_of_week: number | null;
    specific_date: string | null;
    time_hhmm: string;
    rule_key?: string;
    active: boolean;
    schedule_active?: boolean;
    next_fire_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AlertSchedule {
    days_of_week: string | null;
    times: string[];
    specific_date: string | null;
    schedule_active: boolean;
}

export interface AlertMonitoring {
    state:
        | "no_schedule"
        | "no_active_destinations"
        | "upcoming"
        | "pending"
        | "delayed"
        | "missed"
        | "success"
        | "sent_late"
        | "partial"
        | "failed"
        | "unknown";
    label: string;
    next_fire_at: string | null;
    scheduled_for: string | null;
    delay_minutes: number;
    last_run_status:
        | "pending"
        | "processing"
        | "partial"
        | "success"
        | "failed"
        | "cancelled"
        | null;
    last_run_created_at: string | null;
    last_run_finished_at: string | null;
}

export interface Alert {
    alert_id: number;
    title: string;
    message: string;
    active: boolean;
    archived_at?: string | null;
    destination_count: number;
    next_fire_at?: string | null;
    monitoring: AlertMonitoring;
    destinations: Destination[];
    schedule_rules: AlertScheduleRule[];
    schedules: AlertSchedule[];
    created_at: string;
    updated_at: string;
}

export interface AlertDispatchRun {
    dispatch_run_id: string;
    alert_id: number;
    alert_title?: string | null;
    trigger_type: "scheduler" | "manual" | "retry";
    status: "pending" | "processing" | "partial" | "success" | "failed" | "cancelled";
    scheduled_for: string | null;
    destinations_total: number;
    destinations_success: number;
    destinations_failed: number;
    started_at: string | null;
    finished_at: string | null;
    created_at: string | null;
}

export interface AlertLog {
    log_id: string;
    dispatch_run_id?: string;
    alert_id: number;
    alert_title: string;
    destination_id: number;
    destination_name: string;
    status: "pending" | "success" | "failed" | "cancelled" | "skipped";
    target_kind: "whatsapp_phone" | "whatsapp_group";
    target_value: string;
    provider: string;
    sent_at: string | null;
    created_at: string;
    success: boolean;
    response_message_id: string | null;
    response_zaap_id?: string | null;
    response_id?: string | null;
    error_message: string | null;
}

export interface NextFiring {
    alert_id: number;
    alert_title: string;
    next_fire_at: string;
    scheduled_time: string;
    destination_count: number;
    time_until: string;
    time_until_ms: number;
}

export interface AlertsStats {
    total_destinations: number;
    active_destinations: number;
    total_alerts: number;
    active_alerts: number;
    overdue_alerts: number;
    next_firings_count: number;
    today_sent: number;
    today_failed: number;
    sent_last_7_days: number;
    failed_last_7_days: number;
}

export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
export const DAY_NAMES_FULL = [
    "Domingo",
    "Segunda",
    "Terca",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sabado",
];

export const decodeDaysOfWeek = (daysString: string): string[] => {
    if (!daysString) {
        return [];
    }

    return daysString.split("").reduce((acc, char, index) => {
        if (char === "1") {
            acc.push(DAY_NAMES[index]);
        }

        return acc;
    }, [] as string[]);
};

export const encodeDaysOfWeek = (days: string[]): string => {
    return DAY_NAMES.map((day) => (days.includes(day) ? "1" : "0")).join("");
};

export const formatDaysOfWeek = (daysString: string | null): string => {
    if (!daysString) {
        return "Data especifica";
    }

    const days = decodeDaysOfWeek(daysString);

    if (days.length === 0) return "Nenhum dia";
    if (days.length === 7) return "Todos os dias";
    if (daysString === "0111110") return "Seg a Sex";
    if (daysString === "1000001") return "Fim de semana";

    return days.join(", ");
};

export const formatWhatsAppMessage = (text: string): string => {
    return text
        .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(/~([^~]+)~/g, "<del>$1</del>")
        .replace(/\n/g, "<br>");
};

export const calculateTimeUntil = (
    scheduledTime: string,
    now: Date = new Date()
): { display: string; ms: number } => {
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
    }

    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    let display: string;
    if (diffMins < 60) {
        display = `Em ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
    } else if (diffHours < 24) {
        display = `Em ${diffHours}h ${remainingMins}min`;
    } else {
        const days = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        display = remainingHours > 0
            ? `Em ${days} dia${days !== 1 ? "s" : ""} e ${remainingHours}h`
            : `Em ${days} dia${days !== 1 ? "s" : ""}`;
    }

    return { display, ms: diffMs };
};

export const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    return `${hours}h${minutes}`;
};

export const formatPhoneNumber = (phone: string): string => {
    if (phone.includes("-group") || /^\d+-\d+$/.test(phone)) {
        return phone;
    }

    const numbers = phone.replace(/\D/g, "");

    if (numbers.length === 13) {
        return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }

    if (numbers.length === 11) {
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    return phone;
};

export const formatScheduleRuleLabel = (rule: AlertScheduleRule): string => {
    const timeLabel = formatTime(rule.time_hhmm);

    if (rule.schedule_type === "specific_date" && rule.specific_date) {
        const [year, month, day] = rule.specific_date.split("-");
        return `${day}/${month}/${year} - ${timeLabel}`;
    }

    const dayName = DAY_NAMES_FULL[rule.day_of_week ?? 0] ?? "Dia";
    return `${dayName} - ${timeLabel}`;
};

export const formatLogStatusLabel = (status: AlertLog["status"]): string => {
    switch (status) {
        case "success":
            return "Sucesso";
        case "failed":
            return "Falha";
        case "pending":
            return "Pendente";
        case "cancelled":
            return "Cancelado";
        case "skipped":
            return "Ignorado";
        default:
            return status;
    }
};

export const getAlertMonitoringTone = (state: AlertMonitoring["state"]): string => {
    switch (state) {
        case "missed":
        case "delayed":
        case "failed":
            return "bg-destructive/10 text-destructive border-destructive/20";
        case "sent_late":
        case "partial":
        case "pending":
            return "bg-warning/10 text-warning border-warning/20";
        case "no_active_destinations":
            return "bg-muted text-muted-foreground border-border/50";
        case "success":
        case "upcoming":
            return "bg-success/10 text-success border-success/20";
        default:
            return "bg-muted/50 text-muted-foreground border-border/50";
    }
};

export const MAX_MESSAGE_LENGTH = 4096;
