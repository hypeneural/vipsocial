import type { EventCollaborator, EventEquipmentItem, ExternalEvent, VipGalleryStatus } from "@/types/externas";

export const EXTERNAS_TIME_ZONE = "America/Sao_Paulo";

type DateParts = {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
};

const LOCAL_DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const EXPLICIT_TIMEZONE_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: EXTERNAS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
});

const vipGalleryStatusText: Record<VipGalleryStatus, string> = {
    draft: "Rascunho",
    active: "Ativa",
    paused: "Pausada",
    archived: "Arquivada",
};

const pad2 = (value: string | number): string => String(value).padStart(2, "0");

const partsFromDate = (date: Date): DateParts | null => {
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const mapped = dateTimeFormatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") {
            acc[part.type] = part.value;
        }

        return acc;
    }, {});

    return {
        year: mapped.year,
        month: mapped.month,
        day: mapped.day,
        hour: mapped.hour === "24" ? "00" : mapped.hour,
        minute: mapped.minute,
        second: mapped.second,
    };
};

const partsFromLocalString = (value: string): DateParts | null => {
    const match = value.trim().match(LOCAL_DATE_TIME_RE);

    if (!match) {
        return null;
    }

    return {
        year: match[1],
        month: match[2],
        day: match[3],
        hour: pad2(match[4] ?? "00"),
        minute: pad2(match[5] ?? "00"),
        second: pad2(match[6] ?? "00"),
    };
};

export const toSaoPauloDateParts = (value?: string | Date | null): DateParts | null => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return partsFromDate(value);
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    if (!EXPLICIT_TIMEZONE_RE.test(normalized)) {
        return partsFromLocalString(normalized) ?? partsFromDate(new Date(normalized));
    }

    return partsFromDate(new Date(normalized));
};

const sameDate = (left: DateParts, right: DateParts): boolean =>
    left.year === right.year && left.month === right.month && left.day === right.day;

const calendarDateForParts = (parts: DateParts): Date =>
    new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 15, 0, 0));

const formatWeekday = (parts: DateParts): string =>
    new Intl.DateTimeFormat("pt-BR", {
        timeZone: EXTERNAS_TIME_ZONE,
        weekday: "long",
    }).format(calendarDateForParts(parts));

const formatLongDate = (parts: DateParts): string =>
    new Intl.DateTimeFormat("pt-BR", {
        timeZone: EXTERNAS_TIME_ZONE,
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(calendarDateForParts(parts));

const formatShortDate = (parts: DateParts): string =>
    new Intl.DateTimeFormat("pt-BR", {
        timeZone: EXTERNAS_TIME_ZONE,
        weekday: "short",
        day: "2-digit",
        month: "short",
    }).format(calendarDateForParts(parts));

const formatShortDayMonth = (parts: DateParts): string =>
    new Intl.DateTimeFormat("pt-BR", {
        timeZone: EXTERNAS_TIME_ZONE,
        day: "2-digit",
        month: "short",
    }).format(calendarDateForParts(parts));

const formatTime = (parts: DateParts): string => `${parts.hour}:${parts.minute}`;

export const toEventDateOnly = (value?: string | Date | null): string => {
    const parts = toSaoPauloDateParts(value);

    return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
};

export const toEventDateTimeLocalInput = (value?: string | Date | null): string => {
    const parts = toSaoPauloDateParts(value);

    return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : "";
};

export const formatGoogleCalendarDate = (value: string | Date): string => {
    const parts = toSaoPauloDateParts(value);

    if (!parts) {
        return "";
    }

    return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
};

export const formatEventDateRange = (start: string, end?: string | null): string => {
    const startParts = toSaoPauloDateParts(start);

    if (!startParts) {
        return "";
    }

    let result = `${formatWeekday(startParts)}, ${formatLongDate(startParts)} as ${formatTime(startParts)}`;

    if (end) {
        const endParts = toSaoPauloDateParts(end);

        if (endParts) {
            result += sameDate(startParts, endParts)
                ? ` ate ${formatTime(endParts)}`
                : ` ate ${formatWeekday(endParts)}, ${formatLongDate(endParts)} as ${formatTime(endParts)}`;
        }
    }

    return result;
};

export const formatShortEventDateRange = (start: string, end?: string | null): string => {
    const startParts = toSaoPauloDateParts(start);

    if (!startParts) {
        return "";
    }

    let result = `${formatShortDate(startParts)} ${formatTime(startParts)}`;

    if (end) {
        const endParts = toSaoPauloDateParts(end);

        if (endParts) {
            result += sameDate(startParts, endParts)
                ? `-${formatTime(endParts)}`
                : ` -> ${formatShortDayMonth(endParts)} ${formatTime(endParts)}`;
        }
    }

    return result;
};

export const formatEventDateTime = (value?: string | null): string => {
    const parts = toSaoPauloDateParts(value);

    if (!parts) {
        return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: EXTERNAS_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(calendarDateForParts(parts)) + ` ${formatTime(parts)}`;
};

export const getEventEndDate = (event: Pick<ExternalEvent, "data_hora" | "data_hora_fim">): Date => {
    if (event.data_hora_fim) {
        return new Date(event.data_hora_fim);
    }

    return new Date(new Date(event.data_hora).getTime() + 2 * 60 * 60 * 1000);
};

export const isEventTodayInSaoPaulo = (value: string): boolean => {
    const today = toEventDateOnly(new Date());

    return toEventDateOnly(value) === today;
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
        sections.push(`Briefing\n${event.briefing.trim()}`);
    }

    sections.push(
        `Colaboradores\n${collaborators.length > 0 ? collaborators.join("\n") : "- Nenhum colaborador vinculado"}`,
        `Equipamentos\n${equipment.length > 0 ? equipment.join("\n") : "- Nenhum equipamento vinculado"}`,
    );

    if (event.contato_nome?.trim() || event.contato_whatsapp?.trim()) {
        const contactLines = [
            event.contato_nome?.trim() ? `- Nome: ${event.contato_nome.trim()}` : null,
            event.contato_whatsapp?.trim() ? `- WhatsApp: ${event.contato_whatsapp.trim()}` : null,
        ].filter((line): line is string => line !== null);

        sections.push(`Contato do cliente\n${contactLines.join("\n")}`);
    }

    if (event.observacao_interna?.trim()) {
        sections.push(`Observacoes internas\n${event.observacao_interna.trim()}`);
    }

    if (event.is_vip_gallery) {
        const vipLines = [
            `- Status: ${vipGalleryStatusText[event.vip_gallery_status || "draft"]}`,
            event.gallery_slug?.trim() ? `- Galeria: https://www.coberturavip.com.br/${event.gallery_slug.trim()}` : null,
            event.allow_delete_command ? `- Delete command: ${event.delete_command_keyword || "Ativo"}` : null,
            event.allow_pause_command ? `- Pause command: ${event.pause_command_keyword || "Ativo"}` : null,
        ].filter((line): line is string => line !== null);

        sections.push(`Cobertura VIP\n${vipLines.join("\n")}`);
    }

    return sections.join("\n\n");
};

export const buildExternalEventGoogleCalendarUrl = (event: ExternalEvent): string => {
    const startDate = formatGoogleCalendarDate(event.data_hora);
    const endDate = event.data_hora_fim
        ? formatGoogleCalendarDate(event.data_hora_fim)
        : formatGoogleCalendarDate(new Date(new Date(event.data_hora).getTime() + 2 * 60 * 60 * 1000));
    const categoryName = (event.category?.name?.trim() || "Evento").toUpperCase();

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `${categoryName} | ${event.titulo}`,
        dates: `${startDate}/${endDate}`,
        ctz: EXTERNAS_TIME_ZONE,
        details: buildGoogleCalendarDetails(event),
        location: event.endereco_completo || event.local,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
