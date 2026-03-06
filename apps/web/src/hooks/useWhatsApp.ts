import { useQuery } from "@tanstack/react-query";
import whatsappService, {
  type WhatsAppGroupsDashboardParams,
} from "@/services/whatsapp.service";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  groupsDashboard: (params?: WhatsAppGroupsDashboardParams) =>
    [...whatsappKeys.all, "groups-dashboard", params] as const,
};

interface BaseQueryOptions {
  staleTime?: number;
  refetchInterval?: number;
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
