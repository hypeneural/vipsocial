import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import {
    categoriaService,
    CreateCategoriaDTO,
    CreateStatusMateriaDTO,
    gavetaService,
    roteiroService,
    ReorderMateriaItemDTO,
    statusMateriaService,
    auditLogService,
    UpdateMateriaDTO,
    UpdateStatusMateriaDTO,
} from "@/services/roteiro.service";
import {
    Categoria,
    Gaveta,
    Materia,
    NewsItem,
    Roteiro,
    StatusMateria,
} from "@/types/roteiros";

// ==========================================
// QUERY KEYS
// ==========================================

export const roteiroKeys = {
    all: ["roteiros"] as const,
    byDate: (date: string) => [...roteiroKeys.all, "by-date", date] as const,
    latest: ["roteiros", "latest"] as const,
    categorias: ["roteiros", "categorias"] as const,
    statusMaterias: ["roteiros", "status-materias"] as const,
    gavetas: ["roteiros", "gavetas"] as const,
};

// ==========================================
// HELPERS
// ==========================================

const getCollectionData = <T>(payload: unknown): T[] => {
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    if (payload && typeof payload === "object") {
        const nestedData = (payload as { data?: unknown }).data;
        if (Array.isArray(nestedData)) {
            return nestedData as T[];
        }
    }

    return [];
};

const pad = (value: number) => String(value).padStart(2, "0");

const normalizeDurationToHms = (value?: string | null): string => {
    if (!value) return "00:00";

    const parts = value.split(":");

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts.map((part) => Number(part) || 0);
        const totalMinutes = hours * 60 + minutes;
        return `${pad(totalMinutes)}:${pad(seconds)}`;
    }

    if (parts.length === 2) {
        const [minutes, seconds] = parts.map((part) => Number(part) || 0);
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    return "00:00";
};

const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
        return isoString;
    }

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const mapMateriaToNewsItem = (
    materia: Materia,
    date: string,
    categoriasIndex: Map<number, Categoria>
): NewsItem => {
    const categoriaId = materia.categoria?.id;
    const categoriaFromList = categoriaId ? categoriasIndex.get(categoriaId) : undefined;

    return {
        id: materia.id,
        date,
        shortcut: materia.shortcut ?? "",
        title: materia.titulo ?? "",
        description: materia.descricao ?? "",
        duration: normalizeDurationToHms(materia.duracao),
        status: materia.status,
        categoria_id: categoriaId,
        categoria: categoriaFromList,
        creditos_gc: materia.creditos_gc ?? "",
        priority: materia.ordem,
        created_at: materia.created_at,
        updated_at: materia.updated_at,
    };
};


// ==========================================
// QUERIES
// ==========================================

export function useRoteiroByDate(currentDate: string) {
    return useQuery({
        queryKey: roteiroKeys.byDate(currentDate),
        enabled: !!currentDate,
        queryFn: async () => {
            const response = await roteiroService.getByDate(currentDate);
            const roteiros = getCollectionData<Roteiro>(response.data);
            return roteiros[0] ?? null;
        },
    });
}

export function useLatestRoteiro(enabled = true) {
    return useQuery({
        queryKey: roteiroKeys.latest,
        enabled,
        queryFn: async () => {
            const response = await roteiroService.getAll({
                page: 1,
                per_page: 1,
                include: "materias,materias.categoria",
                sort: "-data",
            });

            const roteiros = getCollectionData<Roteiro>(response.data);
            return roteiros[0] ?? null;
        },
    });
}

export function useCategorias() {
    return useQuery({
        queryKey: roteiroKeys.categorias,
        queryFn: async () => {
            const response = await categoriaService.getAll({
                per_page: 100,
                sort: "nome",
                filters: { active: true },
            });

            return getCollectionData<Categoria>(response.data);
        },
    });
}

export function useGavetas() {
    return useQuery({
        queryKey: roteiroKeys.gavetas,
        queryFn: async () => {
            const response = await gavetaService.getAll({
                per_page: 100,
                include: "user",
                filters: { active: true },
            });

            return getCollectionData<Gaveta>(response.data);
        },
    });
}

// ... keeping other mutators ...

export function useCreateGaveta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { titulo: string; descricao?: string }) => gavetaService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.gavetas });
            showToast.success("Notícia de gaveta criada com sucesso");
        },
        onError: () => {
            showToast.error("Erro ao criar notícia de gaveta");
        },
    });
}

export function useUpdateGaveta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gavetaId, data }: { gavetaId: number; data: { titulo?: string; descricao?: string; is_checked?: boolean; active?: boolean } }) =>
            gavetaService.update(gavetaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.gavetas });
        },
        onError: () => {
            showToast.error("Erro ao atualizar notícia de gaveta");
        },
    });
}

export function useDeleteGaveta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gavetaId: number) => gavetaService.delete(gavetaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.gavetas });
            showToast.success("Notícia removida");
        },
        onError: () => {
            showToast.error("Erro ao remover notícia");
        },
    });
}

// ==========================================
// OUTROS HOOKS (Categorias, Status M., Materias)
// ==========================================

export function useCreateCategoria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCategoriaDTO) => categoriaService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.categorias });
            showToast.success("Categoria criada com sucesso");
        },
        onError: () => {
            showToast.error("Erro ao criar categoria");
        },
    });
}

export function useUpdateCategoria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, nome }: { id: number; nome: string }) =>
            categoriaService.update(id, { nome }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.categorias });
            showToast.success("Categoria atualizada");
        },
        onError: () => {
            showToast.error("Erro ao atualizar categoria");
        },
    });
}

export function useDeleteCategoria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => categoriaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.categorias });
            showToast.success("Categoria removida");
        },
        onError: () => {
            showToast.error("Erro ao remover categoria");
        },
    });
}

// ==========================================
// STATUS MATERIA hooks
// ==========================================

export function useStatusMaterias() {
    return useQuery({
        queryKey: roteiroKeys.statusMaterias,
        queryFn: async () => {
            const response = await statusMateriaService.getAll({ per_page: 50 });
            return (response.data ?? []) as StatusMateria[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateStatusMateria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateStatusMateriaDTO) => statusMateriaService.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.statusMaterias });
            showToast.success("Status criado");
        },
        onError: () => {
            showToast.error("Erro ao criar status");
        },
    });
}

export function useUpdateStatusMateria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...dto }: UpdateStatusMateriaDTO & { id: number }) =>
            statusMateriaService.update(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.statusMaterias });
            showToast.success("Status atualizado");
        },
        onError: () => {
            showToast.error("Erro ao atualizar status");
        },
    });
}

export function useDeleteStatusMateria() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => statusMateriaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roteiroKeys.statusMaterias });
            showToast.success("Status removido");
        },
        onError: () => {
            showToast.error("Erro ao remover status");
        },
    });
}

interface UseMateriaMutationOptions {
    roteiroId?: number;
    currentDate?: string;
}

const invalidateRoteiroQuery = async (
    queryClient: ReturnType<typeof useQueryClient>,
    currentDate?: string
) => {
    if (!currentDate) return;

    await queryClient.invalidateQueries({ queryKey: roteiroKeys.byDate(currentDate) });
};

export function useUpdateMateria(options: UseMateriaMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ materiaId, data }: { materiaId: number; data: UpdateMateriaDTO }) => {
            if (!options.roteiroId) {
                throw new Error("Roteiro nao encontrado");
            }
            return roteiroService.updateMateria(options.roteiroId, materiaId, data);
        },
        onSuccess: async () => {
            await invalidateRoteiroQuery(queryClient, options.currentDate);
        },
        onError: () => {
            showToast.error("Erro ao atualizar materia");
        },
    });
}

export function useDeleteMateria(options: UseMateriaMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (materiaId: number) => {
            if (!options.roteiroId) {
                throw new Error("Roteiro nao encontrado");
            }
            return roteiroService.deleteMateria(options.roteiroId, materiaId);
        },
        onSuccess: async () => {
            await invalidateRoteiroQuery(queryClient, options.currentDate);
            showToast.success("Materia removida");
        },
        onError: () => {
            showToast.error("Erro ao remover materia");
        },
    });
}

export function useReorderMaterias(options: UseMateriaMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (materias: ReorderMateriaItemDTO[]) => {
            if (!options.roteiroId) {
                throw new Error("Roteiro nao encontrado");
            }
            return roteiroService.reorderMaterias(options.roteiroId, materias);
        },
        onSuccess: async () => {
            await invalidateRoteiroQuery(queryClient, options.currentDate);
        },
        onError: () => {
            showToast.error("Erro ao reordenar materias");
        },
    });
}

export function useFindOrCreateRoteiro() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (date: string) => {
            const response = await roteiroService.findOrCreate(date);
            return response.data as Roteiro;
        },
        onSuccess: async (_data, date) => {
            await queryClient.invalidateQueries({ queryKey: roteiroKeys.byDate(date) });
        },
        onError: () => {
            showToast.error("Erro ao criar roteiro");
        },
    });
}

// ==========================================
// AUDIT LOG hooks
// ==========================================

export function useMateriaLogs(roteiroId?: number, materiaId?: number) {
    return useQuery({
        queryKey: ["roteiros", "materia-logs", roteiroId, materiaId],
        queryFn: async () => {
            if (!roteiroId || !materiaId) return [];
            const response = await auditLogService.getMateriaLogs(roteiroId, materiaId);
            return response.data ?? [];
        },
        enabled: !!roteiroId && !!materiaId,
    });
}

export function useLogsByDate(date?: string) {
    return useQuery({
        queryKey: ["roteiros", "logs-by-date", date],
        queryFn: async () => {
            if (!date) return [];
            const response = await auditLogService.getLogsByDate(date);
            return response.data ?? [];
        },
        enabled: !!date,
    });
}
