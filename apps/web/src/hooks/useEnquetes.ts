import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import enqueteService, {
  type CreatePollDTO,
  type CreatePollPlacementDTO,
  type CreatePollSiteDomainDTO,
  type CreatePollSiteDTO,
  type PollFilters,
  type PollStatus,
  type PollTimeSeriesParams,
  type UpdatePollPlacementDTO,
  type UpdatePollSiteDomainDTO,
  type UpdatePollSiteDTO,
  type UpdatePollDTO,
} from "@/services/enquete.service";
import { type ListParams } from "@/services/types";
import showToast from "@/lib/toast";

export const enqueteKeys = {
  all: ["enquetes"] as const,
  overview: () => [...enqueteKeys.all, "overview"] as const,
  list: (params?: ListParams & PollFilters) => [...enqueteKeys.all, "list", params] as const,
  detail: (id: number) => [...enqueteKeys.all, "detail", id] as const,
  dashboard: (id: number) => [...enqueteKeys.all, "dashboard", id] as const,
  timeseries: (id: number, params?: PollTimeSeriesParams) =>
    [...enqueteKeys.all, "timeseries", id, params] as const,
  sites: () => [...enqueteKeys.all, "sites"] as const,
  placements: (id: number) => [...enqueteKeys.all, "placements", id] as const,
  metrics: (id: number, metric: string) => [...enqueteKeys.all, "metrics", id, metric] as const,
  voteAttempts: (id: number, params?: ListParams) =>
    [...enqueteKeys.all, "vote-attempts", id, params] as const,
  votes: (id: number, params?: ListParams) => [...enqueteKeys.all, "votes", id, params] as const,
};

export function usePolls(params?: ListParams & PollFilters) {
  return useQuery({
    queryKey: enqueteKeys.list(params),
    queryFn: () => enqueteService.getAll(params),
  });
}

export function usePollsOverview() {
  return useQuery({
    queryKey: enqueteKeys.overview(),
    queryFn: () => enqueteService.getOverview(),
  });
}

export function usePoll(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.detail(id ?? 0),
    queryFn: () => enqueteService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollDTO) => enqueteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success("Enquete criada");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useUpdatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePollDTO }) =>
      enqueteService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success("Enquete atualizada");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function usePollDashboard(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.dashboard(id ?? 0),
    queryFn: () => enqueteService.getDashboard(id!),
    enabled: Boolean(id),
  });
}

export function usePollTimeSeries(id?: number, params?: PollTimeSeriesParams) {
  return useQuery({
    queryKey: enqueteKeys.timeseries(id ?? 0, params),
    queryFn: () => enqueteService.getTimeSeries(id!, params),
    enabled: Boolean(id),
  });
}

export function usePollSites() {
  return useQuery({
    queryKey: enqueteKeys.sites(),
    queryFn: () => enqueteService.getSites(),
  });
}

export function usePollPlacements(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.placements(id ?? 0),
    queryFn: () => enqueteService.getPlacements(id!),
    enabled: Boolean(id),
  });
}

export function usePollPlacementsMetrics(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.metrics(id ?? 0, "placements"),
    queryFn: () => enqueteService.getPlacementsMetrics(id!),
    enabled: Boolean(id),
  });
}

export function usePollLocationsMetrics(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.metrics(id ?? 0, "locations"),
    queryFn: () => enqueteService.getLocationsMetrics(id!),
    enabled: Boolean(id),
  });
}

export function usePollProvidersMetrics(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.metrics(id ?? 0, "providers"),
    queryFn: () => enqueteService.getProvidersMetrics(id!),
    enabled: Boolean(id),
  });
}

export function usePollDevicesMetrics(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.metrics(id ?? 0, "devices"),
    queryFn: () => enqueteService.getDevicesMetrics(id!),
    enabled: Boolean(id),
  });
}

export function usePollBrowsersMetrics(id?: number) {
  return useQuery({
    queryKey: enqueteKeys.metrics(id ?? 0, "browsers"),
    queryFn: () => enqueteService.getBrowsersMetrics(id!),
    enabled: Boolean(id),
  });
}

export function usePollVoteAttempts(id?: number, params?: ListParams) {
  return useQuery({
    queryKey: enqueteKeys.voteAttempts(id ?? 0, params),
    queryFn: () => enqueteService.getVoteAttempts(id!, params),
    enabled: Boolean(id),
  });
}

export function usePollVotes(id?: number, params?: ListParams) {
  return useQuery({
    queryKey: enqueteKeys.votes(id ?? 0, params),
    queryFn: () => enqueteService.getVotes(id!, params),
    enabled: Boolean(id),
  });
}

export function useDuplicatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => enqueteService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success("Enquete duplicada");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useArchivePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => enqueteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success("Enquete arquivada");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

function usePollTransition(
  mutationFn: (id: number) => Promise<unknown>,
  successMessage: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success(successMessage);
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function usePausePoll() {
  return usePollTransition((id) => enqueteService.pause(id), "Enquete pausada");
}

export function useClosePoll() {
  return usePollTransition((id) => enqueteService.close(id), "Enquete encerrada");
}

export function useReopenPoll() {
  return usePollTransition((id) => enqueteService.reopen(id), "Enquete reaberta");
}

export function useUpdatePollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PollStatus }) =>
      enqueteService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success("Status atualizado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useCreatePollSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollSiteDTO) => enqueteService.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.sites() });
      queryClient.invalidateQueries({ queryKey: [...enqueteKeys.all, "placements"] });
      showToast.success("Site criado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useUpdatePollSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePollSiteDTO }) =>
      enqueteService.updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.sites() });
      queryClient.invalidateQueries({ queryKey: [...enqueteKeys.all, "placements"] });
      showToast.success("Site atualizado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useCreatePollSiteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, data }: { siteId: number; data: CreatePollSiteDomainDTO }) =>
      enqueteService.createSiteDomain(siteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.sites() });
      showToast.success("Dominio criado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useUpdatePollSiteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePollSiteDomainDTO }) =>
      enqueteService.updateSiteDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.sites() });
      showToast.success("Dominio atualizado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useDeletePollSiteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => enqueteService.deleteSiteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.sites() });
      showToast.success("Dominio removido");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useCreatePollPlacement(pollId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollPlacementDTO) => enqueteService.createPlacement(pollId!, data),
    onSuccess: () => {
      if (pollId) {
        queryClient.invalidateQueries({ queryKey: enqueteKeys.placements(pollId) });
        queryClient.invalidateQueries({ queryKey: enqueteKeys.dashboard(pollId) });
      }
      queryClient.invalidateQueries({ queryKey: enqueteKeys.overview() });
      queryClient.invalidateQueries({ queryKey: [...enqueteKeys.all, "list"] });
      showToast.success("Placement criado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useUpdatePollPlacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePollPlacementDTO }) =>
      enqueteService.updatePlacement(id, data),
    onSuccess: (response) => {
      const pollId = response.data?.poll_id;
      if (pollId) {
        queryClient.invalidateQueries({ queryKey: enqueteKeys.placements(pollId) });
        queryClient.invalidateQueries({ queryKey: enqueteKeys.dashboard(pollId) });
      }
      queryClient.invalidateQueries({ queryKey: enqueteKeys.overview() });
      queryClient.invalidateQueries({ queryKey: [...enqueteKeys.all, "list"] });
      showToast.success("Placement atualizado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useTogglePollPlacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (placementId: number) => enqueteService.togglePlacement(placementId),
    onSuccess: (response) => {
      const pollId = response.data?.poll_id;
      if (pollId) {
        queryClient.invalidateQueries({ queryKey: enqueteKeys.placements(pollId) });
        queryClient.invalidateQueries({ queryKey: enqueteKeys.dashboard(pollId) });
      }
      queryClient.invalidateQueries({ queryKey: enqueteKeys.overview() });
      queryClient.invalidateQueries({ queryKey: [...enqueteKeys.all, "list"] });
      showToast.success("Placement atualizado");
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useUploadPollOptionImage() {
  return useMutation({
    mutationFn: ({ optionId, file }: { optionId: number; file: File }) =>
      enqueteService.uploadOptionImage(optionId, file),
    onSuccess: () => showToast.success("Imagem da opcao atualizada"),
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useDeletePollOptionImage() {
  return useMutation({
    mutationFn: (optionId: number) => enqueteService.deleteOptionImage(optionId),
    onSuccess: () => showToast.success("Imagem da opcao removida"),
    onError: (error: Error) => showToast.error(error.message),
  });
}

export function useInvalidatePollVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ voteId, reason }: { voteId: string; reason: string }) =>
      enqueteService.invalidateVote(voteId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enqueteKeys.all });
      showToast.success(`Voto ${variables.voteId} invalidado`);
    },
    onError: (error: Error) => showToast.error(error.message),
  });
}
