import { AxiosError, isAxiosError } from "axios";
import api from "@/services/api";
import type {
    ApiEnvelope,
    PromptTemplate,
    PromptTemplateListResponse,
    PromptTemplatePayload,
    PromptTrackUseResponse,
    PromptVariable,
} from "@/features/ai-prompts/types";

const ENDPOINT = "/user/ai-prompts";

interface ErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
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

export const aiPromptsService = {
    async list(params: { per_page?: number } = {}): Promise<PromptTemplateListResponse> {
        return request(
            () => api.get<PromptTemplateListResponse>(ENDPOINT, { params }),
            "Nao foi possivel carregar os templates de prompt.",
        );
    },

    async detail(id: number): Promise<ApiEnvelope<PromptTemplate>> {
        return request(
            () => api.get<ApiEnvelope<PromptTemplate>>(`${ENDPOINT}/${id}`),
            "Nao foi possivel carregar o template de prompt.",
        );
    },

    async create(payload: PromptTemplatePayload): Promise<ApiEnvelope<PromptTemplate>> {
        return request(
            () => api.post<ApiEnvelope<PromptTemplate>>(ENDPOINT, payload),
            "Nao foi possivel criar o template de prompt.",
        );
    },

    async update(
        id: number,
        payload: Partial<PromptTemplatePayload>,
    ): Promise<ApiEnvelope<PromptTemplate>> {
        return request(
            () => api.put<ApiEnvelope<PromptTemplate>>(`${ENDPOINT}/${id}`, payload),
            "Nao foi possivel atualizar o template de prompt.",
        );
    },

    async archive(id: number): Promise<ApiEnvelope<null>> {
        return request(
            () => api.delete<ApiEnvelope<null>>(`${ENDPOINT}/${id}`),
            "Nao foi possivel arquivar o template de prompt.",
        );
    },

    async setFavorite(id: number): Promise<ApiEnvelope<PromptTemplate>> {
        return request(
            () => api.put<ApiEnvelope<PromptTemplate>>(`${ENDPOINT}/${id}/favorite`),
            "Nao foi possivel definir o template favorito.",
        );
    },

    async reorder(items: number[]): Promise<ApiEnvelope<PromptTemplate[]>> {
        return request(
            () => api.put<ApiEnvelope<PromptTemplate[]>>(`${ENDPOINT}/reorder`, { items }),
            "Nao foi possivel atualizar a ordenacao dos prompts.",
        );
    },

    async getVariables(): Promise<ApiEnvelope<PromptVariable[]>> {
        return request(
            () => api.get<ApiEnvelope<PromptVariable[]>>(`${ENDPOINT}/variables`),
            "Nao foi possivel carregar as variaveis de prompt.",
        );
    },

    async createStarterTemplate(): Promise<ApiEnvelope<PromptTemplate>> {
        return request(
            () => api.post<ApiEnvelope<PromptTemplate>>(`${ENDPOINT}/starter`),
            "Nao foi possivel criar o modelo inicial.",
        );
    },

    async trackUse(id: number): Promise<ApiEnvelope<PromptTrackUseResponse>> {
        return request(
            () => api.post<ApiEnvelope<PromptTrackUseResponse>>(`${ENDPOINT}/${id}/track-use`),
            "Nao foi possivel registrar o uso do template.",
        );
    },
};

export default aiPromptsService;
