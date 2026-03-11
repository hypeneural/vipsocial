import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import showToast from "@/lib/toast";
import {
    newsRadarService,
    CreateNewsSourceDTO,
    DiscoverNewsSourcePayload,
    NewsItemFilters,
    NewsSourceFilters,
    PreviewNewsSourcePayload,
    TestNewsSelectorPayload,
    UpdateNewsSourceDTO,
} from "@/services/newsRadar.service";

export const newsRadarKeys = {
    all: ["news-radar"] as const,
    dashboard: () => [...newsRadarKeys.all, "dashboard"] as const,
    items: () => [...newsRadarKeys.all, "items"] as const,
    itemList: (params?: NewsItemFilters) => [...newsRadarKeys.items(), "list", params] as const,
    itemDetail: (id: number) => [...newsRadarKeys.items(), "detail", id] as const,
    itemRelated: (id: number) => [...newsRadarKeys.items(), "related", id] as const,
    sources: () => [...newsRadarKeys.all, "sources"] as const,
    sourceList: (params?: NewsSourceFilters) => [...newsRadarKeys.sources(), "list", params] as const,
    sourceDetail: (id: number) => [...newsRadarKeys.sources(), "detail", id] as const,
    sourceRuns: (id: number, page = 1) => [...newsRadarKeys.sources(), "runs", id, page] as const,
    discovery: () => [...newsRadarKeys.all, "discovery"] as const,
    discoveryStatus: (runId: string) => [...newsRadarKeys.discovery(), "status", runId] as const,
};

export function useNewsDashboard() {
    return useQuery({
        queryKey: newsRadarKeys.dashboard(),
        queryFn: () => newsRadarService.getDashboard(),
        refetchInterval: 60000,
    });
}

export function useNewsItems(params?: NewsItemFilters) {
    return useQuery({
        queryKey: newsRadarKeys.itemList(params),
        queryFn: () => newsRadarService.getItems(params),
        refetchInterval: 60000,
    });
}

export function useNewsItem(id?: number) {
    return useQuery({
        queryKey: newsRadarKeys.itemDetail(id ?? 0),
        queryFn: () => newsRadarService.getItemById(id!),
        enabled: Boolean(id),
    });
}

export function useRelatedNewsItems(id?: number) {
    return useQuery({
        queryKey: newsRadarKeys.itemRelated(id ?? 0),
        queryFn: () => newsRadarService.getRelatedItems(id!),
        enabled: Boolean(id),
    });
}

export function useNewsSources(params?: NewsSourceFilters) {
    return useQuery({
        queryKey: newsRadarKeys.sourceList(params),
        queryFn: () => newsRadarService.getSources(params),
        refetchInterval: 60000,
    });
}

export function useNewsSource(id?: number) {
    return useQuery({
        queryKey: newsRadarKeys.sourceDetail(id ?? 0),
        queryFn: () => newsRadarService.getSourceById(id!),
        enabled: Boolean(id),
    });
}

export function useNewsSourceRuns(id?: number, page = 1) {
    return useQuery({
        queryKey: newsRadarKeys.sourceRuns(id ?? 0, page),
        queryFn: () => newsRadarService.getSourceRuns(id!, page),
        enabled: Boolean(id),
    });
}

export function useNewsDiscoveryStatus(runId?: string) {
    return useQuery({
        queryKey: newsRadarKeys.discoveryStatus(runId ?? ""),
        queryFn: () => newsRadarService.getDiscoveryStatus(runId!),
        enabled: Boolean(runId),
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data || data.status === "running" || data.status === "pending") {
                return 2000;
            }
            return false;
        },
    });
}

export function useCreateNewsSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateNewsSourceDTO) => newsRadarService.createSource(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sources() });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.dashboard() });
            showToast.success("Fonte criada com sucesso.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateNewsSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateNewsSourceDTO }) =>
            newsRadarService.updateSource(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sourceDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sources() });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.dashboard() });
            showToast.success("Fonte atualizada.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDeleteNewsSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => newsRadarService.deleteSource(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sources() });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.dashboard() });
            showToast.success("Fonte removida.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useSyncNewsSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => newsRadarService.syncSource(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sourceDetail(id) });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.sources() });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.dashboard() });
            showToast.success("Sincronizacao agendada.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDiscoverNewsSource() {
    return useMutation({
        mutationFn: (payload: DiscoverNewsSourcePayload) => newsRadarService.discoverSource(payload),
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function usePreviewNewsSource() {
    return useMutation({
        mutationFn: (payload: PreviewNewsSourcePayload) => newsRadarService.previewSource(payload),
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useTestNewsSelector() {
    return useMutation({
        mutationFn: (payload: TestNewsSelectorPayload) => newsRadarService.testSelector(payload),
        onError: (error: Error) => showToast.error(error.message),
    });
}
