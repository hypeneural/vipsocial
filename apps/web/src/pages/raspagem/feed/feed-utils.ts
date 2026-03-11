import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NewsItem } from "@/services/newsRadar.service";

export type FeedView = "all" | "duplicates" | "high" | "recent";

export const HIGH_RELEVANCE_SCORE = 0.7;

export const extractionLabels: Record<string, string> = {
    pending: "Pendente",
    extracted: "Extraida",
    extraction_failed: "Falhou",
};

export const enrichmentLabels: Record<string, string> = {
    none: "Sem IA",
    enriched_l1: "IA L1",
    enriched_l2: "IA L2",
    enrichment_failed: "IA falhou",
};

export const urgencyLabels: Record<string, string> = {
    baixa: "Baixa",
    media: "Media",
    alta: "Alta",
};

export const aiFactLabels = {
    who: "Quem",
    what: "O que",
    where: "Onde",
    when: "Quando",
    why: "Por que",
    how: "Como",
} as const;

export const listingAiFactKeys = ["who", "what", "where"] as const;

export type AiFactKey = keyof typeof aiFactLabels;

export interface AiFact {
    key: AiFactKey;
    label: string;
    value: string;
}

export function formatRelativeTime(dateString?: string | null): string {
    if (!dateString) return "sem data";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "sem data";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "agora";
    if (diffMinutes < 60) return `ha ${diffMinutes} min`;
    if (diffHours < 24) return `ha ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    return `ha ${diffDays} dias`;
}

export function formatDateTime(dateString?: string | null): string {
    if (!dateString) return "Sem data";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Sem data";

    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function getHostname(url?: string | null): string {
    if (!url) return "sem host";

    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
}

export function getSummary(item: NewsItem): string {
    if (item.excerpt?.trim()) return item.excerpt.trim();
    if (item.body_text?.trim()) return item.body_text.trim().slice(0, 260);
    if (item.subtitle?.trim()) return item.subtitle.trim();
    return "Sem resumo disponivel.";
}

export function isRecentItem(item: NewsItem): boolean {
    if (!item.published_at_utc) return false;
    const publishedAt = new Date(item.published_at_utc).getTime();
    if (Number.isNaN(publishedAt)) return false;
    return Date.now() - publishedAt <= 1000 * 60 * 60 * 6;
}

function normalizeAiValue(value: unknown): string | null {
    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
    }

    if (Array.isArray(value)) {
        const normalized = value
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean)
            .join(", ");

        return normalized || null;
    }

    return null;
}

export function getAiFacts(
    item?: NewsItem | null,
    keys: readonly AiFactKey[] = Object.keys(aiFactLabels) as AiFactKey[],
): AiFact[] {
    const fiveWs = item?.ai_metadata?.five_ws;
    if (!fiveWs) return [];

    return keys
        .map((key) => {
            const value = normalizeAiValue(fiveWs[key]);
            if (!value) return null;

            return {
                key,
                label: aiFactLabels[key],
                value,
            };
        })
        .filter((fact): fact is AiFact => Boolean(fact));
}

export function getCaptureBadgeLabel(percentage: number): string {
    return `Captura ${percentage}%`;
}

export function getCaptureQualityLabel(percentage: number): string {
    if (percentage >= 90) return "Alta";
    if (percentage >= 70) return "Boa";
    return "Parcial";
}

export function formatAiStage(stage?: string | null): string {
    if (stage === "classification") return "Classificacao";
    if (stage === "editorial") return "Editorial";
    return stage || "IA";
}

export function getLatestFailedAiLog(item?: NewsItem | null) {
    return item?.ai_logs?.find((log) => log.status === "failed") ?? null;
}
