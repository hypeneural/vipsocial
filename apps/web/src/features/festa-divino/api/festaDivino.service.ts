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

const ENDPOINT = "/festa-divino";

const getList = async <T>(path: string, params?: FestaDivinoListParams): Promise<PaginatedResponse<T>> => {
    const { data } = await api.get<PaginatedResponse<T>>(`${ENDPOINT}${path}`, {
        params: buildFestaDivinoParams(params),
    });

    return data;
};

export const festaDivinoService = {
    async getDashboard(): Promise<ApiResponse<FestaDivinoDashboard>> {
        const { data } = await api.get<ApiResponse<FestaDivinoDashboard>>(`${ENDPOINT}/dashboard`);

        return data;
    },

    async getHealth(): Promise<ApiResponse<FestaDivinoHealth>> {
        const { data } = await api.get<ApiResponse<FestaDivinoHealth>>(`${ENDPOINT}/health`);

        return data;
    },

    auditLogs: (params?: FestaDivinoListParams) => getList<FestaDivinoAuditLog>("/audit-logs", params),

    edicoes: Object.assign(
        (params?: FestaDivinoListParams) => getList<FestaDivinoEdition>("/edicoes", params),
        {
            criar: async (payload: FestaDivinoEditionPayload) => {
                const { data } = await api.post<ApiResponse<FestaDivinoEdition>>(`${ENDPOINT}/edicoes`, payload);

                return data;
            },
            atualizar: async (id: number, payload: FestaDivinoEditionPayload) => {
                const { data } = await api.put<ApiResponse<FestaDivinoEdition>>(`${ENDPOINT}/edicoes/${id}`, payload);

                return data;
            },
            remover: async (id: number) => {
                const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/edicoes/${id}`);

                return data;
            },
        }
    ),

    programacao: {
        dias: (params?: FestaDivinoListParams) => getList<FestaDivinoDiaFesta>("/programacao/dias", params),
        criarDia: async (payload: FestaDivinoDiaFestaPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoDiaFesta>>(`${ENDPOINT}/programacao/dias`, payload);

            return data;
        },
        atualizarDia: async (id: number, payload: FestaDivinoDiaFestaPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoDiaFesta>>(
                `${ENDPOINT}/programacao/dias/${id}`,
                payload
            );

            return data;
        },
        removerDia: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/dias/${id}`);

            return data;
        },
        eventos: (params?: FestaDivinoListParams) => getList<FestaDivinoEvento>("/programacao/eventos", params),
        criarEvento: async (payload: FestaDivinoEventoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoEvento>>(`${ENDPOINT}/programacao/eventos`, payload);

            return data;
        },
        atualizarEvento: async (id: number, payload: FestaDivinoEventoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoEvento>>(
                `${ENDPOINT}/programacao/eventos/${id}`,
                payload
            );

            return data;
        },
        atualizarStatusEvento: async (id: number, payload: Pick<FestaDivinoEventoPayload, "ativo" | "destaque">) => {
            const { data } = await api.patch<ApiResponse<FestaDivinoEvento>>(
                `${ENDPOINT}/programacao/eventos/${id}/status`,
                payload
            );

            return data;
        },
        removerEvento: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/eventos/${id}`);

            return data;
        },
        categorias: (params?: FestaDivinoListParams) =>
            getList<FestaDivinoCategoriaEvento>("/programacao/categorias", params),
        criarCategoria: async (payload: FestaDivinoCategoriaEventoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoCategoriaEvento>>(
                `${ENDPOINT}/programacao/categorias`,
                payload
            );

            return data;
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoCategoriaEventoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoCategoriaEvento>>(
                `${ENDPOINT}/programacao/categorias/${id}`,
                payload
            );

            return data;
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/categorias/${id}`);

            return data;
        },
        locais: (params?: FestaDivinoListParams) => getList<FestaDivinoLocal>("/programacao/locais", params),
        criarLocal: async (payload: FestaDivinoLocalPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoLocal>>(`${ENDPOINT}/programacao/locais`, payload);

            return data;
        },
        atualizarLocal: async (id: number, payload: FestaDivinoLocalPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoLocal>>(
                `${ENDPOINT}/programacao/locais/${id}`,
                payload
            );

            return data;
        },
        removerLocal: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/locais/${id}`);

            return data;
        },
        atracoes: (params?: FestaDivinoListParams) => getList<FestaDivinoAtracao>("/programacao/atracoes", params),
        criarAtracao: async (payload: FestaDivinoAtracaoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoAtracao>>(
                `${ENDPOINT}/programacao/atracoes`,
                payload
            );

            return data;
        },
        atualizarAtracao: async (id: number, payload: FestaDivinoAtracaoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoAtracao>>(
                `${ENDPOINT}/programacao/atracoes/${id}`,
                payload
            );

            return data;
        },
        removerAtracao: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/programacao/atracoes/${id}`);

            return data;
        },
    },

    cardapio: {
        categorias: (params?: FestaDivinoListParams) =>
            getList<FestaDivinoCardapioCategoria>("/cardapio/categorias", params),
        criarCategoria: async (payload: FestaDivinoCardapioCategoriaPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoCardapioCategoria>>(
                `${ENDPOINT}/cardapio/categorias`,
                payload
            );

            return data;
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoCardapioCategoriaPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoCardapioCategoria>>(
                `${ENDPOINT}/cardapio/categorias/${id}`,
                payload
            );

            return data;
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/cardapio/categorias/${id}`);

            return data;
        },
        produtos: (params?: FestaDivinoListParams) => getList<FestaDivinoProduto>("/cardapio/produtos", params),
        criarProduto: async (payload: FestaDivinoProdutoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoProduto>>(`${ENDPOINT}/cardapio/produtos`, payload);

            return data;
        },
        atualizarProduto: async (id: number, payload: FestaDivinoProdutoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoProduto>>(
                `${ENDPOINT}/cardapio/produtos/${id}`,
                payload
            );

            return data;
        },
        removerProduto: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/cardapio/produtos/${id}`);

            return data;
        },
    },

    conteudo: {
        noticias: (params?: FestaDivinoListParams) => getList<FestaDivinoNoticia>("/conteudo/noticias", params),
        criarNoticia: async (payload: FestaDivinoNoticiaPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoNoticia>>(`${ENDPOINT}/conteudo/noticias`, payload);

            return data;
        },
        atualizarNoticia: async (id: number, payload: FestaDivinoNoticiaPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoNoticia>>(
                `${ENDPOINT}/conteudo/noticias/${id}`,
                payload
            );

            return data;
        },
        removerNoticia: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/conteudo/noticias/${id}`);

            return data;
        },
        textos: (params?: FestaDivinoListParams) => getList<FestaDivinoTexto>("/conteudo/textos", params),
        criarTexto: async (payload: FestaDivinoTextoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoTexto>>(`${ENDPOINT}/conteudo/textos`, payload);

            return data;
        },
        atualizarTexto: async (id: number, payload: FestaDivinoTextoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoTexto>>(
                `${ENDPOINT}/conteudo/textos/${id}`,
                payload
            );

            return data;
        },
        removerTexto: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/conteudo/textos/${id}`);

            return data;
        },
    },

    midia: {
        videos: (params?: FestaDivinoListParams) => getList<FestaDivinoVideo>("/midia/videos", params),
        criarVideo: async (payload: FestaDivinoVideoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoVideo>>(`${ENDPOINT}/midia/videos`, payload);

            return data;
        },
        atualizarVideo: async (id: string, payload: FestaDivinoVideoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoVideo>>(`${ENDPOINT}/midia/videos/${id}`, payload);

            return data;
        },
        removerVideo: async (id: string) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/midia/videos/${id}`);

            return data;
        },
        shorts: (params?: FestaDivinoListParams) => getList<FestaDivinoVideo>("/midia/shorts", params),
        criarShort: async (payload: FestaDivinoVideoPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoVideo>>(`${ENDPOINT}/midia/shorts`, payload);

            return data;
        },
        atualizarShort: async (id: string, payload: FestaDivinoVideoPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoVideo>>(`${ENDPOINT}/midia/shorts/${id}`, payload);

            return data;
        },
        removerShort: async (id: string) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/midia/shorts/${id}`);

            return data;
        },
    },

    faq: {
        categorias: (params?: FestaDivinoListParams) => getList<FestaDivinoFaqCategory>("/faq/categorias", params),
        criarCategoria: async (payload: FestaDivinoFaqCategoryPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoFaqCategory>>(
                `${ENDPOINT}/faq/categorias`,
                payload
            );

            return data;
        },
        atualizarCategoria: async (id: number, payload: FestaDivinoFaqCategoryPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoFaqCategory>>(
                `${ENDPOINT}/faq/categorias/${id}`,
                payload
            );

            return data;
        },
        atualizarStatusCategoria: async (id: number, payload: FestaDivinoStatusPayload) => {
            const { data } = await api.patch<ApiResponse<FestaDivinoFaqCategory>>(
                `${ENDPOINT}/faq/categorias/${id}/status`,
                payload
            );

            return data;
        },
        reordenarCategorias: async (payload: FestaDivinoReorderPayload) => {
            const { data } = await api.patch<ApiResponse<FestaDivinoFaqCategory[]>>(
                `${ENDPOINT}/faq/categorias/reorder`,
                payload
            );

            return data;
        },
        removerCategoria: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/faq/categorias/${id}`);

            return data;
        },
        items: (params?: FestaDivinoListParams) => getList<FestaDivinoFaqItem>("/faq/items", params),
        criarItem: async (payload: FestaDivinoFaqItemPayload) => {
            const { data } = await api.post<ApiResponse<FestaDivinoFaqItem>>(`${ENDPOINT}/faq/items`, payload);

            return data;
        },
        atualizarItem: async (id: number, payload: FestaDivinoFaqItemPayload) => {
            const { data } = await api.put<ApiResponse<FestaDivinoFaqItem>>(`${ENDPOINT}/faq/items/${id}`, payload);

            return data;
        },
        atualizarStatusItem: async (id: number, payload: FestaDivinoStatusPayload) => {
            const { data } = await api.patch<ApiResponse<FestaDivinoFaqItem>>(
                `${ENDPOINT}/faq/items/${id}/status`,
                payload
            );

            return data;
        },
        reordenarItems: async (payload: FestaDivinoReorderPayload) => {
            const { data } = await api.patch<ApiResponse<FestaDivinoFaqItem[]>>(
                `${ENDPOINT}/faq/items/reorder`,
                payload
            );

            return data;
        },
        removerItem: async (id: number) => {
            const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/faq/items/${id}`);

            return data;
        },
    },

    brinquedos: Object.assign(
        (params?: FestaDivinoListParams) => getList<FestaDivinoBrinquedo>("/brinquedos", params),
        {
            criar: async (payload: FestaDivinoBrinquedoPayload) => {
                const { data } = await api.post<ApiResponse<FestaDivinoBrinquedo>>(`${ENDPOINT}/brinquedos`, payload);

                return data;
            },
            atualizar: async (id: number, payload: FestaDivinoBrinquedoPayload) => {
                const { data } = await api.put<ApiResponse<FestaDivinoBrinquedo>>(
                    `${ENDPOINT}/brinquedos/${id}`,
                    payload
                );

                return data;
            },
            atualizarStatus: async (id: number, payload: FestaDivinoStatusPayload) => {
                const { data } = await api.patch<ApiResponse<FestaDivinoBrinquedo>>(
                    `${ENDPOINT}/brinquedos/${id}/status`,
                    payload
                );

                return data;
            },
            remover: async (id: number) => {
                const { data } = await api.delete<ApiResponse<null>>(`${ENDPOINT}/brinquedos/${id}`);

                return data;
            },
        }
    ),
};
