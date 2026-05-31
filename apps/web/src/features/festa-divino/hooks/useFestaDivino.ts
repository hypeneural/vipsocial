import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { festaDivinoService } from "../api/festaDivino.service";
import { festaDivinoKeys } from "../core/festaDivino.queryKeys";
import type {
    FestaDivinoAtracaoPayload,
    FestaDivinoBrinquedoPayload,
    FestaDivinoCardapioCategoriaPayload,
    FestaDivinoCategoriaEventoPayload,
    FestaDivinoDiaFestaPayload,
    FestaDivinoEditionPayload,
    FestaDivinoEventoPayload,
    FestaDivinoFaqCategoryPayload,
    FestaDivinoFaqItemPayload,
    FestaDivinoListParams,
    FestaDivinoLocalPayload,
    FestaDivinoNoticiaPayload,
    FestaDivinoProdutoPayload,
    FestaDivinoReorderPayload,
    FestaDivinoStatusPayload,
    FestaDivinoTextoPayload,
    FestaDivinoVideoPayload,
} from "../types";

type QueryOptions = {
    enabled?: boolean;
};

export function useFestaDivinoDashboard(options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.dashboard(),
        queryFn: () => festaDivinoService.getDashboard(),
        enabled: options.enabled ?? true,
    });
}

export function useFestaDivinoHealth(options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.health(),
        queryFn: () => festaDivinoService.getHealth(),
        enabled: options.enabled ?? true,
    });
}

export function useFestaDivinoAudit(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.audit(params),
        queryFn: () => festaDivinoService.auditLogs(params),
        enabled: options.enabled ?? true,
    });
}

export function useFestaDivinoEdicoes(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.edicoes(params),
        queryFn: () => festaDivinoService.edicoes(params),
        enabled: options.enabled ?? true,
    });
}

export function useFestaDivinoDiasFesta(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.programacao.dias(params),
        queryFn: () => festaDivinoService.programacao.dias(params),
        enabled: options.enabled ?? true,
    });
}

export function useFestaDivinoProgramacao(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return {
        dias: useQuery({
            queryKey: festaDivinoKeys.programacao.dias(params),
            queryFn: () => festaDivinoService.programacao.dias(params),
            enabled: options.enabled ?? true,
        }),
        eventos: useQuery({
            queryKey: festaDivinoKeys.programacao.eventos(params),
            queryFn: () => festaDivinoService.programacao.eventos(params),
            enabled: options.enabled ?? true,
        }),
        categorias: useQuery({
            queryKey: festaDivinoKeys.programacao.categorias(params),
            queryFn: () => festaDivinoService.programacao.categorias(params),
            enabled: options.enabled ?? true,
        }),
        locais: useQuery({
            queryKey: festaDivinoKeys.programacao.locais(params),
            queryFn: () => festaDivinoService.programacao.locais(params),
            enabled: options.enabled ?? true,
        }),
        atracoes: useQuery({
            queryKey: festaDivinoKeys.programacao.atracoes(params),
            queryFn: () => festaDivinoService.programacao.atracoes(params),
            enabled: options.enabled ?? true,
        }),
    };
}

export function useFestaDivinoCardapio(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return {
        categorias: useQuery({
            queryKey: festaDivinoKeys.cardapio.categorias(params),
            queryFn: () => festaDivinoService.cardapio.categorias(params),
            enabled: options.enabled ?? true,
        }),
        produtos: useQuery({
            queryKey: festaDivinoKeys.cardapio.produtos(params),
            queryFn: () => festaDivinoService.cardapio.produtos(params),
            enabled: options.enabled ?? true,
        }),
    };
}

export function useFestaDivinoConteudo(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return {
        noticias: useQuery({
            queryKey: festaDivinoKeys.conteudo.noticias(params),
            queryFn: () => festaDivinoService.conteudo.noticias(params),
            enabled: options.enabled ?? true,
        }),
        textos: useQuery({
            queryKey: festaDivinoKeys.conteudo.textos(params),
            queryFn: () => festaDivinoService.conteudo.textos(params),
            enabled: options.enabled ?? true,
        }),
    };
}

export function useFestaDivinoMidia(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return {
        videos: useQuery({
            queryKey: festaDivinoKeys.midia.videos(params),
            queryFn: () => festaDivinoService.midia.videos(params),
            enabled: options.enabled ?? true,
        }),
        shorts: useQuery({
            queryKey: festaDivinoKeys.midia.shorts(params),
            queryFn: () => festaDivinoService.midia.shorts(params),
            enabled: options.enabled ?? true,
        }),
    };
}

export function useFestaDivinoFaq(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return {
        categorias: useQuery({
            queryKey: festaDivinoKeys.faq.categorias(params),
            queryFn: () => festaDivinoService.faq.categorias(params),
            enabled: options.enabled ?? true,
        }),
        items: useQuery({
            queryKey: festaDivinoKeys.faq.items(params),
            queryFn: () => festaDivinoService.faq.items(params),
            enabled: options.enabled ?? true,
        }),
    };
}

export function useFestaDivinoBrinquedos(params: FestaDivinoListParams = {}, options: QueryOptions = {}) {
    return useQuery({
        queryKey: festaDivinoKeys.brinquedos(params),
        queryFn: () => festaDivinoService.brinquedos(params),
        enabled: options.enabled ?? true,
    });
}

function useInvalidateFestaDivino() {
    const queryClient = useQueryClient();

    return () => queryClient.invalidateQueries({ queryKey: festaDivinoKeys.all });
}

export function useCreateFestaDivinoEdicao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoEditionPayload) => festaDivinoService.edicoes.criar(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoEdicao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoEditionPayload }) =>
            festaDivinoService.edicoes.atualizar(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoEdicao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.edicoes.remover(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoDiaFesta() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoDiaFestaPayload) => festaDivinoService.programacao.criarDia(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoDiaFesta() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoDiaFestaPayload }) =>
            festaDivinoService.programacao.atualizarDia(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoDiaFesta() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.programacao.removerDia(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoCategoriaEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoCategoriaEventoPayload) => festaDivinoService.programacao.criarCategoria(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoCategoriaEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoCategoriaEventoPayload }) =>
            festaDivinoService.programacao.atualizarCategoria(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoCategoriaEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.programacao.removerCategoria(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoLocal() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoLocalPayload) => festaDivinoService.programacao.criarLocal(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoLocal() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoLocalPayload }) =>
            festaDivinoService.programacao.atualizarLocal(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoLocal() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.programacao.removerLocal(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoAtracao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoAtracaoPayload) => festaDivinoService.programacao.criarAtracao(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoAtracao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoAtracaoPayload }) =>
            festaDivinoService.programacao.atualizarAtracao(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoAtracao() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.programacao.removerAtracao(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoEventoPayload) => festaDivinoService.programacao.criarEvento(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoEventoPayload }) =>
            festaDivinoService.programacao.atualizarEvento(id, payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoEventoStatus() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Pick<FestaDivinoEventoPayload, "ativo" | "destaque"> }) =>
            festaDivinoService.programacao.atualizarStatusEvento(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoEvento() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.programacao.removerEvento(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoCardapioCategoria() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoCardapioCategoriaPayload) => festaDivinoService.cardapio.criarCategoria(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoCardapioCategoria() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoCardapioCategoriaPayload }) =>
            festaDivinoService.cardapio.atualizarCategoria(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoCardapioCategoria() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.cardapio.removerCategoria(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoProduto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoProdutoPayload) => festaDivinoService.cardapio.criarProduto(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoProduto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoProdutoPayload }) =>
            festaDivinoService.cardapio.atualizarProduto(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoProduto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.cardapio.removerProduto(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoNoticia() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoNoticiaPayload) => festaDivinoService.conteudo.criarNoticia(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoNoticia() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoNoticiaPayload }) =>
            festaDivinoService.conteudo.atualizarNoticia(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoNoticia() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.conteudo.removerNoticia(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoTexto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoTextoPayload) => festaDivinoService.conteudo.criarTexto(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoTexto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoTextoPayload }) =>
            festaDivinoService.conteudo.atualizarTexto(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoTexto() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.conteudo.removerTexto(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoVideo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoVideoPayload) => festaDivinoService.midia.criarVideo(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoVideo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: FestaDivinoVideoPayload }) =>
            festaDivinoService.midia.atualizarVideo(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoVideo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: string) => festaDivinoService.midia.removerVideo(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoShort() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoVideoPayload) => festaDivinoService.midia.criarShort(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoShort() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: FestaDivinoVideoPayload }) =>
            festaDivinoService.midia.atualizarShort(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoShort() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: string) => festaDivinoService.midia.removerShort(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoFaqCategory() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoFaqCategoryPayload) => festaDivinoService.faq.criarCategoria(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoFaqCategory() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoFaqCategoryPayload }) =>
            festaDivinoService.faq.atualizarCategoria(id, payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoFaqCategoryStatus() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoStatusPayload }) =>
            festaDivinoService.faq.atualizarStatusCategoria(id, payload),
        onSuccess: invalidate,
    });
}

export function useReorderFestaDivinoFaqCategories() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoReorderPayload) => festaDivinoService.faq.reordenarCategorias(payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoFaqCategory() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.faq.removerCategoria(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoFaqItem() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoFaqItemPayload) => festaDivinoService.faq.criarItem(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoFaqItem() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoFaqItemPayload }) =>
            festaDivinoService.faq.atualizarItem(id, payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoFaqItemStatus() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoStatusPayload }) =>
            festaDivinoService.faq.atualizarStatusItem(id, payload),
        onSuccess: invalidate,
    });
}

export function useReorderFestaDivinoFaqItems() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoReorderPayload) => festaDivinoService.faq.reordenarItems(payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoFaqItem() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.faq.removerItem(id),
        onSuccess: invalidate,
    });
}

export function useCreateFestaDivinoBrinquedo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (payload: FestaDivinoBrinquedoPayload) => festaDivinoService.brinquedos.criar(payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoBrinquedo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoBrinquedoPayload }) =>
            festaDivinoService.brinquedos.atualizar(id, payload),
        onSuccess: invalidate,
    });
}

export function useUpdateFestaDivinoBrinquedoStatus() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FestaDivinoStatusPayload }) =>
            festaDivinoService.brinquedos.atualizarStatus(id, payload),
        onSuccess: invalidate,
    });
}

export function useDeleteFestaDivinoBrinquedo() {
    const invalidate = useInvalidateFestaDivino();

    return useMutation({
        mutationFn: (id: number) => festaDivinoService.brinquedos.remover(id),
        onSuccess: invalidate,
    });
}
