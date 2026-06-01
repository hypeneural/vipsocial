import { api } from "@/services/api";
import type { ApiResponse, PaginatedResponse } from "@/services/types";
import type {
    FestaDivinoAtracao,
    FestaDivinoAtracaoPayload,
    FestaDivinoAuditLog,
    FestaDivinoBrinquedo,
    FestaDivinoBrinquedoPayload,
    FestaDivinoCardapioCategoria,
    FestaDivinoCardapioCategoriaPayload,
    FestaDivinoCategoriaEvento,
    FestaDivinoCategoriaEventoPayload,
    FestaDivinoDashboard,
    FestaDivinoDiaFesta,
    FestaDivinoDiaFestaPayload,
    FestaDivinoEdition,
    FestaDivinoEditionPayload,
    FestaDivinoEvento,
    FestaDivinoEventoPayload,
    FestaDivinoFaqCategory,
    FestaDivinoFaqCategoryPayload,
    FestaDivinoFaqItem,
    FestaDivinoFaqItemPayload,
    FestaDivinoHealth,
    FestaDivinoListParams,
    FestaDivinoLocal,
    FestaDivinoLocalPayload,
    FestaDivinoNoticia,
    FestaDivinoNoticiaPayload,
    FestaDivinoProduto,
    FestaDivinoProdutoPayload,
    FestaDivinoReorderPayload,
    FestaDivinoStatusPayload,
    FestaDivinoTexto,
    FestaDivinoTextoPayload,
    FestaDivinoVideo,
    FestaDivinoVideoPayload,
} from "../types";
import { buildFestaDivinoParams } from "../utils/festaDivinoFormatters";
import {
    festaDivinoMappers,
    mapFestaDivinoApiArrayResponse,
    mapFestaDivinoApiResponse,
    mapFestaDivinoPaginatedResponse,
} from "../utils/festaDivinoMappers";

const ENDPOINT = "/festa-divino";

const getList = async <T>(
    path: string,
    params: FestaDivinoListParams | undefined,
    mapper: (value: unknown) => T
): Promise<PaginatedResponse<T>> => {
    const { data } = await api.get<PaginatedResponse<unknown>>(`${ENDPOINT}${path}`, {
        params: buildFestaDivinoParams(params),
    });

    return mapFestaDivinoPaginatedResponse(data, mapper);
};

export const festaDivinoService = {
    async getDashboard(): Promise<ApiResponse<FestaDivinoDashboard>> {
        const { data } = await api.get<ApiResponse<unknown>>(`${ENDPOINT}/dashboard`);

        return mapFestaDivinoApiResponse(data, festaDivinoMappers.dashboard);
    },

    async getHealth(): Promise<ApiResponse<FestaDivinoHealth>> {
        const { data } = await api.get<ApiResponse<unknown>>(`${ENDPOINT}/health`);

        return mapFestaDivinoApiResponse(data, festaDivinoMappers.health);
    },

    auditLogs: (params?: FestaDivinoListParams) => getList("/audit-logs", params, festaDivinoMappers.auditLog),

    edicoes: Object.assign(
        (params?: FestaDivinoListParams) => getList("/edicoes", params, festaDivinoMappers.edicao),
        {
            criar: async (payload: FestaDivinoEditionPayload) => {
                const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/edicoes`, payload);

                return mapFestaDivinoApiResponse(data, festaDivinoMappers.edicao);
            },
            atualizar: async (id: number, payload: FestaDivinoEditionPayload) => {
                const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/edicoes/${id}`, payload);

                return mapFestaDivinoApiResponse(data, festaDivinoMappers.edicao);
            },
            remover: async (id: number) => {
                const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/edicoes/${id}`);

                return data;
            },
        }
    ),

    programacao: {
        dias: (params?: FestaDivinoListParams) =>
            getList("/programacao/dias", params, festaDivinoMappers.diaFesta),
        criarDia: async (payload: FestaDivinoDiaFestaPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/programacao/dias`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.diaFesta);
        },
        atualizarDia: async (id: number, payload: FestaDivinoDiaFestaPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/programacao/dias/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.diaFesta);
        },
        removerDia: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/dias/${id}`);

            return data;
        },
        eventos: (params?: FestaDivinoListParams) =>
            getList("/programacao/eventos", params, festaDivinoMappers.evento),
        criarEvento: async (payload: FestaDivinoEventoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/programacao/eventos`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.evento);
        },
        atualizarEvento: async (id: number, payload: FestaDivinoEventoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/programacao/eventos/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.evento);
        },
        atualizarStatusEvento: async (id: number, payload: Pick<FestaDivinoEventoPayload, "ativo" | "destaque">) => {
            const { data } = await api.patch<ApiResponse<unknown>>(
                `${ENDPOINT}/programacao/eventos/${id}/status`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.evento);
        },
        removerEvento: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/eventos/${id}`);

            return data;
        },
        categorias: (params?: FestaDivinoListParams) =>
            getList("/programacao/categorias", params, festaDivinoMappers.categoriaEvento),
        criarCategoria: async (payload: FestaDivinoCategoriaEventoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(
                `${ENDPOINT}/programacao/categorias`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.categoriaEvento);
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoCategoriaEventoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(
                `${ENDPOINT}/programacao/categorias/${id}`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.categoriaEvento);
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/categorias/${id}`);

            return data;
        },
        locais: (params?: FestaDivinoListParams) =>
            getList("/programacao/locais", params, festaDivinoMappers.local),
        criarLocal: async (payload: FestaDivinoLocalPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/programacao/locais`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.local);
        },
        atualizarLocal: async (id: number, payload: FestaDivinoLocalPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/programacao/locais/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.local);
        },
        removerLocal: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/locais/${id}`);

            return data;
        },
        atracoes: (params?: FestaDivinoListParams) =>
            getList("/programacao/atracoes", params, festaDivinoMappers.atracao),
        criarAtracao: async (payload: FestaDivinoAtracaoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(
                `${ENDPOINT}/programacao/atracoes`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.atracao);
        },
        atualizarAtracao: async (id: number, payload: FestaDivinoAtracaoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(
                `${ENDPOINT}/programacao/atracoes/${id}`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.atracao);
        },
        removerAtracao: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/atracoes/${id}`);

            return data;
        },
    },

    cardapio: {
        categorias: (params?: FestaDivinoListParams) =>
            getList("/cardapio/categorias", params, festaDivinoMappers.cardapioCategoria),
        criarCategoria: async (payload: FestaDivinoCardapioCategoriaPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(
                `${ENDPOINT}/cardapio/categorias`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.cardapioCategoria);
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoCardapioCategoriaPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(
                `${ENDPOINT}/cardapio/categorias/${id}`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.cardapioCategoria);
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/cardapio/categorias/${id}`);

            return data;
        },
        produtos: (params?: FestaDivinoListParams) =>
            getList("/cardapio/produtos", params, festaDivinoMappers.produto),
        criarProduto: async (payload: FestaDivinoProdutoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/cardapio/produtos`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.produto);
        },
        atualizarProduto: async (id: number, payload: FestaDivinoProdutoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/cardapio/produtos/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.produto);
        },
        removerProduto: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/cardapio/produtos/${id}`);

            return data;
        },
    },

    conteudo: {
        noticias: (params?: FestaDivinoListParams) =>
            getList("/conteudo/noticias", params, festaDivinoMappers.noticia),
        criarNoticia: async (payload: FestaDivinoNoticiaPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/conteudo/noticias`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.noticia);
        },
        atualizarNoticia: async (id: number, payload: FestaDivinoNoticiaPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/conteudo/noticias/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.noticia);
        },
        removerNoticia: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/conteudo/noticias/${id}`);

            return data;
        },
        textos: (params?: FestaDivinoListParams) => getList("/conteudo/textos", params, festaDivinoMappers.texto),
        criarTexto: async (payload: FestaDivinoTextoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/conteudo/textos`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.texto);
        },
        atualizarTexto: async (id: number, payload: FestaDivinoTextoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/conteudo/textos/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.texto);
        },
        removerTexto: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/conteudo/textos/${id}`);

            return data;
        },
    },

    midia: {
        videos: (params?: FestaDivinoListParams) => getList("/midia/videos", params, festaDivinoMappers.video),
        criarVideo: async (payload: FestaDivinoVideoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/midia/videos`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.video);
        },
        atualizarVideo: async (id: string, payload: FestaDivinoVideoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/midia/videos/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.video);
        },
        removerVideo: async (id: string) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/midia/videos/${id}`);

            return data;
        },
        shorts: (params?: FestaDivinoListParams) => getList("/midia/shorts", params, festaDivinoMappers.video),
        criarShort: async (payload: FestaDivinoVideoPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/midia/shorts`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.video);
        },
        atualizarShort: async (id: string, payload: FestaDivinoVideoPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/midia/shorts/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.video);
        },
        removerShort: async (id: string) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/midia/shorts/${id}`);

            return data;
        },
    },

    faq: {
        categorias: (params?: FestaDivinoListParams) =>
            getList("/faq/categorias", params, festaDivinoMappers.faqCategory),
        criarCategoria: async (payload: FestaDivinoFaqCategoryPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/faq/categorias`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqCategory);
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoFaqCategoryPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/faq/categorias/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqCategory);
        },
        atualizarStatusCategoria: async (id: number, payload: FestaDivinoStatusPayload) => {
            const { data } = await api.patch<ApiResponse<unknown>>(
                `${ENDPOINT}/faq/categorias/${id}/status`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqCategory);
        },
        reordenarCategorias: async (payload: FestaDivinoReorderPayload) => {
            const { data } = await api.patch<ApiResponse<unknown>>(
                `${ENDPOINT}/faq/categorias/reorder`,
                payload
            );

            return mapFestaDivinoApiArrayResponse(data, festaDivinoMappers.faqCategory);
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/faq/categorias/${id}`);

            return data;
        },
        items: (params?: FestaDivinoListParams) => getList("/faq/items", params, festaDivinoMappers.faqItem),
        criarItem: async (payload: FestaDivinoFaqItemPayload) => {
            const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/faq/items`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqItem);
        },
        atualizarItem: async (id: number, payload: FestaDivinoFaqItemPayload) => {
            const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/faq/items/${id}`, payload);

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqItem);
        },
        atualizarStatusItem: async (id: number, payload: FestaDivinoStatusPayload) => {
            const { data } = await api.patch<ApiResponse<unknown>>(
                `${ENDPOINT}/faq/items/${id}/status`,
                payload
            );

            return mapFestaDivinoApiResponse(data, festaDivinoMappers.faqItem);
        },
        reordenarItems: async (payload: FestaDivinoReorderPayload) => {
            const { data } = await api.patch<ApiResponse<unknown>>(`${ENDPOINT}/faq/items/reorder`, payload);

            return mapFestaDivinoApiArrayResponse(data, festaDivinoMappers.faqItem);
        },
        removerItem: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/faq/items/${id}`);

            return data;
        },
    },

    brinquedos: Object.assign(
        (params?: FestaDivinoListParams) => getList("/brinquedos", params, festaDivinoMappers.brinquedo),
        {
            criar: async (payload: FestaDivinoBrinquedoPayload) => {
                const { data } = await api.post<ApiResponse<unknown>>(`${ENDPOINT}/brinquedos`, payload);

                return mapFestaDivinoApiResponse(data, festaDivinoMappers.brinquedo);
            },
            atualizar: async (id: number, payload: FestaDivinoBrinquedoPayload) => {
                const { data } = await api.put<ApiResponse<unknown>>(`${ENDPOINT}/brinquedos/${id}`, payload);

                return mapFestaDivinoApiResponse(data, festaDivinoMappers.brinquedo);
            },
            atualizarStatus: async (id: number, payload: FestaDivinoStatusPayload) => {
                const { data } = await api.patch<ApiResponse<unknown>>(
                    `${ENDPOINT}/brinquedos/${id}/status`,
                    payload
                );

                return mapFestaDivinoApiResponse(data, festaDivinoMappers.brinquedo);
            },
            remover: async (id: number) => {
                const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/brinquedos/${id}`);

                return data;
            },
        }
    ),
};
