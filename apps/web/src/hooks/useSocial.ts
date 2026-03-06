import { useQuery } from "@tanstack/react-query";
import socialService, { type SocialDashboardParams } from "@/services/social.service";

export const socialKeys = {
  all: ["social"] as const,
  dashboard: (params?: SocialDashboardParams) =>
    [...socialKeys.all, "dashboard", params] as const,
};

interface BaseQueryOptions {
  staleTime?: number;
  refetchInterval?: number;
}

export function useSocialDashboard(
  params?: SocialDashboardParams,
  enabled = true,
  options?: BaseQueryOptions
) {
  return useQuery({
    queryKey: socialKeys.dashboard(params),
    queryFn: () => socialService.getDashboard(params),
    enabled,
    staleTime: options?.staleTime ?? 300000,
    refetchInterval: options?.refetchInterval,
  });
}
