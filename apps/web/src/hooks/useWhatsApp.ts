import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import whatsappService, {
  type WhatsAppConnectionStateParams,
  type WhatsAppGroupsDashboardParams,
} from "@/services/whatsapp.service";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  connectionState: () => [...whatsappKeys.all, "connection-state"] as const,
  groupsDashboard: (params?: WhatsAppGroupsDashboardParams) =>
    [...whatsappKeys.all, "groups-dashboard", params] as const,
};

interface BaseQueryOptions {
  staleTime?: number;
  refetchInterval?: number;
}

export function useWhatsAppConnection(
  params?: WhatsAppConnectionStateParams,
  enabled = true,
  options?: BaseQueryOptions
) {
  return useQuery({
    queryKey: whatsappKeys.connectionState(),
    queryFn: () => whatsappService.getConnectionState(params),
    enabled,
    staleTime: options?.staleTime ?? 10000,
    refetchInterval: options?.refetchInterval,
  });
}

export function useWhatsAppGroupsDashboard(
  params?: WhatsAppGroupsDashboardParams,
  enabled = true,
  options?: BaseQueryOptions
) {
  return useQuery({
    queryKey: whatsappKeys.groupsDashboard(params),
    queryFn: () => whatsappService.getGroupsDashboardMetrics(params),
    enabled,
    staleTime: options?.staleTime ?? 120000,
    refetchInterval: options?.refetchInterval,
  });
}

export function useRefreshWhatsAppConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => whatsappService.getConnectionState({ fresh: true }),
    onSuccess: (response) => {
      queryClient.setQueryData(whatsappKeys.connectionState(), response);
    },
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => whatsappService.disconnect(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: whatsappKeys.connectionState() });
    },
  });
}
