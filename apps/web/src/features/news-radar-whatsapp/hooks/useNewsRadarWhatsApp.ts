import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import showToast from "@/lib/toast";
import newsRadarWhatsAppService from "@/features/news-radar-whatsapp/api/newsRadarWhatsApp.service";
import { newsRadarKeys } from "@/hooks/useNewsRadar";
import type {
    AddWhatsAppNewsBundleItemsPayload,
    CreateWhatsAppNewsBundlePayload,
    UpdateWhatsAppNewsBundlePayload,
    WhatsAppBundleStatus,
    WhatsAppGroupTimelineParams,
    WhatsAppNewsBundleListParams,
    WhatsAppNewsGroupListParams,
} from "@/features/news-radar-whatsapp/types";

export const whatsappNewsKeys = {
    all: ["news-radar-whatsapp"] as const,
    groups: () => [...whatsappNewsKeys.all, "groups"] as const,
    groupsList: (params?: WhatsAppNewsGroupListParams) =>
        [...whatsappNewsKeys.groups(), "list", params] as const,
    groupSummary: (groupFk: string) => [...whatsappNewsKeys.groups(), "summary", groupFk] as const,
    groupTimelineRoot: (groupFk: string) => [...whatsappNewsKeys.groups(), "timeline", groupFk] as const,
    groupTimeline: (groupFk: string, params?: Omit<WhatsAppGroupTimelineParams, "cursor">) =>
        [...whatsappNewsKeys.groupTimelineRoot(groupFk), params] as const,
    events: () => [...whatsappNewsKeys.all, "events"] as const,
    eventDetail: (id: number) => [...whatsappNewsKeys.events(), "detail", id] as const,
    bundles: () => [...whatsappNewsKeys.all, "bundles"] as const,
    bundleList: (params?: WhatsAppNewsBundleListParams) =>
        [...whatsappNewsKeys.bundles(), "list", params] as const,
    bundleDetail: (id: number) => [...whatsappNewsKeys.bundles(), "detail", id] as const,
};

export function useWhatsAppNewsGroups(
    params: WhatsAppNewsGroupListParams = {},
    enabled = true,
) {
    return useQuery({
        queryKey: whatsappNewsKeys.groupsList(params),
        queryFn: () => newsRadarWhatsAppService.listGroups(params),
        enabled,
        refetchInterval: 30000,
    });
}

export function useWhatsAppGroupSummary(groupFk?: string, enabled = true) {
    return useQuery({
        queryKey: whatsappNewsKeys.groupSummary(groupFk ?? ""),
        queryFn: () => newsRadarWhatsAppService.getGroupSummary(groupFk!),
        enabled: enabled && Boolean(groupFk),
        refetchInterval: 30000,
    });
}

export function useInfiniteWhatsAppGroupTimeline(
    groupFk?: string,
    params: Omit<WhatsAppGroupTimelineParams, "cursor"> = {},
    enabled = true,
) {
    return useInfiniteQuery({
        queryKey: whatsappNewsKeys.groupTimeline(groupFk ?? "", params),
        queryFn: ({ pageParam }) =>
            newsRadarWhatsAppService.getGroupTimeline(groupFk!, {
                ...params,
                cursor: typeof pageParam === "string" ? pageParam : null,
            }),
        enabled: enabled && Boolean(groupFk),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.meta?.next_cursor ?? undefined,
        refetchInterval: 30000,
        maxPages: 8,
    });
}

export function useWhatsAppNewsBundles(
    params: WhatsAppNewsBundleListParams = {},
    enabled = true,
) {
    return useQuery({
        queryKey: whatsappNewsKeys.bundleList(params),
        queryFn: () => newsRadarWhatsAppService.listBundles(params),
        enabled,
        refetchInterval: 30000,
    });
}

export function useWhatsAppNewsBundle(id?: number, enabled = true) {
    return useQuery({
        queryKey: whatsappNewsKeys.bundleDetail(id ?? 0),
        queryFn: () => newsRadarWhatsAppService.getBundle(id!),
        enabled: enabled && Boolean(id),
    });
}

export function useMarkWhatsAppGroupAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupFk,
            lastSeenEventId,
        }: {
            groupFk: string;
            lastSeenEventId: number;
        }) => newsRadarWhatsAppService.markGroupAsRead(groupFk, lastSeenEventId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groups() });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groupSummary(variables.groupFk) });
            showToast.success("Grupo marcado como lido.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

function useInvalidateTimelineMutation<TVariables>(
    mutationFn: (variables: TVariables) => Promise<unknown>,
    successMessage: string,
    getGroupFk: (variables: TVariables) => string,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: (_, variables) => {
            const groupFk = getGroupFk(variables);
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groups() });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groupSummary(groupFk) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groupTimelineRoot(groupFk) });
            showToast.success(successMessage);
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useIgnoreWhatsAppEvent() {
    return useInvalidateTimelineMutation(
        ({ eventId }: { groupFk: string; eventId: number }) =>
            newsRadarWhatsAppService.ignoreEvent(eventId),
        "Mensagem ignorada.",
        (variables) => variables.groupFk,
    );
}

export function useUnignoreWhatsAppEvent() {
    return useInvalidateTimelineMutation(
        ({ eventId }: { groupFk: string; eventId: number }) =>
            newsRadarWhatsAppService.unignoreEvent(eventId),
        "Mensagem reexibida.",
        (variables) => variables.groupFk,
    );
}

export function useStarWhatsAppEvent() {
    return useInvalidateTimelineMutation(
        ({ eventId }: { groupFk: string; eventId: number }) =>
            newsRadarWhatsAppService.starEvent(eventId),
        "Mensagem marcada.",
        (variables) => variables.groupFk,
    );
}

export function useUnstarWhatsAppEvent() {
    return useInvalidateTimelineMutation(
        ({ eventId }: { groupFk: string; eventId: number }) =>
            newsRadarWhatsAppService.unstarEvent(eventId),
        "Marcacao removida.",
        (variables) => variables.groupFk,
    );
}

export function useMarkWhatsAppEventReviewed() {
    return useInvalidateTimelineMutation(
        ({ eventId }: { groupFk: string; eventId: number }) =>
            newsRadarWhatsAppService.markEventReviewed(eventId),
        "Mensagem revisada.",
        (variables) => variables.groupFk,
    );
}

export function useCreateWhatsAppNewsBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateWhatsAppNewsBundlePayload) =>
            newsRadarWhatsAppService.createBundle(payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleList({ group_fk: variables.group_fk }) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.groupTimelineRoot(variables.group_fk) });
            showToast.success("Agrupamento editorial criado com sucesso.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateWhatsAppNewsBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: UpdateWhatsAppNewsBundlePayload;
        }) => newsRadarWhatsAppService.updateBundle(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Agrupamento editorial atualizado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useAddWhatsAppNewsBundleItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: AddWhatsAppNewsBundleItemsPayload;
        }) => newsRadarWhatsAppService.addBundleItems(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Mensagens adicionadas ao agrupamento editorial.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useRemoveWhatsAppNewsBundleItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            eventId,
            lockVersion,
        }: {
            id: number;
            eventId: number;
            lockVersion: number;
        }) => newsRadarWhatsAppService.removeBundleItem(id, eventId, lockVersion),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Mensagem removida do agrupamento editorial.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useSetWhatsAppBundleStar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isStarred }: { id: number; isStarred: boolean }) =>
            newsRadarWhatsAppService.setBundleStar(id, isStarred),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Agrupamento editorial atualizado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useArchiveWhatsAppBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, lockVersion }: { id: number; lockVersion: number }) =>
            newsRadarWhatsAppService.archiveBundle(id, lockVersion),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Agrupamento editorial arquivado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useReopenWhatsAppBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, lockVersion }: { id: number; lockVersion: number }) =>
            newsRadarWhatsAppService.reopenBundle(id, lockVersion),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Agrupamento editorial reaberto.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDuplicateWhatsAppBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => newsRadarWhatsAppService.duplicateBundle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            showToast.success("Agrupamento editorial duplicado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function usePromoteWhatsAppBundle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, lockVersion }: { id: number; lockVersion: number }) =>
            newsRadarWhatsAppService.promoteBundle(id, lockVersion),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundleDetail(variables.id) });
            queryClient.invalidateQueries({ queryKey: whatsappNewsKeys.bundles() });
            queryClient.invalidateQueries({ queryKey: newsRadarKeys.all });
            showToast.success("Agrupamento editorial promovido.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function usePreviewWhatsAppBundleMarkdown(bundleId?: number, enabled = true) {
    return useQuery({
        queryKey: [...whatsappNewsKeys.bundleDetail(bundleId ?? 0), "markdown-preview"] as const,
        queryFn: () => newsRadarWhatsAppService.previewBundleMarkdown(bundleId!),
        enabled: enabled && Boolean(bundleId),
    });
}

export function useExportWhatsAppBundleMarkdown() {
    return useMutation({
        mutationFn: ({
            id,
            expiresInMinutes,
            lockVersion,
        }: {
            id: number;
            lockVersion: number;
            expiresInMinutes?: number;
        }) =>
            newsRadarWhatsAppService.exportBundleMarkdown(id, {
                lock_version: lockVersion,
                expires_in_minutes: expiresInMinutes,
            }),
        onSuccess: () => {
            showToast.success("Markdown exportado.");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function getBundleStatusLabel(status: WhatsAppBundleStatus) {
    switch (status) {
        case "open":
            return "Aberto";
        case "reviewing":
            return "Em revisao";
        case "ready":
            return "Pronto";
        case "promoted":
            return "Promovido";
        case "archived":
            return "Arquivado";
        default:
            return status;
    }
}
