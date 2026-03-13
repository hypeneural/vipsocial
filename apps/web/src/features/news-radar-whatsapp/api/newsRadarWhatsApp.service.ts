import { AxiosError, isAxiosError } from "axios";
import api from "@/services/api";
import type {
    AddWhatsAppNewsBundleItemsPayload,
    ApiEnvelope,
    CreateWhatsAppNewsBundlePayload,
    CursorPaginationMeta,
    ExportWhatsAppBundleMarkdownPayload,
    UserWhatsAppNewsGroup,
    WhatsAppBundleMarkdownExport,
    WhatsAppBundleMarkdownPreview,
    WhatsAppBundlePromotionResult,
    WhatsAppGroupSummary,
    WhatsAppGroupTimelineParams,
    WhatsAppNewsBundle,
    WhatsAppNewsBundleListParams,
    WhatsAppNewsGroupListParams,
    WhatsAppTimelineEvent,
    UpdateWhatsAppNewsBundlePayload,
} from "@/features/news-radar-whatsapp/types";

const ENDPOINT = "/news-radar/whatsapp";

interface ErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
}

type QueryBoolean = boolean | undefined;

export function normalizeBooleanQueryParam(value: QueryBoolean): "1" | undefined {
    return value ? "1" : undefined;
}

export function normalizeGroupsQueryParams(params: WhatsAppNewsGroupListParams = {}) {
    return {
        ...params,
        include_inactive: normalizeBooleanQueryParam(params.include_inactive),
    };
}

export function normalizeTimelineQueryParams(params: WhatsAppGroupTimelineParams = {}) {
    return {
        ...params,
        include_ignored: normalizeBooleanQueryParam(params.include_ignored),
    };
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorPayload>;
        const message = axiosError.response?.data?.message;

        if (typeof message === "string" && message.trim()) {
            return message;
        }

        const validationErrors = axiosError.response?.data?.errors;
        if (validationErrors && typeof validationErrors === "object") {
            const firstEntry = Object.values(validationErrors).find(
                (value) => Array.isArray(value) && value.length > 0,
            );

            if (firstEntry?.[0]) {
                return firstEntry[0];
            }
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

async function request<T>(
    executor: () => Promise<{ data: T }>,
    fallbackMessage: string,
): Promise<T> {
    try {
        const response = await executor();
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage));
    }
}

export const newsRadarWhatsAppService = {
    async listGroups(
        params: WhatsAppNewsGroupListParams = {},
    ): Promise<ApiEnvelope<UserWhatsAppNewsGroup[]>> {
        return request(
            () =>
                api.get<ApiEnvelope<UserWhatsAppNewsGroup[]>>(`${ENDPOINT}/groups`, {
                    params: normalizeGroupsQueryParams(params),
                }),
            "Nao foi possivel carregar os grupos monitorados.",
        );
    },

    async getGroupSummary(groupFk: string): Promise<ApiEnvelope<WhatsAppGroupSummary>> {
        return request(
            () => api.get<ApiEnvelope<WhatsAppGroupSummary>>(`${ENDPOINT}/groups/${groupFk}/summary`),
            "Nao foi possivel carregar o resumo do grupo.",
        );
    },

    async markGroupAsRead(
        groupFk: string,
        lastSeenEventId: number,
    ): Promise<ApiEnvelope<WhatsAppGroupSummary>> {
        return request(
            () =>
                api.post<ApiEnvelope<WhatsAppGroupSummary>>(`${ENDPOINT}/groups/${groupFk}/mark-as-read`, {
                    last_seen_event_id: lastSeenEventId,
                }),
            "Nao foi possivel marcar o grupo como lido.",
        );
    },

    async getGroupTimeline(
        groupFk: string,
        params: WhatsAppGroupTimelineParams = {},
    ): Promise<ApiEnvelope<WhatsAppTimelineEvent[], CursorPaginationMeta>> {
        return request(
            () =>
                api.get<ApiEnvelope<WhatsAppTimelineEvent[], CursorPaginationMeta>>(
                    `${ENDPOINT}/groups/${groupFk}/timeline`,
                    { params: normalizeTimelineQueryParams(params) },
                ),
            "Nao foi possivel carregar a timeline do grupo.",
        );
    },

    async getEvent(id: number): Promise<ApiEnvelope<WhatsAppTimelineEvent>> {
        return request(
            () => api.get<ApiEnvelope<WhatsAppTimelineEvent>>(`${ENDPOINT}/events/${id}`),
            "Nao foi possivel carregar a mensagem.",
        );
    },

    async ignoreEvent(id: number): Promise<ApiEnvelope<{ event_id: number; is_ignored: boolean }>> {
        return request(
            () => api.post<ApiEnvelope<{ event_id: number; is_ignored: boolean }>>(`${ENDPOINT}/events/${id}/ignore`),
            "Nao foi possivel ignorar a mensagem.",
        );
    },

    async unignoreEvent(id: number): Promise<ApiEnvelope<{ event_id: number; is_ignored: boolean }>> {
        return request(
            () =>
                api.post<ApiEnvelope<{ event_id: number; is_ignored: boolean }>>(
                    `${ENDPOINT}/events/${id}/unignore`,
                ),
            "Nao foi possivel reexibir a mensagem.",
        );
    },

    async starEvent(id: number): Promise<ApiEnvelope<{ event_id: number; is_starred: boolean }>> {
        return request(
            () => api.post<ApiEnvelope<{ event_id: number; is_starred: boolean }>>(`${ENDPOINT}/events/${id}/star`),
            "Nao foi possivel marcar a mensagem.",
        );
    },

    async unstarEvent(id: number): Promise<ApiEnvelope<{ event_id: number; is_starred: boolean }>> {
        return request(
            () =>
                api.post<ApiEnvelope<{ event_id: number; is_starred: boolean }>>(`${ENDPOINT}/events/${id}/unstar`),
            "Nao foi possivel remover a marcacao.",
        );
    },

    async markEventReviewed(
        id: number,
    ): Promise<ApiEnvelope<{ event_id: number; reviewed_at: string | null }>> {
        return request(
            () =>
                api.post<ApiEnvelope<{ event_id: number; reviewed_at: string | null }>>(
                    `${ENDPOINT}/events/${id}/mark-reviewed`,
                ),
            "Nao foi possivel marcar a mensagem como revisada.",
        );
    },

    async listBundles(
        params: WhatsAppNewsBundleListParams = {},
    ): Promise<ApiEnvelope<WhatsAppNewsBundle[]>> {
        return request(
            () => api.get<ApiEnvelope<WhatsAppNewsBundle[]>>(`${ENDPOINT}/bundles`, { params }),
            "Nao foi possivel carregar os agrupamentos editoriais do grupo.",
        );
    },

    async createBundle(
        payload: CreateWhatsAppNewsBundlePayload,
    ): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles`, payload),
            "Nao foi possivel criar o agrupamento editorial.",
        );
    },

    async getBundle(id: number): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.get<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}`),
            "Nao foi possivel carregar o agrupamento editorial.",
        );
    },

    async updateBundle(
        id: number,
        payload: UpdateWhatsAppNewsBundlePayload,
    ): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.put<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}`, payload),
            "Nao foi possivel atualizar o agrupamento editorial.",
        );
    },

    async addBundleItems(
        id: number,
        payload: AddWhatsAppNewsBundleItemsPayload,
    ): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/items`, payload),
            "Nao foi possivel adicionar mensagens ao agrupamento editorial.",
        );
    },

    async removeBundleItem(
        id: number,
        eventId: number,
        lockVersion: number,
    ): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () =>
                api.delete<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/items/${eventId}`, {
                    data: { lock_version: lockVersion },
                }),
            "Nao foi possivel remover a mensagem do agrupamento editorial.",
        );
    },

    async setBundleStar(
        id: number,
        isStarred: boolean,
    ): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.put<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/star`, { is_starred: isStarred }),
            "Nao foi possivel atualizar o destaque do agrupamento editorial.",
        );
    },

    async archiveBundle(id: number, lockVersion: number): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/archive`, { lock_version: lockVersion }),
            "Nao foi possivel arquivar o agrupamento editorial.",
        );
    },

    async reopenBundle(id: number, lockVersion: number): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/reopen`, { lock_version: lockVersion }),
            "Nao foi possivel reabrir o agrupamento editorial.",
        );
    },

    async duplicateBundle(id: number): Promise<ApiEnvelope<WhatsAppNewsBundle>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppNewsBundle>>(`${ENDPOINT}/bundles/${id}/duplicate`),
            "Nao foi possivel duplicar o agrupamento editorial.",
        );
    },

    async promoteBundle(
        id: number,
        lockVersion: number,
    ): Promise<ApiEnvelope<WhatsAppBundlePromotionResult>> {
        return request(
            () =>
                api.post<ApiEnvelope<WhatsAppBundlePromotionResult>>(`${ENDPOINT}/bundles/${id}/promote`, {
                    lock_version: lockVersion,
                }),
            "Nao foi possivel promover o agrupamento editorial.",
        );
    },

    async previewBundleMarkdown(id: number): Promise<ApiEnvelope<WhatsAppBundleMarkdownPreview>> {
        return request(
            () => api.get<ApiEnvelope<WhatsAppBundleMarkdownPreview>>(`${ENDPOINT}/bundles/${id}/markdown-preview`),
            "Nao foi possivel gerar o preview do markdown.",
        );
    },

    async exportBundleMarkdown(
        id: number,
        payload: ExportWhatsAppBundleMarkdownPayload,
    ): Promise<ApiEnvelope<WhatsAppBundleMarkdownExport>> {
        return request(
            () => api.post<ApiEnvelope<WhatsAppBundleMarkdownExport>>(`${ENDPOINT}/bundles/${id}/markdown-export`, payload),
            "Nao foi possivel exportar o markdown do agrupamento editorial.",
        );
    },
};

export default newsRadarWhatsAppService;
