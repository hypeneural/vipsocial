import type { FestaDivinoListParams } from "../types";

export function buildFestaDivinoParams(params: FestaDivinoListParams = {}): Record<string, string | number> {
    const query: Record<string, string | number> = {
        page: params.page ?? 1,
        per_page: params.perPage ?? 25,
    };

    if (params.search?.trim()) {
        query["filter[search]"] = params.search.trim();
    }

    if (params.sort) {
        query.sort = params.sort;
    }

    if (params.include?.length) {
        query.include = params.include.join(",");
    }

    Object.entries(params.filters ?? {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
            return;
        }

        query[`filter[${key}]`] = typeof value === "boolean" ? (value ? "1" : "0") : String(value);
    });

    return query;
}

export function formatFestaDivinoDate(value?: string | null): string {
    if (!value) return "Sem data";

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function formatFestaDivinoDateTime(value?: string | null): string {
    if (!value) return "Sem registro";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatFestaDivinoCurrency(value?: string | number | null): string {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatFestaDivinoTimeRange(start?: string | null, end?: string | null): string {
    const normalizedStart = start?.slice(0, 5);
    const normalizedEnd = end?.slice(0, 5);

    if (normalizedStart && normalizedEnd) return `${normalizedStart} - ${normalizedEnd}`;
    if (normalizedStart) return normalizedStart;

    return "Horario nao informado";
}

export function countActive<T extends { ativo?: boolean }>(items: T[]): number {
    return items.filter((item) => item.ativo !== false).length;
}

export function normalizeFestaDivinoAssetUrl(value?: string | null): string | null {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;

    return `https://festadodivinovip.com.br${value.startsWith("/") ? value : `/${value}`}`;
}
