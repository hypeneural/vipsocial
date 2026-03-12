import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import showToast from "@/lib/toast";
import aiPromptsService from "@/features/ai-prompts/api/aiPrompts.service";
import type { PromptTemplatePayload } from "@/features/ai-prompts/types";

export const aiPromptKeys = {
    all: ["ai-prompts"] as const,
    list: (params?: { per_page?: number }) => [...aiPromptKeys.all, "list", params] as const,
    detail: (id: number) => [...aiPromptKeys.all, "detail", id] as const,
    variables: () => [...aiPromptKeys.all, "variables"] as const,
};

export function useAiPromptTemplates(
    params: { per_page?: number } = { per_page: 100 },
    enabled = true,
) {
    return useQuery({
        queryKey: aiPromptKeys.list(params),
        queryFn: () => aiPromptsService.list(params),
        enabled,
    });
}

export function useAiPromptTemplate(id?: number) {
    return useQuery({
        queryKey: aiPromptKeys.detail(id ?? 0),
        queryFn: () => aiPromptsService.detail(id!),
        enabled: Boolean(id),
    });
}

export function useAiPromptVariables(enabled = true) {
    return useQuery({
        queryKey: aiPromptKeys.variables(),
        queryFn: () => aiPromptsService.getVariables(),
        enabled,
    });
}

export function useCreateAiPromptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PromptTemplatePayload) => aiPromptsService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            showToast.success("Template criado com sucesso.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateAiPromptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: Partial<PromptTemplatePayload>;
        }) => aiPromptsService.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.detail(variables.id) });
            showToast.success("Template atualizado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useArchiveAiPromptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => aiPromptsService.archive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            showToast.success("Template arquivado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useSetFavoriteAiPromptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => aiPromptsService.setFavorite(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            showToast.success("Template favorito atualizado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useReorderAiPromptTemplates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (items: number[]) => aiPromptsService.reorder(items),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            showToast.success("Ordenacao atualizada.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useCreateStarterAiPromptTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => aiPromptsService.createStarterTemplate(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiPromptKeys.all });
            showToast.success("Modelo inicial criado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useTrackAiPromptTemplateUse() {
    return useMutation({
        mutationFn: (id: number) => aiPromptsService.trackUse(id),
    });
}
