import type { ApiResponse, PaginatedResponse } from "@/services/types";
import type {
    FestaDivinoAtracao,
    FestaDivinoAuditLog,
    FestaDivinoAuditUser,
    FestaDivinoBrinquedo,
    FestaDivinoCardapioCategoria,
    FestaDivinoCategoriaEvento,
    FestaDivinoDashboard,
    FestaDivinoDiaFesta,
    FestaDivinoEdition,
    FestaDivinoEvento,
    FestaDivinoFaqCategory,
    FestaDivinoFaqItem,
    FestaDivinoHealth,
    FestaDivinoLocal,
    FestaDivinoNoticia,
    FestaDivinoProduto,
    FestaDivinoTexto,
    FestaDivinoVideo,
} from "../types";

type ApiRecord = Record<string, unknown>;
type Mapper<T> = (value: unknown) => T;

const asRecord = (value: unknown): ApiRecord => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as ApiRecord;
    }

    return {};
};

const asArray = <T>(value: unknown, mapper: Mapper<T>): T[] => {
    if (!Array.isArray(value)) return [];

    return value.map(mapper);
};

const stringValue = (value: unknown, fallback = ""): string => {
    if (value === null || value === undefined) return fallback;

    return String(value);
};

const nullableString = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;

    return String(value);
};

const numberValue = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

const booleanValue = (value: unknown, fallback = false): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "sim", "ativo", "yes"].includes(normalized)) return true;
        if (["0", "false", "nao", "inativo", "no"].includes(normalized)) return false;
    }

    return fallback;
};

const stringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => stringValue(item)).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const optionalRecord = <T>(value: unknown, mapper: Mapper<T>): T | undefined => {
    if (!value) return undefined;

    return mapper(value);
};

const nullableRecord = <T>(value: unknown, mapper: Mapper<T>): T | null => {
    if (!value) return null;

    return mapper(value);
};

export const mapFestaDivinoEdition = (value: unknown): FestaDivinoEdition => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        ano: numberValue(record.ano),
        titulo: stringValue(record.titulo),
        data_inicio_programacao: nullableString(record.data_inicio_programacao),
        data_fim_programacao: nullableString(record.data_fim_programacao),
        data_inicio_festejos: nullableString(record.data_inicio_festejos),
        data_fim_festejos: nullableString(record.data_fim_festejos),
        bandeireira_imperial: nullableString(record.bandeireira_imperial),
        comissao_organizadora: nullableString(record.comissao_organizadora),
        texto_convite_principal: nullableString(record.texto_convite_principal),
        tema_geral: nullableString(record.tema_geral),
        imagem_cartaz_url: nullableString(record.imagem_cartaz_url),
        eventos_count: numberValue(record.eventos_count),
        dias_count: numberValue(record.dias_count),
    };
};

export const mapFestaDivinoDiaFesta = (value: unknown): FestaDivinoDiaFesta => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        edicao_id: numberValue(record.edicao_id),
        data_evento: nullableString(record.data_evento),
        nome: stringValue(record.nome),
        descricao: nullableString(record.descricao),
        created_at: nullableString(record.created_at),
        updated_at: nullableString(record.updated_at),
        edicao: optionalRecord(record.edicao, mapFestaDivinoEdition),
    };
};

export const mapFestaDivinoCategoriaEvento = (value: unknown): FestaDivinoCategoriaEvento => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        descricao: nullableString(record.descricao),
        icone: nullableString(record.icone),
        cor: nullableString(record.cor),
        eventos_count: numberValue(record.eventos_count),
    };
};

export const mapFestaDivinoLocal = (value: unknown): FestaDivinoLocal => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        endereco: nullableString(record.endereco),
        latitude: nullableString(record.latitude),
        longitude: nullableString(record.longitude),
        descricao: nullableString(record.descricao),
        imagem_url: nullableString(record.imagem_url),
        acessibilidade: nullableString(record.acessibilidade),
        eventos_count: numberValue(record.eventos_count),
    };
};

export const mapFestaDivinoAtracao = (value: unknown): FestaDivinoAtracao => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        tipo: nullableString(record.tipo),
        descricao: nullableString(record.descricao),
        imagem_url: nullableString(record.imagem_url),
        eventos_count: numberValue(record.eventos_count),
        papel_no_evento: nullableString(record.papel_no_evento),
        ordem_apresentacao: record.ordem_apresentacao === null ? null : numberValue(record.ordem_apresentacao),
    };
};

export const mapFestaDivinoEvento = (value: unknown): FestaDivinoEvento => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        edicao_id: numberValue(record.edicao_id),
        titulo: stringValue(record.titulo),
        subtitulo: nullableString(record.subtitulo),
        descricao: nullableString(record.descricao),
        data_evento: nullableString(record.data_evento),
        hora_inicio: nullableString(record.hora_inicio),
        hora_fim: nullableString(record.hora_fim),
        duracao_estimada_minutos:
            record.duracao_estimada_minutos === null ? null : numberValue(record.duracao_estimada_minutos),
        local_id: numberValue(record.local_id),
        categoria_id: numberValue(record.categoria_id),
        tema: nullableString(record.tema),
        publico_alvo: nullableString(record.publico_alvo),
        evento_pago: booleanValue(record.evento_pago),
        valor_ingresso: nullableString(record.valor_ingresso),
        link_ingresso: nullableString(record.link_ingresso),
        observacao_ingresso: nullableString(record.observacao_ingresso),
        destaque: booleanValue(record.destaque),
        imagem_destaque_url: nullableString(record.imagem_destaque_url),
        organizador_responsavel: nullableString(record.organizador_responsavel),
        tags: stringArray(record.tags),
        ativo: booleanValue(record.ativo, true),
        local: optionalRecord(record.local, mapFestaDivinoLocal),
        categoria: optionalRecord(record.categoria, mapFestaDivinoCategoriaEvento),
        atracoes: asArray(record.atracoes, mapFestaDivinoAtracao),
    };
};

export const mapFestaDivinoCardapioCategoria = (value: unknown): FestaDivinoCardapioCategoria => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        icone: nullableString(record.icone),
        produtos_count: numberValue(record.produtos_count),
    };
};

export const mapFestaDivinoProduto = (value: unknown): FestaDivinoProduto => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        preco: nullableString(record.preco) ?? "0",
        foto: nullableString(record.foto),
        categoria_id: numberValue(record.categoria_id),
        categoria: optionalRecord(record.categoria, mapFestaDivinoCardapioCategoria),
    };
};

export const mapFestaDivinoNoticia = (value: unknown): FestaDivinoNoticia => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        titulo: stringValue(record.titulo),
        linha_apoio: nullableString(record.linha_apoio),
        url: stringValue(record.url),
        data_hora_publicacao: nullableString(record.data_hora_publicacao),
        thumb_url: nullableString(record.thumb_url),
        data_cadastro: nullableString(record.data_cadastro),
    };
};

export const mapFestaDivinoTexto = (value: unknown): FestaDivinoTexto => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        texto_curto: stringValue(record.texto_curto),
        texto_detalhado: stringValue(record.texto_detalhado),
        categoria: stringValue(record.categoria),
        icone_categoria: nullableString(record.icone_categoria),
        criado_em: nullableString(record.criado_em),
        atualizado_em: nullableString(record.atualizado_em),
    };
};

export const mapFestaDivinoVideo = (value: unknown): FestaDivinoVideo => {
    const record = asRecord(value);

    return {
        id: stringValue(record.id),
        titulo: stringValue(record.titulo),
        descricao: nullableString(record.descricao),
        thumb_url: nullableString(record.thumb_url),
        watch_url: stringValue(record.watch_url),
        embed_url: stringValue(record.embed_url),
        created_at: nullableString(record.created_at),
        updated_at: nullableString(record.updated_at),
    };
};

export const mapFestaDivinoFaqCategory = (value: unknown): FestaDivinoFaqCategory => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        icone: nullableString(record.icone),
        ordem: numberValue(record.ordem),
        ativo: booleanValue(record.ativo, true),
        items_count: numberValue(record.items_count),
        created_at: nullableString(record.created_at),
        updated_at: nullableString(record.updated_at),
    };
};

export const mapFestaDivinoFaqItem = (value: unknown): FestaDivinoFaqItem => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        category_id: numberValue(record.category_id),
        pergunta: stringValue(record.pergunta),
        resposta: stringValue(record.resposta),
        ordem: numberValue(record.ordem),
        ativo: booleanValue(record.ativo, true),
        category: optionalRecord(record.category, mapFestaDivinoFaqCategory),
        created_at: nullableString(record.created_at),
        updated_at: nullableString(record.updated_at),
    };
};

export const mapFestaDivinoBrinquedo = (value: unknown): FestaDivinoBrinquedo => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        nome: stringValue(record.nome),
        descricao: stringValue(record.descricao),
        video: stringValue(record.video),
        thumb_url: stringValue(record.thumb_url),
        ativo: booleanValue(record.ativo, true),
        created_at: nullableString(record.created_at),
        updated_at: nullableString(record.updated_at),
    };
};

const mapAuditUser = (value: unknown): FestaDivinoAuditUser => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        name: nullableString(record.name),
        email: nullableString(record.email),
    };
};

export const mapFestaDivinoAuditLog = (value: unknown): FestaDivinoAuditLog => {
    const record = asRecord(value);

    return {
        id: numberValue(record.id),
        user_id: record.user_id === null ? null : numberValue(record.user_id),
        action: stringValue(record.action),
        entity_type: stringValue(record.entity_type),
        entity_id: nullableString(record.entity_id),
        old_values: asRecord(record.old_values),
        new_values: asRecord(record.new_values),
        remote_connection: stringValue(record.remote_connection),
        request_id: nullableString(record.request_id),
        ip_address: nullableString(record.ip_address),
        created_at: nullableString(record.created_at),
        user: nullableRecord(record.user, mapAuditUser),
    };
};

export const mapFestaDivinoDashboard = (value: unknown): FestaDivinoDashboard => {
    const record = asRecord(value);

    return {
        mode: record.mode === "write_enabled" ? "write_enabled" : "read_only",
        active_edition: nullableRecord(record.active_edition, mapFestaDivinoEdition),
        counts: Object.fromEntries(
            Object.entries(asRecord(record.counts)).map(([key, count]) => [key, numberValue(count)])
        ),
        alerts: Object.fromEntries(
            Object.entries(asRecord(record.alerts)).map(([key, alert]) => {
                const alertRecord = asRecord(alert);

                return [
                    key,
                    {
                        severity:
                            alertRecord.severity === "error" ||
                            alertRecord.severity === "warning" ||
                            alertRecord.severity === "info"
                                ? alertRecord.severity
                                : "ok",
                        count: numberValue(alertRecord.count),
                    },
                ];
            })
        ),
    };
};

export const mapFestaDivinoHealth = (value: unknown): FestaDivinoHealth => {
    const record = asRecord(value);
    const connections = asRecord(record.connections);
    const read = asRecord(connections.read);

    return {
        status: record.status === "degraded" ? "degraded" : "ok",
        mode: record.mode === "write_enabled" ? "write_enabled" : "read_only",
        connections: {
            read: {
                ok: booleanValue(read.ok),
                driver: nullableString(read.driver),
                version: nullableString(read.version),
                latency_ms: numberValue(read.latency_ms),
                error: nullableString(read.error) ?? undefined,
            },
        },
        tables: Object.fromEntries(
            Object.entries(asRecord(record.tables)).map(([table, tableValue]) => {
                const tableRecord = asRecord(tableValue);

                return [
                    table,
                    {
                        exists: booleanValue(tableRecord.exists),
                        count: tableRecord.count === null ? null : numberValue(tableRecord.count),
                    },
                ];
            })
        ),
    };
};

export const festaDivinoMappers = {
    atracao: mapFestaDivinoAtracao,
    auditLog: mapFestaDivinoAuditLog,
    brinquedo: mapFestaDivinoBrinquedo,
    cardapioCategoria: mapFestaDivinoCardapioCategoria,
    categoriaEvento: mapFestaDivinoCategoriaEvento,
    dashboard: mapFestaDivinoDashboard,
    diaFesta: mapFestaDivinoDiaFesta,
    edicao: mapFestaDivinoEdition,
    evento: mapFestaDivinoEvento,
    faqCategory: mapFestaDivinoFaqCategory,
    faqItem: mapFestaDivinoFaqItem,
    health: mapFestaDivinoHealth,
    local: mapFestaDivinoLocal,
    noticia: mapFestaDivinoNoticia,
    produto: mapFestaDivinoProduto,
    texto: mapFestaDivinoTexto,
    video: mapFestaDivinoVideo,
};

export const mapFestaDivinoPaginatedResponse = <T>(
    response: PaginatedResponse<unknown>,
    mapper: Mapper<T>
): PaginatedResponse<T> => ({
    ...response,
    data: asArray(response.data, mapper),
});

export const mapFestaDivinoApiResponse = <T>(response: ApiResponse<unknown>, mapper: Mapper<T>): ApiResponse<T> => ({
    ...response,
    data: mapper(response.data),
});

export const mapFestaDivinoApiArrayResponse = <T>(
    response: ApiResponse<unknown>,
    mapper: Mapper<T>
): ApiResponse<T[]> => ({
    ...response,
    data: asArray(response.data, mapper),
});
