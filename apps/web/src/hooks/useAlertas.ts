import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    alertDashboardService,
    alertLogService,
    alertService,
    destinationService,
    CreateAlertDTO,
    CreateDestinationDTO,
    DestinationFilters,
    UpdateAlertDTO,
    UpdateDestinationDTO,
    AlertFilters,
    LogFilters,
} from "@/services";
import { ListParams } from "@/services/types";
import showToast from "@/lib/toast";

export const alertKeys = {
    all: ["alertas"] as const,
    destinations: () => [...alertKeys.all, "destinations"] as const,
    destinationList: (params?: ListParams & DestinationFilters) =>
        [...alertKeys.destinations(), "list", params] as const,
    destinationDetail: (id: number) => [...alertKeys.destinations(), "detail", id] as const,
    alerts: () => [...alertKeys.all, "alerts"] as const,
    alertList: (params?: ListParams & AlertFilters) => [...alertKeys.alerts(), "list", params] as const,
    alertDetail: (id: number) => [...alertKeys.alerts(), "detail", id] as const,
    logs: () => [...alertKeys.all, "logs"] as const,
    logList: (params?: ListParams & LogFilters) => [...alertKeys.logs(), "list", params] as const,
    alertLogs: (alertId: number, params?: ListParams & Omit<LogFilters, "alert_id">) =>
        [...alertKeys.logs(), "alert", alertId, params] as const,
    dashboard: () => [...alertKeys.all, "dashboard"] as const,
    stats: () => [...alertKeys.dashboard(), "stats"] as const,
    nextFirings: (limit?: number) => [...alertKeys.dashboard(), "next-firings", limit] as const,
    recentLogs: (limit?: number) => [...alertKeys.dashboard(), "recent-logs", limit] as const,
};

export function useDestinations(params?: ListParams & DestinationFilters) {
    return useQuery({
        queryKey: alertKeys.destinationList(params),
        queryFn: () => destinationService.getAll(params),
    });
}

export function useDestination(id?: number) {
    return useQuery({
        queryKey: alertKeys.destinationDetail(id ?? 0),
        queryFn: () => destinationService.getById(id!),
        enabled: Boolean(id),
    });
}

export function useCreateDestination() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDestinationDTO) => destinationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino criado com sucesso");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateDestination() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateDestinationDTO }) =>
            destinationService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinationDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino atualizado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDeleteDestination() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => destinationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Destino arquivado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useToggleDestination() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => destinationService.toggleActive(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.destinationDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.destinations() });
            showToast.success("Status do destino atualizado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useAlerts(params?: ListParams & AlertFilters) {
    return useQuery({
        queryKey: alertKeys.alertList(params),
        queryFn: () => alertService.getAll(params),
    });
}

export function useAlert(id?: number) {
    return useQuery({
        queryKey: alertKeys.alertDetail(id ?? 0),
        queryFn: () => alertService.getById(id!),
        enabled: Boolean(id),
    });
}

export function useCreateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAlertDTO) => alertService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta criado com sucesso");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useUpdateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAlertDTO }) => alertService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alertDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta atualizado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDeleteAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => alertService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta arquivado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useToggleAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => alertService.toggleActive(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alertDetail(id) });
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Status do alerta atualizado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useDuplicateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => alertService.duplicate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.alerts() });
            showToast.success("Alerta duplicado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useSendAlertNow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => alertService.sendNow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.logs() });
            queryClient.invalidateQueries({ queryKey: alertKeys.dashboard() });
            showToast.success("Envio manual agendado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useAlertLogs(params?: ListParams & LogFilters) {
    return useQuery({
        queryKey: alertKeys.logList(params),
        queryFn: () => alertLogService.getAll(params),
    });
}

export function useAlertLogsByAlert(alertId?: number, params?: ListParams & Omit<LogFilters, "alert_id">) {
    return useQuery({
        queryKey: alertKeys.alertLogs(alertId ?? 0, params),
        queryFn: () => alertLogService.getByAlertId(alertId!, params),
        enabled: Boolean(alertId),
    });
}

export function useRetryAlertLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (logId: string) => alertLogService.retry(logId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.logs() });
            queryClient.invalidateQueries({ queryKey: alertKeys.dashboard() });
            showToast.success("Retry agendado");
        },
        onError: (error: Error) => showToast.error(error.message),
    });
}

export function useAlertDashboardStats() {
    return useQuery({
        queryKey: alertKeys.stats(),
        queryFn: () => alertDashboardService.getStats(),
        refetchInterval: 60000,
    });
}

export function useNextFirings(limit?: number) {
    return useQuery({
        queryKey: alertKeys.nextFirings(limit),
        queryFn: () => alertDashboardService.getNextFirings(limit),
        refetchInterval: 60000,
    });
}

export function useAlertDashboardRecentLogs(limit?: number) {
    return useQuery({
        queryKey: alertKeys.recentLogs(limit),
        queryFn: () => alertDashboardService.getRecentLogs(limit),
        refetchInterval: 60000,
    });
}
