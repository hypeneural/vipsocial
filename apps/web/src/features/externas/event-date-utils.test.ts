import { describe, expect, it } from "vitest";
import { generateGoogleCalendarUrl, type ExternalEvent } from "@/types/externas";
import {
    buildExternalEventGoogleCalendarUrl,
    formatEventDateRange,
    formatGoogleCalendarDate,
    toEventDateOnly,
    toEventDateTimeLocalInput,
} from "@/features/externas/event-date-utils";

const makeEvent = (overrides: Partial<ExternalEvent> = {}): ExternalEvent => ({
    id: 115,
    titulo: "Festa da Patroa Rancho Rural",
    category_id: 1,
    category: {
        id: 1,
        name: "Fotos",
        slug: "fotos",
        icon: "Camera",
        color: "bg-blue-500",
        sort_order: 0,
    },
    status_id: 1,
    data_hora: "2026-05-15T21:00:00.000000Z",
    data_hora_fim: "2026-05-15T23:59:00.000000Z",
    local: "Rancho Rural",
    endereco_completo: "Estrada Geral do Oliveira, Tijucas",
    is_vip_gallery: false,
    collaborators: [],
    equipment: [],
    created_at: "2026-05-14T12:00:00.000000Z",
    updated_at: "2026-05-14T12:00:00.000000Z",
    ...overrides,
});

describe("event-date-utils", () => {
    it("converts API UTC ISO datetimes to Sao Paulo datetime-local values", () => {
        expect(toEventDateTimeLocalInput("2026-05-15T21:00:00.000000Z")).toBe("2026-05-15T18:00");
        expect(toEventDateTimeLocalInput("2026-05-15T23:59:00.000000Z")).toBe("2026-05-15T20:59");
    });

    it("keeps local datetime-local values unchanged", () => {
        expect(toEventDateTimeLocalInput("2026-05-15T18:00")).toBe("2026-05-15T18:00");
        expect(toEventDateOnly("2026-05-15T18:00")).toBe("2026-05-15");
    });

    it("formats Google Calendar dates as Sao Paulo wall-clock time", () => {
        expect(formatGoogleCalendarDate("2026-05-15T21:00:00.000000Z")).toBe("20260515T180000");
        expect(formatGoogleCalendarDate("2026-05-15T23:59:00.000000Z")).toBe("20260515T205900");
    });

    it("generates Google Calendar URLs without adding three hours", () => {
        const url = new URL(buildExternalEventGoogleCalendarUrl(makeEvent()));
        const appUrl = new URL(generateGoogleCalendarUrl(makeEvent()));

        expect(url.searchParams.get("ctz")).toBe("America/Sao_Paulo");
        expect(url.searchParams.get("dates")).toBe("20260515T180000/20260515T205900");
        expect(appUrl.searchParams.get("dates")).toBe("20260515T180000/20260515T205900");
    });

    it("formats event ranges in Sao Paulo independently from browser timezone", () => {
        expect(
            formatEventDateRange("2026-05-15T21:00:00.000000Z", "2026-05-15T23:59:00.000000Z"),
        ).toContain("18:00 ate 20:59");
    });
});
