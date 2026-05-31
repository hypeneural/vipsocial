import type { FestaDivinoListParams } from "../types";

export const festaDivinoKeys = {
    all: ["festa-divino"] as const,
    dashboard: () => [...festaDivinoKeys.all, "dashboard"] as const,
    health: () => [...festaDivinoKeys.all, "health"] as const,
    audit: (params: FestaDivinoListParams = {}) => [...festaDivinoKeys.all, "audit", params] as const,
    edicoes: (params: FestaDivinoListParams = {}) => [...festaDivinoKeys.all, "edicoes", params] as const,
    programacao: {
        dias: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "programacao", "dias", params] as const,
        eventos: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "programacao", "eventos", params] as const,
        categorias: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "programacao", "categorias", params] as const,
        locais: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "programacao", "locais", params] as const,
        atracoes: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "programacao", "atracoes", params] as const,
    },
    cardapio: {
        categorias: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "cardapio", "categorias", params] as const,
        produtos: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "cardapio", "produtos", params] as const,
    },
    conteudo: {
        noticias: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "conteudo", "noticias", params] as const,
        textos: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "conteudo", "textos", params] as const,
    },
    midia: {
        videos: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "midia", "videos", params] as const,
        shorts: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "midia", "shorts", params] as const,
    },
    faq: {
        categorias: (params: FestaDivinoListParams = {}) =>
            [...festaDivinoKeys.all, "faq", "categorias", params] as const,
        items: (params: FestaDivinoListParams = {}) => [...festaDivinoKeys.all, "faq", "items", params] as const,
    },
    brinquedos: (params: FestaDivinoListParams = {}) => [...festaDivinoKeys.all, "brinquedos", params] as const,
};
