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
    const isFuture = diffMs < 0;
    const absMinutes = Math.abs(diffMinutes);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);

    if (Math.abs(diffMinutes) < 1) return "agora";
    if (isFuture && absMinutes < 60) return `em ${absMinutes} min`;
    if (!isFuture && diffMinutes < 60) return `ha ${diffMinutes} min`;
    if (isFuture && absHours < 24) return `em ${absHours}h`;
    if (!isFuture && diffHours < 24) return `ha ${diffHours}h`;
    if (isFuture && absDays === 1) return "amanha";
    if (!isFuture && diffDays === 1) return "ontem";
    return isFuture ? `em ${absDays} dias` : `ha ${diffDays} dias`;
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
    const diffMs = Date.now() - publishedAt;
    return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 6;
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

export function formatAiStrategy(strategy?: string | null): string {
    if (strategy === "structured_outputs") return "Schema";
    if (strategy === "prompt_json") return "JSON por prompt";
    return strategy || "nao informado";
}

export function formatAiCategory(category?: string | null): string {
    if (category === "unsupported_parameters") return "Parametros nao suportados";
    if (category === "model_unavailable") return "Modelo indisponivel";
    if (category === "provider_unavailable") return "Provider indisponivel";
    if (category === "rate_limited") return "Rate limit";
    if (category === "transport") return "Transporte";
    if (category === "timeout") return "Timeout";
    if (category === "invalid_json") return "JSON invalido";
    if (category === "invalid_response_shape") return "Schema invalido";
    if (category === "empty_response") return "Resposta vazia";
    if (category === "request_invalid") return "Payload invalido";
    if (category === "auth") return "Autenticacao";
    return category || "nao informado";
}

export function formatAiHealthStatus(status?: string | null): string {
    if (status === "healthy") return "Saudavel";
    if (status === "recovering") return "Recuperando";
    if (status === "unstable") return "Instavel";
    if (status === "critical") return "Critico";
    return status || "nao informado";
}

export function formatAiNextAction(action?: string | null): string {
    if (action === "fallback_next_model") return "Trocar para o proximo modelo";
    if (action === "retry_same_model_prompt_json") return "Repetir no mesmo modelo via JSON por prompt";
    if (action === "queue_retry") return "Tentar novamente na fila";
    if (action === "fail_terminal") return "Falha terminal";
    return action || "nao informado";
}

export function formatAiProviderStatus(status?: string | number | null): string {
    if (status === null || status === undefined || status === "" || status === "sem_status") {
        return "Sem status";
    }

    if (typeof status === "number") {
        return `HTTP ${status}`;
    }

    const normalized = String(status).trim();
    if (!normalized) return "Sem status";
    if (/^\d+$/.test(normalized)) return `HTTP ${normalized}`;
    return normalized;
}

export function getLatestFailedAiLog(item?: NewsItem | null) {
    return item?.ai_logs?.find((log) => log.status === "failed") ?? null;
}
