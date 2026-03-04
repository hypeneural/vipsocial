import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    publicacaoService,
    NewsArticle,
    NewsFilters,
    NewsStats,
    SocialPlatform,
    SocialPublication,
} from "@/services/publicacao.service";
import { toast } from "@/lib/toast";

// ==========================================
// QUERY KEYS
// ==========================================

export const publicacaoKeys = {
    all: ["publicacoes"] as const,
    lists: () => [...publicacaoKeys.all, "list"] as const,
    list: (filters?: NewsFilters) => [...publicacaoKeys.lists(), filters] as const,
    details: () => [...publicacaoKeys.all, "detail"] as const,
    detail: (id: string) => [...publicacaoKeys.details(), id] as const,
    stats: () => [...publicacaoKeys.all, "stats"] as const,
    categories: () => [...publicacaoKeys.all, "categories"] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Get all news articles with filters
 */
export function useNewsArticles(filters?: NewsFilters) {
    return useQuery({
        queryKey: publicacaoKeys.list(filters),
        queryFn: () => publicacaoService.getAll(filters),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Get single news article
 */
export function useNewsArticle(id: string) {
    return useQuery({
        queryKey: publicacaoKeys.detail(id),
        queryFn: () => publicacaoService.getById(id),
        enabled: !!id,
    });
}

/**
 * Get publication stats
 */
export function usePublicationStats() {
    return useQuery({
        queryKey: publicacaoKeys.stats(),
        queryFn: () => publicacaoService.getStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get categories list
 */
export function useCategories() {
    return useQuery({
        queryKey: publicacaoKeys.categories(),
        queryFn: () => publicacaoService.getCategories(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Update publication status for a platform
 */
export function useUpdatePublicationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            newsId,
            platform,
            data,
        }: {
            newsId: string;
            platform: SocialPlatform;
            data: Partial<SocialPublication>;
        }) => publicacaoService.updatePublicationStatus(newsId, platform, data),
        onSuccess: (updatedNews) => {
            queryClient.invalidateQueries({ queryKey: publicacaoKeys.lists() });
            queryClient.setQueryData(publicacaoKeys.detail(updatedNews.id), updatedNews);
            queryClient.invalidateQueries({ queryKey: publicacaoKeys.stats() });
            toast.success("Status atualizado com sucesso!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao atualizar status");
        },
    });
}

/**
 * Update observation for a news article
 */
export function useUpdateObservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ newsId, observation }: { newsId: string; observation: string }) =>
            publicacaoService.updateObservation(newsId, observation),
        onSuccess: (updatedNews) => {
            queryClient.invalidateQueries({ queryKey: publicacaoKeys.lists() });
            queryClient.setQueryData(publicacaoKeys.detail(updatedNews.id), updatedNews);
            toast.success("Observação salva!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao salvar observação");
        },
    });
}

/**
 * Mark all platforms as published
 */
export function useMarkAllPublished() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newsId: string) => publicacaoService.markAllPublished(newsId),
        onSuccess: (updatedNews) => {
            queryClient.invalidateQueries({ queryKey: publicacaoKeys.lists() });
            queryClient.setQueryData(publicacaoKeys.detail(updatedNews.id), updatedNews);
            queryClient.invalidateQueries({ queryKey: publicacaoKeys.stats() });
            toast.success("Todas as plataformas marcadas como publicadas!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Erro ao marcar como publicado");
        },
    });
}

// ==========================================
// HELPER HOOKS
// ==========================================

/**
 * Get publication status counts for a news article
 */
export function usePublicationCounts(publications: SocialPublication[]) {
    const published = publications.filter(p => p.status === "published").length;
    const pending = publications.filter(p => p.status === "pending").length;
    const total = publications.length;

    return {
        published,
        pending,
        total,
        allPublished: published === total,
        percentPublished: Math.round((published / total) * 100),
    };
}

export default {
    useNewsArticles,
    useNewsArticle,
    usePublicationStats,
    useCategories,
    useUpdatePublicationStatus,
    useUpdateObservation,
    useMarkAllPublished,
};
