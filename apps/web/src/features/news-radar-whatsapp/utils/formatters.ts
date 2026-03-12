export function formatWhatsAppDateTime(value?: string | null) {
    if (!value) {
        return "Sem horario";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
}

export function formatWhatsAppTime(value?: string | null) {
    if (!value) {
        return "--:--";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
}

export function getInitials(value?: string | null) {
    const cleaned = (value ?? "").trim();

    if (!cleaned) {
        return "WA";
    }

    const parts = cleaned.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function truncateText(value?: string | null, maxLength = 96) {
    if (!value) {
        return "";
    }

    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
}

export function compareTimelineEventsAsc(
    left?: { sent_at?: string | null; id: number },
    right?: { sent_at?: string | null; id: number },
) {
    const leftTime = left?.sent_at ? new Date(left.sent_at).getTime() : 0;
    const rightTime = right?.sent_at ? new Date(right.sent_at).getTime() : 0;

    if (leftTime !== rightTime) {
        return leftTime - rightTime;
    }

    return (left?.id ?? 0) - (right?.id ?? 0);
}
