import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    HelpCircle,
    History,
    Image as ImageIcon,
    LayoutDashboard,
    Link2,
    Loader2,
    Package,
    Pencil,
    Plus,
    Trash2,
    Utensils,
    Video,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import showToast from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    DataPanel,
    EmptyRows,
    LoadingRows,
    MetricCard,
    SearchBar,
    SectionNav,
    StatusBadge,
    type FestaDivinoListQuery,
    type FestaDivinoSectionItem,
} from "@/features/festa-divino/components/FestaDivinoAdminShell";
import {
    useFestaDivinoAudit,
    useFestaDivinoBrinquedos,
    useFestaDivinoCardapio,
    useFestaDivinoConteudo,
    useFestaDivinoDashboard,
    useFestaDivinoDiasFesta,
    useFestaDivinoEdicoes,
    useFestaDivinoFaq,
    useFestaDivinoHealth,
    useFestaDivinoMidia,
    useFestaDivinoProgramacao,
    useCreateFestaDivinoAtracao,
    useCreateFestaDivinoBrinquedo,
    useCreateFestaDivinoCardapioCategoria,
    useCreateFestaDivinoCategoriaEvento,
    useCreateFestaDivinoDiaFesta,
    useCreateFestaDivinoEdicao,
    useCreateFestaDivinoEvento,
    useCreateFestaDivinoFaqCategory,
    useCreateFestaDivinoFaqItem,
    useCreateFestaDivinoLocal,
    useCreateFestaDivinoNoticia,
    useCreateFestaDivinoProduto,
    useCreateFestaDivinoShort,
    useCreateFestaDivinoTexto,
    useCreateFestaDivinoVideo,
    useDeleteFestaDivinoAtracao,
    useDeleteFestaDivinoBrinquedo,
    useDeleteFestaDivinoCardapioCategoria,
    useDeleteFestaDivinoCategoriaEvento,
    useDeleteFestaDivinoDiaFesta,
    useDeleteFestaDivinoEdicao,
    useDeleteFestaDivinoEvento,
    useDeleteFestaDivinoFaqCategory,
    useDeleteFestaDivinoFaqItem,
    useDeleteFestaDivinoLocal,
    useDeleteFestaDivinoNoticia,
    useDeleteFestaDivinoProduto,
    useDeleteFestaDivinoShort,
    useDeleteFestaDivinoTexto,
    useDeleteFestaDivinoVideo,
    useReorderFestaDivinoFaqCategories,
    useReorderFestaDivinoFaqItems,
    useUpdateFestaDivinoAtracao,
    useUpdateFestaDivinoBrinquedo,
    useUpdateFestaDivinoBrinquedoStatus,
    useUpdateFestaDivinoCardapioCategoria,
    useUpdateFestaDivinoCategoriaEvento,
    useUpdateFestaDivinoDiaFesta,
    useUpdateFestaDivinoEdicao,
    useUpdateFestaDivinoEvento,
    useUpdateFestaDivinoEventoStatus,
    useUpdateFestaDivinoFaqCategory,
    useUpdateFestaDivinoFaqCategoryStatus,
    useUpdateFestaDivinoFaqItem,
    useUpdateFestaDivinoFaqItemStatus,
    useUpdateFestaDivinoLocal,
    useUpdateFestaDivinoNoticia,
    useUpdateFestaDivinoProduto,
    useUpdateFestaDivinoShort,
    useUpdateFestaDivinoTexto,
    useUpdateFestaDivinoVideo,
} from "@/features/festa-divino/hooks/useFestaDivino";
import type {
    FestaDivinoAtracao,
    FestaDivinoAuditLog,
    FestaDivinoBrinquedo,
    FestaDivinoBrinquedoPayload,
    FestaDivinoCardapioCategoria,
    FestaDivinoCardapioCategoriaPayload,
    FestaDivinoCategoriaEvento,
    FestaDivinoDiaFesta,
    FestaDivinoDiaFestaPayload,
    FestaDivinoEdition,
    FestaDivinoEditionPayload,
    FestaDivinoEvento,
    FestaDivinoEventoPayload,
    FestaDivinoFaqCategory,
    FestaDivinoFaqCategoryPayload,
    FestaDivinoFaqItem,
    FestaDivinoFaqItemPayload,
    FestaDivinoLocal,
    FestaDivinoNoticia,
    FestaDivinoNoticiaPayload,
    FestaDivinoProduto,
    FestaDivinoProdutoPayload,
    FestaDivinoSection,
    FestaDivinoTexto,
    FestaDivinoTextoPayload,
    FestaDivinoVideo,
    FestaDivinoVideoPayload,
} from "@/features/festa-divino/types";
import {
    getFestaDivinoApiMessage,
    getFestaDivinoFieldErrors,
    type FestaDivinoFieldErrors,
} from "@/features/festa-divino/utils/festaDivinoApiErrors";
import {
    countActive,
    formatFestaDivinoCurrency,
    formatFestaDivinoDate,
    formatFestaDivinoDateTime,
    formatFestaDivinoTimeRange,
    normalizeFestaDivinoAssetUrl,
} from "@/features/festa-divino/utils/festaDivinoFormatters";

const sections: FestaDivinoSectionItem[] = [
    { id: "dashboard", label: "Painel", path: "/festa-divino", icon: LayoutDashboard },
    { id: "edicao", label: "Edicao", path: "/festa-divino/edicao", icon: Calendar },
    { id: "programacao", label: "Programacao", path: "/festa-divino/programacao", icon: Calendar },
    { id: "cardapio", label: "Cardapio", path: "/festa-divino/cardapio", icon: Utensils },
    { id: "conteudo", label: "Conteudo", path: "/festa-divino/conteudo", icon: FileText },
    { id: "midia", label: "Midia", path: "/festa-divino/midia", icon: Video },
    { id: "faq", label: "FAQ", path: "/festa-divino/faq", icon: HelpCircle },
    { id: "brinquedos", label: "Brinquedos", path: "/festa-divino/brinquedos", icon: Package },
    { id: "auditoria", label: "Auditoria", path: "/festa-divino/auditoria", icon: History },
    { id: "health", label: "Health", path: "/festa-divino/health", icon: Activity },
];

const countLabels: Record<string, string> = {
    edicoes: "Edicoes",
    dias_festa: "Dias",
    programacao_eventos: "Eventos",
    categorias_evento: "Categorias",
    locais: "Locais",
    atracoes: "Atracoes",
    produtos: "Produtos",
    cardapio_categorias: "Cat. cardapio",
    noticias: "Noticias",
    textos: "Textos",
    videos: "Videos",
    shorts: "Shorts",
    faq_categorias: "Cat. FAQ",
    faq_items: "Perguntas",
    brinquedos: "Brinquedos",
};

const alertLabels: Record<string, string> = {
    events_without_attractions: "Eventos sem atracoes",
    dias_festa_empty: "Dias da festa sem cadastro",
};

function DashboardSection() {
    const dashboard = useFestaDivinoDashboard();
    const health = useFestaDivinoHealth();
    const data = dashboard.data?.data;
    const counts = data?.counts ?? {};

    const primaryCounts = [
        ["programacao_eventos", Calendar],
        ["produtos", Utensils],
        ["noticias", FileText],
        ["videos", Video],
        ["faq_items", HelpCircle],
        ["brinquedos", Package],
    ] as const;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {primaryCounts.map(([key, icon]) => (
                    <MetricCard key={key} label={countLabels[key]} value={counts[key] ?? 0} icon={icon} />
                ))}
            </div>

            <section className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Edicao ativa</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Referencia principal para conferir o periodo publico da festa.
                        </p>
                    </div>
                    <Badge variant={data?.mode === "write_enabled" ? "destructive" : "secondary"}>
                        {data?.mode === "write_enabled" ? "Escrita habilitada" : "Somente leitura"}
                    </Badge>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                        <p className="text-xs uppercase text-muted-foreground">Titulo</p>
                        <p className="font-medium">{data?.active_edition?.titulo ?? "Nao encontrada"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-muted-foreground">Programacao</p>
                        <p className="font-medium">
                            {formatFestaDivinoDate(data?.active_edition?.data_inicio_programacao)} ate{" "}
                            {formatFestaDivinoDate(data?.active_edition?.data_fim_programacao)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-muted-foreground">Festejos</p>
                        <p className="font-medium">
                            {formatFestaDivinoDate(data?.active_edition?.data_inicio_festejos)} ate{" "}
                            {formatFestaDivinoDate(data?.active_edition?.data_fim_festejos)}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                {Object.entries(data?.alerts ?? {}).map(([key, alert]) => (
                    <div key={key} className="rounded-lg border border-border/60 bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", alert.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">{alertLabels[key] ?? key.replace(/_/g, " ")}</p>
                                    <p className="text-sm text-muted-foreground">Alerta operacional do banco externo</p>
                                </div>
                            </div>
                            <p className="text-2xl font-semibold">{alert.count}</p>
                        </div>
                    </div>
                ))}

                <div className="rounded-lg border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", health.data?.data.status === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                {health.data?.data.status === "ok" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-medium">Conexao externa</p>
                                <p className="text-sm text-muted-foreground">
                                    {health.data?.data.connections.read.driver ?? "driver"} {health.data?.data.connections.read.version ?? ""}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm font-medium">{health.data?.data.connections.read.latency_ms ?? 0} ms</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

type ProgramacaoDialogState =
    | { type: "categoria"; item?: FestaDivinoCategoriaEvento }
    | { type: "local"; item?: FestaDivinoLocal }
    | { type: "atracao"; item?: FestaDivinoAtracao };

type ProgramacaoFormState = Record<string, string>;

const emptyProgramacaoForm: ProgramacaoFormState = {
    nome: "",
    descricao: "",
    icone: "",
    cor: "",
    endereco: "",
    latitude: "",
    longitude: "",
    imagem_url: "",
    acessibilidade: "",
    tipo: "",
};

function apiErrorMessage(error: unknown): string {
    return getFestaDivinoApiMessage(error);
}

function FieldError({ error }: { error?: string }) {
    if (!error) {
        return null;
    }

    return <p className="text-xs font-medium text-destructive">{error}</p>;
}

type EdicaoDialogState = { item?: FestaDivinoEdition };
type DiaFestaDialogState = { item?: FestaDivinoDiaFesta };

const emptyEdicaoForm = {
    ano: "",
    titulo: "",
    data_inicio_programacao: "",
    data_fim_programacao: "",
    data_inicio_festejos: "",
    data_fim_festejos: "",
    bandeireira_imperial: "",
    comissao_organizadora: "",
    texto_convite_principal: "",
    imagem_cartaz_url: "",
    tema_geral: "",
};

function EdicaoCrudDialog({
    state,
    onClose,
}: {
    state: EdicaoDialogState | null;
    onClose: () => void;
}) {
    const [form, setForm] = useState(emptyEdicaoForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createEdicao = useCreateFestaDivinoEdicao();
    const updateEdicao = useUpdateFestaDivinoEdicao();

    useEffect(() => {
        if (!state) {
            setForm(emptyEdicaoForm);
            setErrors({});
            return;
        }

        setErrors({});
        setForm({
            ano: state.item?.ano ? String(state.item.ano) : "",
            titulo: state.item?.titulo ?? "",
            data_inicio_programacao: state.item?.data_inicio_programacao ?? "",
            data_fim_programacao: state.item?.data_fim_programacao ?? "",
            data_inicio_festejos: state.item?.data_inicio_festejos ?? "",
            data_fim_festejos: state.item?.data_fim_festejos ?? "",
            bandeireira_imperial: state.item?.bandeireira_imperial ?? "",
            comissao_organizadora: state.item?.comissao_organizadora ?? "",
            texto_convite_principal: state.item?.texto_convite_principal ?? "",
            imagem_cartaz_url: state.item?.imagem_cartaz_url ?? "",
            tema_geral: state.item?.tema_geral ?? "",
        });
    }, [state]);

    const updateField = (field: keyof typeof emptyEdicaoForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const payload = (): FestaDivinoEditionPayload => ({
        ano: Number(form.ano),
        titulo: form.titulo,
        data_inicio_programacao: form.data_inicio_programacao,
        data_fim_programacao: form.data_fim_programacao,
        data_inicio_festejos: form.data_inicio_festejos,
        data_fim_festejos: form.data_fim_festejos,
        bandeireira_imperial: form.bandeireira_imperial || null,
        comissao_organizadora: form.comissao_organizadora || null,
        texto_convite_principal: form.texto_convite_principal || null,
        imagem_cartaz_url: form.imagem_cartaz_url || null,
        tema_geral: form.tema_geral || null,
    });

    const isSaving = createEdicao.isPending || updateEdicao.isPending;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            if (state.item) {
                await updateEdicao.mutateAsync({ id: state.item.id, payload: payload() });
            } else {
                await createEdicao.mutateAsync(payload());
            }
            showToast.success("Edicao salva.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{state?.item ? "Editar edicao" : "Nova edicao"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="edicao_ano">Ano</Label>
                            <Input
                                id="edicao_ano"
                                type="number"
                                min="2000"
                                max="2100"
                                value={form.ano}
                                onChange={(event) => updateField("ano", event.target.value)}
                                required
                            />
                            <FieldError error={errors.ano} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_titulo">Titulo</Label>
                            <Input
                                id="edicao_titulo"
                                value={form.titulo}
                                onChange={(event) => updateField("titulo", event.target.value)}
                                required
                            />
                            <FieldError error={errors.titulo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_inicio_programacao">Inicio da programacao</Label>
                            <Input
                                id="edicao_inicio_programacao"
                                type="date"
                                value={form.data_inicio_programacao}
                                onChange={(event) => updateField("data_inicio_programacao", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_inicio_programacao} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_fim_programacao">Fim da programacao</Label>
                            <Input
                                id="edicao_fim_programacao"
                                type="date"
                                value={form.data_fim_programacao}
                                onChange={(event) => updateField("data_fim_programacao", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_fim_programacao} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_inicio_festejos">Inicio dos festejos</Label>
                            <Input
                                id="edicao_inicio_festejos"
                                type="date"
                                value={form.data_inicio_festejos}
                                onChange={(event) => updateField("data_inicio_festejos", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_inicio_festejos} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_fim_festejos">Fim dos festejos</Label>
                            <Input
                                id="edicao_fim_festejos"
                                type="date"
                                value={form.data_fim_festejos}
                                onChange={(event) => updateField("data_fim_festejos", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_fim_festejos} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_tema">Tema</Label>
                            <Input
                                id="edicao_tema"
                                value={form.tema_geral}
                                onChange={(event) => updateField("tema_geral", event.target.value)}
                            />
                            <FieldError error={errors.tema_geral} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edicao_bandeireira">Bandeireira imperial</Label>
                            <Input
                                id="edicao_bandeireira"
                                value={form.bandeireira_imperial}
                                onChange={(event) => updateField("bandeireira_imperial", event.target.value)}
                            />
                            <FieldError error={errors.bandeireira_imperial} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edicao_cartaz">URL do cartaz</Label>
                            <Input
                                id="edicao_cartaz"
                                value={form.imagem_cartaz_url}
                                onChange={(event) => updateField("imagem_cartaz_url", event.target.value)}
                                placeholder="https://..."
                            />
                            <FieldError error={errors.imagem_cartaz_url} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edicao_comissao">Comissao organizadora</Label>
                            <Textarea
                                id="edicao_comissao"
                                value={form.comissao_organizadora}
                                onChange={(event) => updateField("comissao_organizadora", event.target.value)}
                                rows={3}
                            />
                            <FieldError error={errors.comissao_organizadora} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edicao_convite">Texto de convite</Label>
                            <Textarea
                                id="edicao_convite"
                                value={form.texto_convite_principal}
                                onChange={(event) => updateField("texto_convite_principal", event.target.value)}
                                rows={4}
                            />
                            <FieldError error={errors.texto_convite_principal} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar edicao
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DiaFestaCrudDialog({
    state,
    edicoes,
    defaultEdicaoId,
    onClose,
}: {
    state: DiaFestaDialogState | null;
    edicoes: FestaDivinoEdition[];
    defaultEdicaoId?: number;
    onClose: () => void;
}) {
    const [form, setForm] = useState({ edicao_id: "", data_evento: "", nome: "", descricao: "" });
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createDia = useCreateFestaDivinoDiaFesta();
    const updateDia = useUpdateFestaDivinoDiaFesta();

    useEffect(() => {
        if (!state) {
            setForm({ edicao_id: defaultEdicaoId ? String(defaultEdicaoId) : "", data_evento: "", nome: "", descricao: "" });
            setErrors({});
            return;
        }

        setErrors({});
        setForm({
            edicao_id: String(state.item?.edicao_id ?? defaultEdicaoId ?? ""),
            data_evento: state.item?.data_evento ?? "",
            nome: state.item?.nome ?? "",
            descricao: state.item?.descricao ?? "",
        });
    }, [defaultEdicaoId, state]);

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const payload = (): FestaDivinoDiaFestaPayload => ({
        edicao_id: Number(form.edicao_id),
        data_evento: form.data_evento,
        nome: form.nome,
        descricao: form.descricao || null,
    });

    const isSaving = createDia.isPending || updateDia.isPending;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            if (state.item) {
                await updateDia.mutateAsync({ id: state.item.id, payload: payload() });
            } else {
                await createDia.mutateAsync(payload());
            }
            showToast.success("Dia salvo.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{state?.item ? "Editar dia" : "Novo dia"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="dia_edicao">Edicao</Label>
                            <select
                                id="dia_edicao"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.edicao_id}
                                onChange={(event) => updateField("edicao_id", event.target.value)}
                                required
                            >
                                <option value="">Selecione</option>
                                {edicoes.map((edicao) => (
                                    <option key={edicao.id} value={edicao.id}>
                                        {edicao.titulo}
                                    </option>
                                ))}
                            </select>
                            <FieldError error={errors.edicao_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dia_data">Data</Label>
                            <Input
                                id="dia_data"
                                type="date"
                                value={form.data_evento}
                                onChange={(event) => updateField("data_evento", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_evento} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="dia_nome">Nome do dia</Label>
                            <Input
                                id="dia_nome"
                                value={form.nome}
                                onChange={(event) => updateField("nome", event.target.value)}
                                required
                            />
                            <FieldError error={errors.nome} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="dia_descricao">Descricao</Label>
                            <Textarea
                                id="dia_descricao"
                                value={form.descricao}
                                onChange={(event) => updateField("descricao", event.target.value)}
                                rows={4}
                            />
                            <FieldError error={errors.descricao} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar dia
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EdicaoSection({
    edicoes,
    dias,
    defaultEdicaoId,
}: {
    edicoes: FestaDivinoListQuery<FestaDivinoEdition>;
    dias: FestaDivinoListQuery<FestaDivinoDiaFesta>;
    defaultEdicaoId?: number;
}) {
    const [edicaoDialog, setEdicaoDialog] = useState<EdicaoDialogState | null>(null);
    const [diaDialog, setDiaDialog] = useState<DiaFestaDialogState | null>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const deleteEdicao = useDeleteFestaDivinoEdicao();
    const deleteDia = useDeleteFestaDivinoDiaFesta();
    const edicoesData = edicoes.data?.data ?? [];

    const confirmDeleteEdicao = (edicao: FestaDivinoEdition) => {
        confirm({
            title: "Excluir edicao?",
            description:
                "A edicao so sera removida se nao tiver eventos ou dias vinculados. Essa acao afeta o site publico.",
            confirmText: "Excluir edicao",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteEdicao.mutateAsync(edicao.id);
                    showToast.success("Edicao removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const confirmDeleteDia = (dia: FestaDivinoDiaFesta) => {
        confirm({
            title: "Excluir dia da festa?",
            description: `O dia "${dia.nome}" sera removido da gestao editorial da programacao.`,
            confirmText: "Excluir dia",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteDia.mutateAsync(dia.id);
                    showToast.success("Dia removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    return (
        <div className="space-y-6">
            <ConfirmDialogRenderer {...dialogProps} />
            <EdicaoCrudDialog state={edicaoDialog} onClose={() => setEdicaoDialog(null)} />
            <DiaFestaCrudDialog
                state={diaDialog}
                edicoes={edicoesData}
                defaultEdicaoId={defaultEdicaoId}
                onClose={() => setDiaDialog(null)}
            />

            <DataPanel
                title="Edicoes"
                description="Ano, periodo da programacao, festejos e textos principais da festa."
                query={edicoes}
                headerAction={
                    <Button size="sm" onClick={() => setEdicaoDialog({})}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova edicao
                    </Button>
                }
                columns={[
                    { label: "Ano" },
                    { label: "Titulo" },
                    { label: "Programacao" },
                    { label: "Festejos" },
                    { label: "Vinculos" },
                    { label: "Acoes" },
                ]}
                renderRow={(edicao) => (
                    <TableRow key={edicao.id}>
                        <TableCell className="font-medium">{edicao.ano}</TableCell>
                        <TableCell>
                            <div className="font-medium">{edicao.titulo}</div>
                            <div className="text-xs text-muted-foreground">{edicao.tema_geral ?? "Sem tema informado"}</div>
                        </TableCell>
                        <TableCell>
                            {formatFestaDivinoDate(edicao.data_inicio_programacao)} ate{" "}
                            {formatFestaDivinoDate(edicao.data_fim_programacao)}
                        </TableCell>
                        <TableCell>
                            {formatFestaDivinoDate(edicao.data_inicio_festejos)} ate{" "}
                            {formatFestaDivinoDate(edicao.data_fim_festejos)}
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{edicao.eventos_count ?? 0} eventos</div>
                            <div className="text-xs text-muted-foreground">{edicao.dias_count ?? 0} dias</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" title="Editar" onClick={() => setEdicaoDialog({ item: edicao })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    onClick={() => confirmDeleteEdicao(edicao)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />

            <DataPanel
                title="Dias da festa"
                description="Dias editoriais usados para destacar cada data da programacao publica."
                query={dias}
                headerAction={
                    <Button size="sm" onClick={() => setDiaDialog({})}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo dia
                    </Button>
                }
                columns={[
                    { label: "Data" },
                    { label: "Dia" },
                    { label: "Edicao" },
                    { label: "Descricao" },
                    { label: "Acoes" },
                ]}
                renderRow={(dia) => (
                    <TableRow key={dia.id}>
                        <TableCell>{formatFestaDivinoDate(dia.data_evento)}</TableCell>
                        <TableCell className="font-medium">{dia.nome}</TableCell>
                        <TableCell>{dia.edicao?.titulo ?? `#${dia.edicao_id}`}</TableCell>
                        <TableCell className="max-w-md truncate">{dia.descricao ?? "Sem descricao"}</TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" title="Editar" onClick={() => setDiaDialog({ item: dia })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" title="Excluir" onClick={() => confirmDeleteDia(dia)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
        </div>
    );
}

function ProgramacaoCrudDialog({
    state,
    onClose,
}: {
    state: ProgramacaoDialogState | null;
    onClose: () => void;
}) {
    const [form, setForm] = useState<ProgramacaoFormState>(emptyProgramacaoForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createCategory = useCreateFestaDivinoCategoriaEvento();
    const updateCategory = useUpdateFestaDivinoCategoriaEvento();
    const createLocal = useCreateFestaDivinoLocal();
    const updateLocal = useUpdateFestaDivinoLocal();
    const createAtracao = useCreateFestaDivinoAtracao();
    const updateAtracao = useUpdateFestaDivinoAtracao();

    useEffect(() => {
        if (!state) {
            setForm(emptyProgramacaoForm);
            setErrors({});
            return;
        }

        setErrors({});
        if (state.type === "categoria") {
            setForm({
                ...emptyProgramacaoForm,
                nome: state.item?.nome ?? "",
                descricao: state.item?.descricao ?? "",
                icone: state.item?.icone ?? "",
                cor: state.item?.cor ?? "",
            });
        }

        if (state.type === "local") {
            setForm({
                ...emptyProgramacaoForm,
                nome: state.item?.nome ?? "",
                endereco: state.item?.endereco ?? "",
                latitude: state.item?.latitude ? String(state.item.latitude) : "",
                longitude: state.item?.longitude ? String(state.item.longitude) : "",
                descricao: state.item?.descricao ?? "",
                imagem_url: state.item?.imagem_url ?? "",
                acessibilidade: state.item?.acessibilidade ?? "",
            });
        }

        if (state.type === "atracao") {
            setForm({
                ...emptyProgramacaoForm,
                nome: state.item?.nome ?? "",
                tipo: state.item?.tipo ?? "",
                descricao: state.item?.descricao ?? "",
                imagem_url: state.item?.imagem_url ?? "",
            });
        }
    }, [state]);

    const updateField = (field: string, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const isSaving =
        createCategory.isPending ||
        updateCategory.isPending ||
        createLocal.isPending ||
        updateLocal.isPending ||
        createAtracao.isPending ||
        updateAtracao.isPending;

    const title = state
        ? `${state.item ? "Editar" : "Novo"} ${
              state.type === "categoria" ? "categoria" : state.type === "local" ? "local" : "atracao"
          }`
        : "";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            if (state.type === "categoria") {
                const payload = {
                    nome: form.nome,
                    descricao: form.descricao || null,
                    icone: form.icone || null,
                    cor: form.cor || null,
                };

                if (state.item) {
                    await updateCategory.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createCategory.mutateAsync(payload);
                }
            }

            if (state.type === "local") {
                const payload = {
                    nome: form.nome,
                    endereco: form.endereco || null,
                    latitude: form.latitude || null,
                    longitude: form.longitude || null,
                    descricao: form.descricao || null,
                    imagem_url: form.imagem_url || null,
                    acessibilidade: form.acessibilidade || null,
                };

                if (state.item) {
                    await updateLocal.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createLocal.mutateAsync(payload);
                }
            }

            if (state.type === "atracao") {
                const payload = {
                    nome: form.nome,
                    tipo: form.tipo || null,
                    descricao: form.descricao || null,
                    imagem_url: form.imagem_url || null,
                };

                if (state.item) {
                    await updateAtracao.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createAtracao.mutateAsync(payload);
                }
            }

            showToast.success("Registro salvo.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={form.nome}
                                onChange={(event) => updateField("nome", event.target.value)}
                                required
                            />
                            <FieldError error={errors.nome} />
                        </div>

                        {state?.type === "categoria" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="icone">Icone</Label>
                                    <Input
                                        id="icone"
                                        value={form.icone}
                                        onChange={(event) => updateField("icone", event.target.value)}
                                        placeholder="Ex.: Church"
                                    />
                                    <FieldError error={errors.icone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cor">Cor</Label>
                                    <Input
                                        id="cor"
                                        value={form.cor}
                                        onChange={(event) => updateField("cor", event.target.value)}
                                        placeholder="#AA0000"
                                    />
                                    <FieldError error={errors.cor} />
                                </div>
                            </>
                        ) : null}

                        {state?.type === "local" ? (
                            <>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="endereco">Endereco</Label>
                                    <Input
                                        id="endereco"
                                        value={form.endereco}
                                        onChange={(event) => updateField("endereco", event.target.value)}
                                    />
                                    <FieldError error={errors.endereco} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        value={form.latitude}
                                        onChange={(event) => updateField("latitude", event.target.value)}
                                        placeholder="-27.12345678"
                                    />
                                    <FieldError error={errors.latitude} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        value={form.longitude}
                                        onChange={(event) => updateField("longitude", event.target.value)}
                                        placeholder="-48.12345678"
                                    />
                                    <FieldError error={errors.longitude} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="acessibilidade">Acessibilidade</Label>
                                    <Input
                                        id="acessibilidade"
                                        value={form.acessibilidade}
                                        onChange={(event) => updateField("acessibilidade", event.target.value)}
                                    />
                                    <FieldError error={errors.acessibilidade} />
                                </div>
                            </>
                        ) : null}

                        {state?.type === "atracao" ? (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="tipo">Tipo</Label>
                                <Input
                                    id="tipo"
                                    value={form.tipo}
                                    onChange={(event) => updateField("tipo", event.target.value)}
                                    placeholder="Ex.: Musica"
                                />
                                <FieldError error={errors.tipo} />
                            </div>
                        ) : null}

                        {state?.type !== "categoria" ? (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="imagem_url">URL da imagem</Label>
                                <Input
                                    id="imagem_url"
                                    value={form.imagem_url}
                                    onChange={(event) => updateField("imagem_url", event.target.value)}
                                    placeholder="https://..."
                                />
                                <FieldError error={errors.imagem_url} />
                            </div>
                        ) : null}

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="descricao">Descricao</Label>
                            <Textarea
                                id="descricao"
                                value={form.descricao}
                                onChange={(event) => updateField("descricao", event.target.value)}
                                rows={4}
                            />
                            <FieldError error={errors.descricao} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

type EventoDialogState = { item?: FestaDivinoEvento };

type EventoFormState = {
    titulo: string;
    subtitulo: string;
    descricao: string;
    data_evento: string;
    hora_inicio: string;
    hora_fim: string;
    duracao_estimada_minutos: string;
    local_id: string;
    categoria_id: string;
    tema: string;
    publico_alvo: string;
    evento_pago: boolean;
    valor_ingresso: string;
    link_ingresso: string;
    observacao_ingresso: string;
    destaque: boolean;
    imagem_destaque_url: string;
    organizador_responsavel: string;
    tags: string;
    ativo: boolean;
};

const emptyEventoForm: EventoFormState = {
    titulo: "",
    subtitulo: "",
    descricao: "",
    data_evento: "",
    hora_inicio: "",
    hora_fim: "",
    duracao_estimada_minutos: "",
    local_id: "",
    categoria_id: "",
    tema: "",
    publico_alvo: "",
    evento_pago: false,
    valor_ingresso: "",
    link_ingresso: "",
    observacao_ingresso: "",
    destaque: false,
    imagem_destaque_url: "",
    organizador_responsavel: "",
    tags: "",
    ativo: true,
};

function toTimeInput(value?: string | null): string {
    return value ? value.slice(0, 5) : "";
}

function EventoCrudDialog({
    state,
    onClose,
    categorias,
    locais,
    atracoes,
    defaultEdicaoId,
}: {
    state: EventoDialogState | null;
    onClose: () => void;
    categorias: FestaDivinoCategoriaEvento[];
    locais: FestaDivinoLocal[];
    atracoes: FestaDivinoAtracao[];
    defaultEdicaoId?: number;
}) {
    const [form, setForm] = useState<EventoFormState>(emptyEventoForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const [selectedAtracoes, setSelectedAtracoes] = useState<number[]>([]);
    const createEvento = useCreateFestaDivinoEvento();
    const updateEvento = useUpdateFestaDivinoEvento();

    useEffect(() => {
        if (!state) {
            setForm(emptyEventoForm);
            setErrors({});
            setSelectedAtracoes([]);
            return;
        }

        setErrors({});
        const item = state.item;
        setForm({
            titulo: item?.titulo ?? "",
            subtitulo: item?.subtitulo ?? "",
            descricao: item?.descricao ?? "",
            data_evento: item?.data_evento ?? "",
            hora_inicio: toTimeInput(item?.hora_inicio),
            hora_fim: toTimeInput(item?.hora_fim),
            duracao_estimada_minutos: item?.duracao_estimada_minutos ? String(item.duracao_estimada_minutos) : "",
            local_id: item?.local_id ? String(item.local_id) : "",
            categoria_id: item?.categoria_id ? String(item.categoria_id) : "",
            tema: item?.tema ?? "",
            publico_alvo: item?.publico_alvo ?? "",
            evento_pago: item?.evento_pago ?? false,
            valor_ingresso: item?.valor_ingresso ? String(item.valor_ingresso) : "",
            link_ingresso: item?.link_ingresso ?? "",
            observacao_ingresso: item?.observacao_ingresso ?? "",
            destaque: item?.destaque ?? false,
            imagem_destaque_url: item?.imagem_destaque_url ?? "",
            organizador_responsavel: item?.organizador_responsavel ?? "",
            tags: item?.tags?.join(", ") ?? "",
            ativo: item?.ativo ?? true,
        });
        setSelectedAtracoes(item?.atracoes?.map((atracao) => atracao.id) ?? []);
    }, [state]);

    const updateField = <K extends keyof EventoFormState>(field: K, value: EventoFormState[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const toggleAtracao = (id: number, checked: boolean) => {
        setSelectedAtracoes((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
    };

    const buildPayload = (): FestaDivinoEventoPayload => ({
        edicao_id: state?.item?.edicao_id ?? defaultEdicaoId ?? 1,
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        descricao: form.descricao || null,
        data_evento: form.data_evento,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim || null,
        duracao_estimada_minutos: form.duracao_estimada_minutos ? Number(form.duracao_estimada_minutos) : null,
        local_id: Number(form.local_id),
        categoria_id: Number(form.categoria_id),
        tema: form.tema || null,
        publico_alvo: form.publico_alvo || null,
        evento_pago: form.evento_pago,
        valor_ingresso: form.evento_pago && form.valor_ingresso ? form.valor_ingresso.replace(",", ".") : null,
        link_ingresso: form.link_ingresso || null,
        observacao_ingresso: form.observacao_ingresso || null,
        destaque: form.destaque,
        imagem_destaque_url: form.imagem_destaque_url || null,
        organizador_responsavel: form.organizador_responsavel || null,
        tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ativo: form.ativo,
        atracoes: selectedAtracoes.map((id, index) => ({
            id,
            ordem_apresentacao: index + 1,
        })),
    });

    const isSaving = createEvento.isPending || updateEvento.isPending;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            const payload = buildPayload();
            if (state.item) {
                await updateEvento.mutateAsync({ id: state.item.id, payload });
            } else {
                await createEvento.mutateAsync(payload);
            }
            showToast.success("Evento salvo.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{state?.item ? "Editar evento" : "Novo evento"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="evento_titulo">Titulo</Label>
                            <Input
                                id="evento_titulo"
                                value={form.titulo}
                                onChange={(event) => updateField("titulo", event.target.value)}
                                required
                            />
                            <FieldError error={errors.titulo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_data">Data</Label>
                            <Input
                                id="evento_data"
                                type="date"
                                value={form.data_evento}
                                onChange={(event) => updateField("data_evento", event.target.value)}
                                required
                            />
                            <FieldError error={errors.data_evento} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="evento_inicio">Inicio</Label>
                                <Input
                                    id="evento_inicio"
                                    type="time"
                                    value={form.hora_inicio}
                                    onChange={(event) => updateField("hora_inicio", event.target.value)}
                                    required
                                />
                                <FieldError error={errors.hora_inicio} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="evento_fim">Fim</Label>
                                <Input
                                    id="evento_fim"
                                    type="time"
                                    value={form.hora_fim}
                                    onChange={(event) => updateField("hora_fim", event.target.value)}
                                />
                                <FieldError error={errors.hora_fim} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_local">Local</Label>
                            <select
                                id="evento_local"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.local_id}
                                onChange={(event) => updateField("local_id", event.target.value)}
                                required
                            >
                                <option value="">Selecione</option>
                                {locais.map((local) => (
                                    <option key={local.id} value={local.id}>
                                        {local.nome}
                                    </option>
                                ))}
                            </select>
                            <FieldError error={errors.local_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_categoria">Categoria</Label>
                            <select
                                id="evento_categoria"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.categoria_id}
                                onChange={(event) => updateField("categoria_id", event.target.value)}
                                required
                            >
                                <option value="">Selecione</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria.id} value={categoria.id}>
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>
                            <FieldError error={errors.categoria_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_subtitulo">Subtitulo</Label>
                            <Input
                                id="evento_subtitulo"
                                value={form.subtitulo}
                                onChange={(event) => updateField("subtitulo", event.target.value)}
                            />
                            <FieldError error={errors.subtitulo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_duracao">Duracao em minutos</Label>
                            <Input
                                id="evento_duracao"
                                type="number"
                                min="1"
                                value={form.duracao_estimada_minutos}
                                onChange={(event) => updateField("duracao_estimada_minutos", event.target.value)}
                            />
                            <FieldError error={errors.duracao_estimada_minutos} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_tema">Tema</Label>
                            <Input id="evento_tema" value={form.tema} onChange={(event) => updateField("tema", event.target.value)} />
                            <FieldError error={errors.tema} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_publico">Publico</Label>
                            <Input
                                id="evento_publico"
                                value={form.publico_alvo}
                                onChange={(event) => updateField("publico_alvo", event.target.value)}
                            />
                            <FieldError error={errors.publico_alvo} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="evento_descricao">Descricao</Label>
                            <Textarea
                                id="evento_descricao"
                                value={form.descricao}
                                onChange={(event) => updateField("descricao", event.target.value)}
                                rows={4}
                            />
                            <FieldError error={errors.descricao} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_tags">Tags</Label>
                            <Input
                                id="evento_tags"
                                value={form.tags}
                                onChange={(event) => updateField("tags", event.target.value)}
                                placeholder="missa, familia, domingo"
                            />
                            <FieldError error={errors.tags} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_imagem">Imagem de destaque</Label>
                            <Input
                                id="evento_imagem"
                                value={form.imagem_destaque_url}
                                onChange={(event) => updateField("imagem_destaque_url", event.target.value)}
                                placeholder="https://..."
                            />
                            <FieldError error={errors.imagem_destaque_url} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_valor">Valor do ingresso</Label>
                            <Input
                                id="evento_valor"
                                value={form.valor_ingresso}
                                onChange={(event) => updateField("valor_ingresso", event.target.value)}
                                disabled={!form.evento_pago}
                                placeholder="15,00"
                            />
                            <FieldError error={errors.valor_ingresso} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evento_link">Link do ingresso</Label>
                            <Input
                                id="evento_link"
                                value={form.link_ingresso}
                                onChange={(event) => updateField("link_ingresso", event.target.value)}
                                disabled={!form.evento_pago}
                                placeholder="https://..."
                            />
                            <FieldError error={errors.link_ingresso} />
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="evento_ativo">Ativo</Label>
                            <Switch
                                id="evento_ativo"
                                checked={form.ativo}
                                onCheckedChange={(checked) => updateField("ativo", checked)}
                            />
                            <FieldError error={errors.ativo} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="evento_destaque">Destaque</Label>
                            <Switch
                                id="evento_destaque"
                                checked={form.destaque}
                                onCheckedChange={(checked) => updateField("destaque", checked)}
                            />
                            <FieldError error={errors.destaque} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="evento_pago">Evento pago</Label>
                            <Switch
                                id="evento_pago"
                                checked={form.evento_pago}
                                onCheckedChange={(checked) => updateField("evento_pago", checked)}
                            />
                            <FieldError error={errors.evento_pago} />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-border/60 p-4">
                        <div>
                            <h3 className="text-sm font-semibold">Atracoes vinculadas</h3>
                            <p className="text-sm text-muted-foreground">Marque as atracoes que aparecem neste evento.</p>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {atracoes.map((atracao) => (
                                <label
                                    key={atracao.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border/60 p-3 text-sm"
                                >
                                    <Checkbox
                                        checked={selectedAtracoes.includes(atracao.id)}
                                        onCheckedChange={(checked) => toggleAtracao(atracao.id, checked === true)}
                                    />
                                    <span>
                                        <span className="font-medium">{atracao.nome}</span>
                                        <span className="ml-2 text-muted-foreground">{atracao.tipo ?? "Sem tipo"}</span>
                                    </span>
                                </label>
                            ))}
                            {atracoes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma atracao cadastrada.</p>
                            ) : null}
                        </div>
                        <FieldError error={errors.atracoes} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar evento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProgramacaoSection({
    eventos,
    categorias,
    locais,
    atracoes,
    defaultEdicaoId,
}: {
    eventos: FestaDivinoListQuery<FestaDivinoEvento>;
    categorias: FestaDivinoListQuery<FestaDivinoCategoriaEvento>;
    locais: FestaDivinoListQuery<FestaDivinoLocal>;
    atracoes: FestaDivinoListQuery<FestaDivinoAtracao>;
    defaultEdicaoId?: number;
}) {
    const [dialog, setDialog] = useState<ProgramacaoDialogState | null>(null);
    const [eventoDialog, setEventoDialog] = useState<EventoDialogState | null>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const deleteCategory = useDeleteFestaDivinoCategoriaEvento();
    const deleteLocal = useDeleteFestaDivinoLocal();
    const deleteAtracao = useDeleteFestaDivinoAtracao();
    const deleteEvento = useDeleteFestaDivinoEvento();
    const updateEventoStatus = useUpdateFestaDivinoEventoStatus();

    const confirmDelete = (type: ProgramacaoDialogState["type"], id: number, name: string) => {
        confirm({
            title: "Excluir registro?",
            description: `O registro "${name}" so sera removido se nao houver eventos vinculados.`,
            confirmText: "Excluir",
            variant: "danger",
            onConfirm: async () => {
                try {
                    if (type === "categoria") {
                        await deleteCategory.mutateAsync(id);
                    }
                    if (type === "local") {
                        await deleteLocal.mutateAsync(id);
                    }
                    if (type === "atracao") {
                        await deleteAtracao.mutateAsync(id);
                    }
                    showToast.success("Registro removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const confirmDeleteEvento = (evento: FestaDivinoEvento) => {
        confirm({
            title: "Excluir evento?",
            description: `O evento "${evento.titulo}" sera removido da programacao publica.`,
            confirmText: "Excluir evento",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteEvento.mutateAsync(evento.id);
                    showToast.success("Evento removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const toggleEventoStatus = async (evento: FestaDivinoEvento) => {
        try {
            await updateEventoStatus.mutateAsync({
                id: evento.id,
                payload: { ativo: !evento.ativo, destaque: evento.destaque },
            });
            showToast.success(evento.ativo ? "Evento inativado." : "Evento ativado.");
        } catch (error) {
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialogRenderer {...dialogProps} />
            <ProgramacaoCrudDialog state={dialog} onClose={() => setDialog(null)} />
            <EventoCrudDialog
                state={eventoDialog}
                onClose={() => setEventoDialog(null)}
                categorias={categorias.data?.data ?? []}
                locais={locais.data?.data ?? []}
                atracoes={atracoes.data?.data ?? []}
                defaultEdicaoId={defaultEdicaoId}
            />

            <DataPanel
                title="Eventos"
                description="Agenda publica com local, categoria, destaque e atracoes vinculadas."
                query={eventos}
                headerAction={
                    <Button size="sm" onClick={() => setEventoDialog({})}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo evento
                    </Button>
                }
                columns={[
                    { label: "Data" },
                    { label: "Horario" },
                    { label: "Evento" },
                    { label: "Local" },
                    { label: "Categoria" },
                    { label: "Status" },
                    { label: "Acoes" },
                ]}
                renderRow={(evento) => (
                    <TableRow key={evento.id}>
                        <TableCell>{formatFestaDivinoDate(evento.data_evento)}</TableCell>
                        <TableCell>{formatFestaDivinoTimeRange(evento.hora_inicio, evento.hora_fim)}</TableCell>
                        <TableCell>
                            <div className="font-medium">{evento.titulo}</div>
                            <div className="text-xs text-muted-foreground">
                                {evento.destaque ? "Destaque" : "Agenda"} · {evento.atracoes?.length ?? 0} atracao(oes)
                            </div>
                        </TableCell>
                        <TableCell>{evento.local?.nome ?? `#${evento.local_id}`}</TableCell>
                        <TableCell>{evento.categoria?.nome ?? `#${evento.categoria_id}`}</TableCell>
                        <TableCell><StatusBadge active={evento.ativo} /></TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Editar"
                                    onClick={() => setEventoDialog({ item: evento })}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title={evento.ativo ? "Inativar" : "Ativar"}
                                    disabled={updateEventoStatus.isPending}
                                    onClick={() => toggleEventoStatus(evento)}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    disabled={deleteEvento.isPending}
                                    onClick={() => confirmDeleteEvento(evento)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />

            <div className="grid gap-6 xl:grid-cols-3">
                <DataPanel
                    title="Categorias"
                    query={categorias}
                    headerAction={
                        <Button size="sm" onClick={() => setDialog({ type: "categoria" })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova
                        </Button>
                    }
                    columns={[{ label: "Nome" }, { label: "Eventos" }, { label: "Acoes" }]}
                    renderRow={(categoria) => (
                        <TableRow key={categoria.id}>
                            <TableCell className="font-medium">{categoria.nome}</TableCell>
                            <TableCell>{categoria.eventos_count ?? 0}</TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Editar"
                                        onClick={() => setDialog({ type: "categoria", item: categoria })}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Excluir"
                                        onClick={() => confirmDelete("categoria", categoria.id, categoria.nome)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                />
                <DataPanel
                    title="Locais"
                    query={locais}
                    headerAction={
                        <Button size="sm" onClick={() => setDialog({ type: "local" })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo
                        </Button>
                    }
                    columns={[{ label: "Local" }, { label: "Eventos" }, { label: "Acoes" }]}
                    renderRow={(local) => (
                        <TableRow key={local.id}>
                            <TableCell>
                                <div className="font-medium">{local.nome}</div>
                                <div className="text-xs text-muted-foreground">{local.endereco ?? "Sem endereco"}</div>
                            </TableCell>
                            <TableCell>{local.eventos_count ?? 0}</TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Editar"
                                        onClick={() => setDialog({ type: "local", item: local })}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Excluir"
                                        onClick={() => confirmDelete("local", local.id, local.nome)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                />
                <DataPanel
                    title="Atracoes"
                    query={atracoes}
                    headerAction={
                        <Button size="sm" onClick={() => setDialog({ type: "atracao" })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova
                        </Button>
                    }
                    columns={[{ label: "Atracao" }, { label: "Eventos" }, { label: "Acoes" }]}
                    renderRow={(atracao) => (
                        <TableRow key={atracao.id}>
                            <TableCell>
                                <div className="font-medium">{atracao.nome}</div>
                                <div className="text-xs text-muted-foreground">{atracao.tipo ?? "Tipo nao informado"}</div>
                            </TableCell>
                            <TableCell>{atracao.eventos_count ?? 0}</TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Editar"
                                        onClick={() => setDialog({ type: "atracao", item: atracao })}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Excluir"
                                        onClick={() => confirmDelete("atracao", atracao.id, atracao.nome)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </div>
        </div>
    );
}

type CardapioDialogState =
    | { type: "categoria"; item?: FestaDivinoCardapioCategoria }
    | { type: "produto"; item?: FestaDivinoProduto };

type CardapioFormState = {
    nome: string;
    icone: string;
    preco: string;
    foto: string;
    categoria_id: string;
};

const emptyCardapioForm: CardapioFormState = {
    nome: "",
    icone: "",
    preco: "",
    foto: "",
    categoria_id: "",
};

function CardapioCrudDialog({
    state,
    categorias,
    onClose,
}: {
    state: CardapioDialogState | null;
    categorias: FestaDivinoCardapioCategoria[];
    onClose: () => void;
}) {
    const [form, setForm] = useState<CardapioFormState>(emptyCardapioForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createCategory = useCreateFestaDivinoCardapioCategoria();
    const updateCategory = useUpdateFestaDivinoCardapioCategoria();
    const createProduto = useCreateFestaDivinoProduto();
    const updateProduto = useUpdateFestaDivinoProduto();

    useEffect(() => {
        if (!state) {
            setForm(emptyCardapioForm);
            setErrors({});
            return;
        }

        setErrors({});
        if (state.type === "categoria") {
            setForm({
                ...emptyCardapioForm,
                nome: state.item?.nome ?? "",
                icone: state.item?.icone ?? "",
            });
        }

        if (state.type === "produto") {
            setForm({
                ...emptyCardapioForm,
                nome: state.item?.nome ?? "",
                preco: state.item?.preco ? String(state.item.preco).replace(".", ",") : "",
                foto: state.item?.foto ?? "",
                categoria_id: state.item?.categoria_id ? String(state.item.categoria_id) : "",
            });
        }
    }, [state]);

    const updateField = (field: keyof CardapioFormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const isSaving = createCategory.isPending || updateCategory.isPending || createProduto.isPending || updateProduto.isPending;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            if (state.type === "categoria") {
                const payload: FestaDivinoCardapioCategoriaPayload = {
                    nome: form.nome,
                    icone: form.icone,
                };

                if (state.item) {
                    await updateCategory.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createCategory.mutateAsync(payload);
                }
            }

            if (state.type === "produto") {
                const payload: FestaDivinoProdutoPayload = {
                    nome: form.nome,
                    preco: form.preco.replace(",", "."),
                    foto: form.foto || null,
                    categoria_id: Number(form.categoria_id),
                };

                if (state.item) {
                    await updateProduto.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createProduto.mutateAsync(payload);
                }
            }

            showToast.success("Registro salvo.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {state?.item ? "Editar" : "Novo"} {state?.type === "categoria" ? "categoria" : "produto"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="cardapio_nome">Nome</Label>
                            <Input
                                id="cardapio_nome"
                                value={form.nome}
                                onChange={(event) => updateField("nome", event.target.value)}
                                required
                            />
                            <FieldError error={errors.nome} />
                        </div>

                        {state?.type === "categoria" ? (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="cardapio_icone">Icone</Label>
                                <Input
                                    id="cardapio_icone"
                                    value={form.icone}
                                    onChange={(event) => updateField("icone", event.target.value)}
                                    placeholder="Ex.: Utensils"
                                    required
                                />
                                <FieldError error={errors.icone} />
                            </div>
                        ) : null}

                        {state?.type === "produto" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="cardapio_preco">Preco</Label>
                                    <Input
                                        id="cardapio_preco"
                                        value={form.preco}
                                        onChange={(event) => updateField("preco", event.target.value)}
                                        placeholder="12,50"
                                        required
                                    />
                                    <FieldError error={errors.preco} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cardapio_categoria">Categoria</Label>
                                    <select
                                        id="cardapio_categoria"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={form.categoria_id}
                                        onChange={(event) => updateField("categoria_id", event.target.value)}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {categorias.map((categoria) => (
                                            <option key={categoria.id} value={categoria.id}>
                                                {categoria.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError error={errors.categoria_id} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="cardapio_foto">Foto</Label>
                                    <Input
                                        id="cardapio_foto"
                                        value={form.foto}
                                        onChange={(event) => updateField("foto", event.target.value)}
                                        placeholder="/assets/produto.jpg ou https://..."
                                    />
                                    <FieldError error={errors.foto} />
                                </div>
                            </>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CardapioSection({
    categorias,
    produtos,
}: {
    categorias: FestaDivinoListQuery<FestaDivinoCardapioCategoria>;
    produtos: FestaDivinoListQuery<FestaDivinoProduto>;
}) {
    const [dialog, setDialog] = useState<CardapioDialogState | null>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const deleteCategory = useDeleteFestaDivinoCardapioCategoria();
    const deleteProduto = useDeleteFestaDivinoProduto();
    const categoryRows = categorias.data?.data ?? [];

    const confirmDeleteCategory = (categoria: FestaDivinoCardapioCategoria) => {
        confirm({
            title: "Excluir categoria?",
            description: `A categoria "${categoria.nome}" so sera removida se nao houver produtos vinculados.`,
            confirmText: "Excluir categoria",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteCategory.mutateAsync(categoria.id);
                    showToast.success("Categoria removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const confirmDeleteProduto = (produto: FestaDivinoProduto) => {
        confirm({
            title: "Excluir produto?",
            description: `O produto "${produto.nome}" sera removido do cardapio publico.`,
            confirmText: "Excluir produto",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteProduto.mutateAsync(produto.id);
                    showToast.success("Produto removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <ConfirmDialogRenderer {...dialogProps} />
            <CardapioCrudDialog state={dialog} categorias={categoryRows} onClose={() => setDialog(null)} />

            <DataPanel
                title="Categorias"
                query={categorias}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "categoria" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova
                    </Button>
                }
                columns={[{ label: "Categoria" }, { label: "Produtos" }, { label: "Acoes" }]}
                renderRow={(categoria) => (
                    <TableRow key={categoria.id}>
                        <TableCell>
                            <div className="font-medium">{categoria.nome}</div>
                            <div className="text-xs text-muted-foreground">{categoria.icone}</div>
                        </TableCell>
                        <TableCell>{categoria.produtos_count ?? 0}</TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Editar"
                                    onClick={() => setDialog({ type: "categoria", item: categoria })}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    disabled={deleteCategory.isPending}
                                    onClick={() => confirmDeleteCategory(categoria)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
            <DataPanel
                title="Produtos"
                description="Itens vendidos no cardapio publico, com preco e categoria."
                query={produtos}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "produto" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo produto
                    </Button>
                }
                columns={[
                    { label: "Produto" },
                    { label: "Categoria" },
                    { label: "Preco" },
                    { label: "Midia" },
                    { label: "Acoes" },
                ]}
                renderRow={(produto) => (
                    <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>{produto.categoria?.nome ?? `#${produto.categoria_id}`}</TableCell>
                        <TableCell>{formatFestaDivinoCurrency(produto.preco)}</TableCell>
                        <TableCell>{produto.foto ? <ImageIcon className="h-4 w-4 text-emerald-600" /> : "Sem foto"}</TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Editar"
                                    onClick={() => setDialog({ type: "produto", item: produto })}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    disabled={deleteProduto.isPending}
                                    onClick={() => confirmDeleteProduto(produto)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
        </div>
    );
}

type ConteudoDialogState =
    | { type: "noticia"; item?: FestaDivinoNoticia }
    | { type: "texto"; item?: FestaDivinoTexto };

type ConteudoFormState = {
    titulo: string;
    linha_apoio: string;
    url: string;
    data_hora_publicacao: string;
    thumb_url: string;
    texto_curto: string;
    texto_detalhado: string;
    categoria: string;
    icone_categoria: string;
};

const emptyConteudoForm: ConteudoFormState = {
    titulo: "",
    linha_apoio: "",
    url: "",
    data_hora_publicacao: "",
    thumb_url: "",
    texto_curto: "",
    texto_detalhado: "",
    categoria: "",
    icone_categoria: "",
};

function toDateTimeInput(value?: string | null): string {
    return value ? value.replace(" ", "T").slice(0, 16) : "";
}

function ConteudoCrudDialog({
    state,
    onClose,
}: {
    state: ConteudoDialogState | null;
    onClose: () => void;
}) {
    const [form, setForm] = useState<ConteudoFormState>(emptyConteudoForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createNoticia = useCreateFestaDivinoNoticia();
    const updateNoticia = useUpdateFestaDivinoNoticia();
    const createTexto = useCreateFestaDivinoTexto();
    const updateTexto = useUpdateFestaDivinoTexto();

    useEffect(() => {
        if (!state) {
            setForm(emptyConteudoForm);
            setErrors({});
            return;
        }

        setErrors({});
        if (state.type === "noticia") {
            setForm({
                ...emptyConteudoForm,
                titulo: state.item?.titulo ?? "",
                linha_apoio: state.item?.linha_apoio ?? "",
                url: state.item?.url ?? "",
                data_hora_publicacao: toDateTimeInput(state.item?.data_hora_publicacao),
                thumb_url: state.item?.thumb_url ?? "",
            });
        }

        if (state.type === "texto") {
            setForm({
                ...emptyConteudoForm,
                texto_curto: state.item?.texto_curto ?? "",
                texto_detalhado: state.item?.texto_detalhado ?? "",
                categoria: state.item?.categoria ?? "",
                icone_categoria: state.item?.icone_categoria ?? "",
            });
        }
    }, [state]);

    const updateField = (field: keyof ConteudoFormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const isSaving = createNoticia.isPending || updateNoticia.isPending || createTexto.isPending || updateTexto.isPending;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            if (state.type === "noticia") {
                const payload: FestaDivinoNoticiaPayload = {
                    titulo: form.titulo,
                    linha_apoio: form.linha_apoio || null,
                    url: form.url,
                    data_hora_publicacao: form.data_hora_publicacao.replace("T", " "),
                    thumb_url: form.thumb_url || null,
                };

                if (state.item) {
                    await updateNoticia.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createNoticia.mutateAsync(payload);
                }
            }

            if (state.type === "texto") {
                const payload: FestaDivinoTextoPayload = {
                    texto_curto: form.texto_curto,
                    texto_detalhado: form.texto_detalhado,
                    categoria: form.categoria,
                    icone_categoria: form.icone_categoria || null,
                };

                if (state.item) {
                    await updateTexto.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createTexto.mutateAsync(payload);
                }
            }

            showToast.success("Registro salvo.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {state?.item ? "Editar" : "Novo"} {state?.type === "noticia" ? "noticia" : "texto"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {state?.type === "noticia" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="noticia_titulo">Titulo</Label>
                                <Input
                                    id="noticia_titulo"
                                    value={form.titulo}
                                    onChange={(event) => updateField("titulo", event.target.value)}
                                    required
                                />
                                <FieldError error={errors.titulo} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="noticia_linha">Linha de apoio</Label>
                                <Textarea
                                    id="noticia_linha"
                                    value={form.linha_apoio}
                                    onChange={(event) => updateField("linha_apoio", event.target.value)}
                                    rows={3}
                                />
                                <FieldError error={errors.linha_apoio} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="noticia_url">Link da noticia</Label>
                                <Input
                                    id="noticia_url"
                                    value={form.url}
                                    onChange={(event) => updateField("url", event.target.value)}
                                    placeholder="https://..."
                                    required
                                />
                                <FieldError error={errors.url} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="noticia_publicacao">Publicacao</Label>
                                <Input
                                    id="noticia_publicacao"
                                    type="datetime-local"
                                    value={form.data_hora_publicacao}
                                    onChange={(event) => updateField("data_hora_publicacao", event.target.value)}
                                    required
                                />
                                <FieldError error={errors.data_hora_publicacao} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="noticia_thumb">Imagem</Label>
                                <Input
                                    id="noticia_thumb"
                                    value={form.thumb_url}
                                    onChange={(event) => updateField("thumb_url", event.target.value)}
                                    placeholder="https://..."
                                />
                                <FieldError error={errors.thumb_url} />
                            </div>
                        </div>
                    ) : null}

                    {state?.type === "texto" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="texto_curto">Resumo</Label>
                                <Input
                                    id="texto_curto"
                                    value={form.texto_curto}
                                    onChange={(event) => updateField("texto_curto", event.target.value)}
                                    required
                                />
                                <FieldError error={errors.texto_curto} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="texto_categoria">Categoria</Label>
                                <Input
                                    id="texto_categoria"
                                    value={form.categoria}
                                    onChange={(event) => updateField("categoria", event.target.value)}
                                    placeholder="Historia"
                                    required
                                />
                                <FieldError error={errors.categoria} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="texto_icone">Icone</Label>
                                <Input
                                    id="texto_icone"
                                    value={form.icone_categoria}
                                    onChange={(event) => updateField("icone_categoria", event.target.value)}
                                    placeholder="BookOpen"
                                />
                                <FieldError error={errors.icone_categoria} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="texto_detalhado">Texto</Label>
                                <Textarea
                                    id="texto_detalhado"
                                    value={form.texto_detalhado}
                                    onChange={(event) => updateField("texto_detalhado", event.target.value)}
                                    rows={8}
                                    required
                                />
                                <FieldError error={errors.texto_detalhado} />
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ConteudoSection({
    noticias,
    textos,
}: {
    noticias: FestaDivinoListQuery<FestaDivinoNoticia>;
    textos: FestaDivinoListQuery<FestaDivinoTexto>;
}) {
    const [dialog, setDialog] = useState<ConteudoDialogState | null>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const deleteNoticia = useDeleteFestaDivinoNoticia();
    const deleteTexto = useDeleteFestaDivinoTexto();

    const confirmDeleteNoticia = (noticia: FestaDivinoNoticia) => {
        confirm({
            title: "Excluir noticia?",
            description: `A noticia "${noticia.titulo}" sera removida do conteudo publico.`,
            confirmText: "Excluir noticia",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteNoticia.mutateAsync(noticia.id);
                    showToast.success("Noticia removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const confirmDeleteTexto = (texto: FestaDivinoTexto) => {
        confirm({
            title: "Excluir texto?",
            description: `O texto "${texto.texto_curto}" sera removido do conteudo publico.`,
            confirmText: "Excluir texto",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteTexto.mutateAsync(texto.id);
                    showToast.success("Texto removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    return (
        <div className="space-y-6">
            <ConfirmDialogRenderer {...dialogProps} />
            <ConteudoCrudDialog state={dialog} onClose={() => setDialog(null)} />

            <DataPanel
                title="Noticias"
                query={noticias}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "noticia" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova noticia
                    </Button>
                }
                columns={[{ label: "Publicacao" }, { label: "Titulo" }, { label: "Link" }, { label: "Acoes" }]}
                renderRow={(noticia) => (
                    <TableRow key={noticia.id}>
                        <TableCell>{formatFestaDivinoDateTime(noticia.data_hora_publicacao)}</TableCell>
                        <TableCell>
                            <div className="font-medium">{noticia.titulo}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">{noticia.linha_apoio}</div>
                        </TableCell>
                        <TableCell>
                            <a href={noticia.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary">
                                <ExternalLink className="mr-1 h-4 w-4" />
                                Abrir
                            </a>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Editar"
                                    onClick={() => setDialog({ type: "noticia", item: noticia })}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    disabled={deleteNoticia.isPending}
                                    onClick={() => confirmDeleteNoticia(noticia)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
            <DataPanel
                title="Textos editoriais"
                query={textos}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "texto" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo texto
                    </Button>
                }
                columns={[{ label: "Categoria" }, { label: "Resumo" }, { label: "Atualizado" }, { label: "Acoes" }]}
                renderRow={(texto) => (
                    <TableRow key={texto.id}>
                        <TableCell>{texto.categoria}</TableCell>
                        <TableCell>
                            <div className="font-medium">{texto.texto_curto}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">{texto.texto_detalhado}</div>
                        </TableCell>
                        <TableCell>{formatFestaDivinoDateTime(texto.atualizado_em ?? texto.criado_em)}</TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Editar"
                                    onClick={() => setDialog({ type: "texto", item: texto })}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Excluir"
                                    disabled={deleteTexto.isPending}
                                    onClick={() => confirmDeleteTexto(texto)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
        </div>
    );
}

type MidiaDialogState =
    | { type: "video"; item?: FestaDivinoVideo }
    | { type: "short"; item?: FestaDivinoVideo };

type MidiaFormState = {
    id: string;
    titulo: string;
    descricao: string;
    thumb_url: string;
};

const emptyMidiaForm: MidiaFormState = {
    id: "",
    titulo: "",
    descricao: "",
    thumb_url: "",
};

function MidiaCrudDialog({
    state,
    onClose,
}: {
    state: MidiaDialogState | null;
    onClose: () => void;
}) {
    const [form, setForm] = useState<MidiaFormState>(emptyMidiaForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createVideo = useCreateFestaDivinoVideo();
    const updateVideo = useUpdateFestaDivinoVideo();
    const createShort = useCreateFestaDivinoShort();
    const updateShort = useUpdateFestaDivinoShort();

    useEffect(() => {
        if (!state) {
            setForm(emptyMidiaForm);
            setErrors({});
            return;
        }

        setErrors({});
        setForm({
            id: state.item?.id ?? "",
            titulo: state.item?.titulo ?? "",
            descricao: state.item?.descricao ?? "",
            thumb_url: state.item?.thumb_url ?? "",
        });
    }, [state]);

    const updateField = (field: keyof MidiaFormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const isSaving = createVideo.isPending || updateVideo.isPending || createShort.isPending || updateShort.isPending;
    const isVideo = state?.type === "video";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!state) return;

        try {
            setErrors({});
            const payload: FestaDivinoVideoPayload = {
                id: state.item ? undefined : form.id,
                titulo: form.titulo,
                descricao: isVideo ? form.descricao : null,
                thumb_url: form.thumb_url || null,
            };

            if (state.type === "video") {
                if (state.item) {
                    await updateVideo.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createVideo.mutateAsync(payload);
                }
            }

            if (state.type === "short") {
                if (state.item) {
                    await updateShort.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createShort.mutateAsync(payload);
                }
            }

            showToast.success("Midia salva.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {state?.item ? "Editar" : "Novo"} {isVideo ? "video" : "short"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="midia_id">ID do YouTube</Label>
                            <Input
                                id="midia_id"
                                value={form.id}
                                onChange={(event) => updateField("id", event.target.value)}
                                disabled={Boolean(state?.item)}
                                placeholder="11 caracteres"
                                required={!state?.item}
                            />
                            <FieldError error={errors.id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="midia_titulo">Titulo</Label>
                            <Input
                                id="midia_titulo"
                                value={form.titulo}
                                onChange={(event) => updateField("titulo", event.target.value)}
                                required
                            />
                            <FieldError error={errors.titulo} />
                        </div>
                        {isVideo ? (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="midia_descricao">Descricao</Label>
                                <Textarea
                                    id="midia_descricao"
                                    value={form.descricao}
                                    onChange={(event) => updateField("descricao", event.target.value)}
                                    rows={4}
                                    required
                                />
                                <FieldError error={errors.descricao} />
                            </div>
                        ) : null}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="midia_thumb">Imagem</Label>
                            <Input
                                id="midia_thumb"
                                value={form.thumb_url}
                                onChange={(event) => updateField("thumb_url", event.target.value)}
                                placeholder="https://img.youtube.com/vi/ID/hqdefault.jpg"
                            />
                            <FieldError error={errors.thumb_url} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MidiaSection({
    videos,
    shorts,
}: {
    videos: FestaDivinoListQuery<FestaDivinoVideo>;
    shorts: FestaDivinoListQuery<FestaDivinoVideo>;
}) {
    const [dialog, setDialog] = useState<MidiaDialogState | null>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const deleteVideo = useDeleteFestaDivinoVideo();
    const deleteShort = useDeleteFestaDivinoShort();

    const confirmDelete = (type: MidiaDialogState["type"], video: FestaDivinoVideo) => {
        confirm({
            title: type === "video" ? "Excluir video?" : "Excluir short?",
            description: `A midia "${video.titulo}" sera removida do site publico.`,
            confirmText: "Excluir midia",
            variant: "danger",
            onConfirm: async () => {
                try {
                    if (type === "video") {
                        await deleteVideo.mutateAsync(video.id);
                    } else {
                        await deleteShort.mutateAsync(video.id);
                    }
                    showToast.success("Midia removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const renderVideo = (type: MidiaDialogState["type"]) => (video: FestaDivinoVideo) => (
        <TableRow key={video.id}>
            <TableCell>
                <div className="flex items-center gap-3">
                    {normalizeFestaDivinoAssetUrl(video.thumb_url) ? (
                        <img
                            src={normalizeFestaDivinoAssetUrl(video.thumb_url) ?? ""}
                            alt=""
                            className="h-12 w-20 rounded object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-20 items-center justify-center rounded bg-muted">
                            <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    <div>
                        <p className="font-medium">{video.titulo}</p>
                        <p className="text-xs text-muted-foreground">{video.id}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>{formatFestaDivinoDateTime(video.created_at)}</TableCell>
            <TableCell>
                <a href={video.watch_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary">
                    <Link2 className="mr-1 h-4 w-4" />
                    YouTube
                </a>
            </TableCell>
            <TableCell>
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setDialog({ type, item: video })}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        disabled={type === "video" ? deleteVideo.isPending : deleteShort.isPending}
                        onClick={() => confirmDelete(type, video)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="grid gap-6 xl:grid-cols-2">
            <ConfirmDialogRenderer {...dialogProps} />
            <MidiaCrudDialog state={dialog} onClose={() => setDialog(null)} />

            <DataPanel
                title="Videos"
                query={videos}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "video" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo video
                    </Button>
                }
                columns={[{ label: "Video" }, { label: "Cadastro" }, { label: "Link" }, { label: "Acoes" }]}
                renderRow={renderVideo("video")}
            />
            <DataPanel
                title="Shorts"
                query={shorts}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "short" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo short
                    </Button>
                }
                columns={[{ label: "Short" }, { label: "Cadastro" }, { label: "Link" }, { label: "Acoes" }]}
                renderRow={renderVideo("short")}
            />
        </div>
    );
}

type FaqDialogState =
    | { type: "categoria"; item?: FestaDivinoFaqCategory }
    | { type: "item"; item?: FestaDivinoFaqItem; categoryId?: number | null };

const emptyFaqCategoryForm = {
    nome: "",
    icone: "HelpCircle",
    ordem: "1",
    ativo: true,
};

const emptyFaqItemForm = {
    category_id: "",
    pergunta: "",
    resposta: "",
    ordem: "1",
    ativo: true,
};

function FaqCrudDialog({
    state,
    categorias,
    onClose,
}: {
    state: FaqDialogState | null;
    categorias: FestaDivinoFaqCategory[];
    onClose: () => void;
}) {
    const [categoryForm, setCategoryForm] = useState(emptyFaqCategoryForm);
    const [itemForm, setItemForm] = useState(emptyFaqItemForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createCategory = useCreateFestaDivinoFaqCategory();
    const updateCategory = useUpdateFestaDivinoFaqCategory();
    const createItem = useCreateFestaDivinoFaqItem();
    const updateItem = useUpdateFestaDivinoFaqItem();

    useEffect(() => {
        if (!state) {
            setErrors({});
            return;
        }

        setErrors({});
        if (state?.type === "categoria") {
            setCategoryForm({
                nome: state.item?.nome ?? "",
                icone: state.item?.icone ?? "HelpCircle",
                ordem: String(state.item?.ordem ?? nextFaqOrder(categorias)),
                ativo: state.item?.ativo ?? true,
            });
        }

        if (state?.type === "item") {
            setItemForm({
                category_id: String(state.item?.category_id ?? state.categoryId ?? categorias[0]?.id ?? ""),
                pergunta: state.item?.pergunta ?? "",
                resposta: state.item?.resposta ?? "",
                ordem: String(state.item?.ordem ?? 1),
                ativo: state.item?.ativo ?? true,
            });
        }
    }, [categorias, state]);

    if (!state) {
        return null;
    }

    const isCategory = state.type === "categoria";
    const isSaving = createCategory.isPending || updateCategory.isPending || createItem.isPending || updateItem.isPending;

    const updateCategoryField = (field: keyof typeof categoryForm, value: string | boolean) => {
        setCategoryForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const updateItemField = (field: keyof typeof itemForm, value: string | boolean) => {
        setItemForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setErrors({});
            if (isCategory) {
                const payload: FestaDivinoFaqCategoryPayload = {
                    nome: categoryForm.nome.trim(),
                    icone: categoryForm.icone.trim(),
                    ordem: Number(categoryForm.ordem || 1),
                    ativo: categoryForm.ativo,
                };

                if (state.item) {
                    await updateCategory.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createCategory.mutateAsync(payload);
                }
            } else {
                const payload: FestaDivinoFaqItemPayload = {
                    category_id: Number(itemForm.category_id),
                    pergunta: itemForm.pergunta.trim(),
                    resposta: itemForm.resposta.trim(),
                    ordem: Number(itemForm.ordem || 1),
                    ativo: itemForm.ativo,
                };

                if (state.item) {
                    await updateItem.mutateAsync({ id: state.item.id, payload });
                } else {
                    await createItem.mutateAsync(payload);
                }
            }

            showToast.success("FAQ salvo com sucesso.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open onOpenChange={(open) => (!open ? onClose() : null)}>
            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>
                            {state.item ? "Editar" : "Nova"} {isCategory ? "categoria" : "pergunta"}
                        </DialogTitle>
                    </DialogHeader>

                    {isCategory ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="faq_categoria_nome">Nome</Label>
                                <Input
                                    id="faq_categoria_nome"
                                    value={categoryForm.nome}
                                    onChange={(event) => updateCategoryField("nome", event.target.value)}
                                    placeholder="Ex: Ingressos"
                                />
                                <FieldError error={errors.nome} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="faq_categoria_icone">Icone</Label>
                                <Input
                                    id="faq_categoria_icone"
                                    value={categoryForm.icone}
                                    onChange={(event) => updateCategoryField("icone", event.target.value)}
                                    placeholder="HelpCircle"
                                />
                                <FieldError error={errors.icone} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="faq_categoria_ordem">Ordem</Label>
                                <Input
                                    id="faq_categoria_ordem"
                                    type="number"
                                    min={1}
                                    value={categoryForm.ordem}
                                    onChange={(event) => updateCategoryField("ordem", event.target.value)}
                                />
                                <FieldError error={errors.ordem} />
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-border/60 p-3 md:col-span-2">
                                <Label htmlFor="faq_categoria_ativo">Categoria ativa</Label>
                                <Switch
                                    id="faq_categoria_ativo"
                                    checked={categoryForm.ativo}
                                    onCheckedChange={(checked) => updateCategoryField("ativo", checked === true)}
                                />
                                <FieldError error={errors.ativo} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="faq_item_categoria">Categoria</Label>
                                <select
                                    id="faq_item_categoria"
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={itemForm.category_id}
                                    onChange={(event) => updateItemField("category_id", event.target.value)}
                                >
                                    <option value="">Selecione</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id} value={categoria.id}>
                                            {categoria.nome}
                                        </option>
                                    ))}
                                </select>
                                <FieldError error={errors.category_id} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="faq_item_pergunta">Pergunta</Label>
                                <Input
                                    id="faq_item_pergunta"
                                    value={itemForm.pergunta}
                                    onChange={(event) => updateItemField("pergunta", event.target.value)}
                                    placeholder="Ex: Qual e o horario da festa?"
                                />
                                <FieldError error={errors.pergunta} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="faq_item_resposta">Resposta</Label>
                                <Textarea
                                    id="faq_item_resposta"
                                    rows={5}
                                    value={itemForm.resposta}
                                    onChange={(event) => updateItemField("resposta", event.target.value)}
                                    placeholder="Resposta simples para o visitante."
                                />
                                <FieldError error={errors.resposta} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="faq_item_ordem">Ordem</Label>
                                <Input
                                    id="faq_item_ordem"
                                    type="number"
                                    min={1}
                                    value={itemForm.ordem}
                                    onChange={(event) => updateItemField("ordem", event.target.value)}
                                />
                                <FieldError error={errors.ordem} />
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                                <Label htmlFor="faq_item_ativo">Pergunta ativa</Label>
                                <Switch
                                    id="faq_item_ativo"
                                    checked={itemForm.ativo}
                                    onCheckedChange={(checked) => updateItemField("ativo", checked === true)}
                                />
                                <FieldError error={errors.ativo} />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function nextFaqOrder(categorias: FestaDivinoFaqCategory[]): number {
    return Math.max(0, ...categorias.map((categoria) => categoria.ordem ?? 0)) + 1;
}

function FaqSection({
    categorias,
    items,
}: {
    categorias: FestaDivinoListQuery<FestaDivinoFaqCategory>;
    items: FestaDivinoListQuery<FestaDivinoFaqItem>;
}) {
    const [dialog, setDialog] = useState<FaqDialogState | null>(null);
    const categoryRows = useMemo(
        () => [...(categorias.data?.data ?? [])].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
        [categorias.data?.data]
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const selectedCategory = categoryRows.find((categoria) => categoria.id === selectedCategoryId) ?? null;
    const itemRows = useMemo(() => {
        const rows = items.data?.data ?? [];
        return rows
            .filter((item) => selectedCategoryId === null || item.category_id === selectedCategoryId)
            .sort((a, b) => a.category_id - b.category_id || a.ordem - b.ordem || a.pergunta.localeCompare(b.pergunta));
    }, [items.data?.data, selectedCategoryId]);
    const updateCategoryStatus = useUpdateFestaDivinoFaqCategoryStatus();
    const updateItemStatus = useUpdateFestaDivinoFaqItemStatus();
    const reorderCategories = useReorderFestaDivinoFaqCategories();
    const reorderItems = useReorderFestaDivinoFaqItems();
    const deleteCategory = useDeleteFestaDivinoFaqCategory();
    const deleteItem = useDeleteFestaDivinoFaqItem();
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();

    const confirmDeleteCategory = (categoria: FestaDivinoFaqCategory) => {
        confirm({
            title: "Excluir categoria FAQ?",
            description: `A categoria "${categoria.nome}" so sera removida se nao houver perguntas vinculadas.`,
            confirmText: "Excluir categoria",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteCategory.mutateAsync(categoria.id);
                    if (selectedCategoryId === categoria.id) {
                        setSelectedCategoryId(null);
                    }
                    showToast.success("Categoria removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const confirmDeleteItem = (item: FestaDivinoFaqItem) => {
        confirm({
            title: "Excluir pergunta?",
            description: `A pergunta "${item.pergunta}" sera removida do FAQ publico.`,
            confirmText: "Excluir pergunta",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteItem.mutateAsync(item.id);
                    showToast.success("Pergunta removida.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    const moveCategory = async (categoria: FestaDivinoFaqCategory, direction: -1 | 1) => {
        const nextRows = [...categoryRows];
        const currentIndex = nextRows.findIndex((row) => row.id === categoria.id);
        const targetIndex = currentIndex + direction;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextRows.length) {
            return;
        }

        [nextRows[currentIndex], nextRows[targetIndex]] = [nextRows[targetIndex], nextRows[currentIndex]];

        try {
            await reorderCategories.mutateAsync({
                items: nextRows.map((row, index) => ({ id: row.id, ordem: index + 1 })),
            });
            showToast.success("Ordem das categorias salva.");
        } catch (error) {
            showToast.error(apiErrorMessage(error));
        }
    };

    const moveItem = async (item: FestaDivinoFaqItem, direction: -1 | 1) => {
        const nextRows = itemRows.filter((row) => row.category_id === item.category_id);
        const currentIndex = nextRows.findIndex((row) => row.id === item.id);
        const targetIndex = currentIndex + direction;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextRows.length) {
            return;
        }

        [nextRows[currentIndex], nextRows[targetIndex]] = [nextRows[targetIndex], nextRows[currentIndex]];

        try {
            await reorderItems.mutateAsync({
                items: nextRows.map((row, index) => ({ id: row.id, ordem: index + 1 })),
            });
            showToast.success("Ordem das perguntas salva.");
        } catch (error) {
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <ConfirmDialogRenderer {...dialogProps} />
            <FaqCrudDialog state={dialog} categorias={categoryRows} onClose={() => setDialog(null)} />

            <DataPanel
                title="Categorias FAQ"
                description="Clique em uma categoria para filtrar as perguntas."
                query={categorias}
                headerAction={
                    <Button size="sm" onClick={() => setDialog({ type: "categoria" })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova categoria
                    </Button>
                }
                columns={[{ label: "Categoria" }, { label: "Ordem" }, { label: "Status" }, { label: "Acoes" }]}
                renderRow={(categoria) => (
                    <TableRow key={categoria.id} className={selectedCategoryId === categoria.id ? "bg-muted/60" : ""}>
                        <TableCell>
                            <button
                                type="button"
                                className="text-left"
                                onClick={() => setSelectedCategoryId((current) => (current === categoria.id ? null : categoria.id))}
                            >
                                <div className="font-medium">{categoria.nome}</div>
                                <div className="text-xs text-muted-foreground">{categoria.items_count ?? 0} pergunta(s)</div>
                            </button>
                        </TableCell>
                        <TableCell>{categoria.ordem}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={categoria.ativo}
                                    onCheckedChange={(checked) =>
                                        updateCategoryStatus.mutate(
                                            { id: categoria.id, payload: { ativo: checked === true } },
                                            { onError: (error) => showToast.error(apiErrorMessage(error)) }
                                        )
                                    }
                                />
                                <StatusBadge active={categoria.ativo} />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                <Button variant="ghost" size="icon" onClick={() => moveCategory(categoria, -1)}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveCategory(categoria, 1)}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDialog({ type: "categoria", item: categoria })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => confirmDeleteCategory(categoria)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            />
            <DataPanel
                title={selectedCategory ? `Perguntas: ${selectedCategory.nome}` : "Perguntas"}
                description="Perguntas agrupadas por categoria e ordem de exibicao publica."
                query={items}
                headerAction={
                    <div className="flex flex-wrap gap-2">
                        {selectedCategory ? (
                            <Button size="sm" variant="outline" onClick={() => setSelectedCategoryId(null)}>
                                Ver todas
                            </Button>
                        ) : null}
                        <Button size="sm" onClick={() => setDialog({ type: "item", categoryId: selectedCategoryId })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova pergunta
                        </Button>
                    </div>
                }
                columns={[{ label: "Pergunta" }, { label: "Categoria" }, { label: "Ordem" }, { label: "Status" }, { label: "Acoes" }]}
                renderRow={(item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <div className="font-medium">{item.pergunta}</div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">{item.resposta}</div>
                        </TableCell>
                        <TableCell>{item.category?.nome ?? `#${item.category_id}`}</TableCell>
                        <TableCell>{item.ordem}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={item.ativo}
                                    onCheckedChange={(checked) =>
                                        updateItemStatus.mutate(
                                            { id: item.id, payload: { ativo: checked === true } },
                                            { onError: (error) => showToast.error(apiErrorMessage(error)) }
                                        )
                                    }
                                />
                                <StatusBadge active={item.ativo} />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                <Button variant="ghost" size="icon" onClick={() => moveItem(item, -1)}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveItem(item, 1)}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDialog({ type: "item", item })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => confirmDeleteItem(item)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                emptyState={
                    selectedCategory ? (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                                    Esta categoria ainda nao tem perguntas.
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : undefined
                }
                rowsOverride={itemRows}
            />
        </div>
    );
}

type BrinquedoDialogState = { item?: FestaDivinoBrinquedo } | null;

const emptyBrinquedoForm = {
    nome: "",
    descricao: "",
    video: "",
    thumb_url: "",
    ativo: true,
};

function BrinquedoCrudDialog({
    state,
    onClose,
}: {
    state: BrinquedoDialogState;
    onClose: () => void;
}) {
    const [form, setForm] = useState(emptyBrinquedoForm);
    const [errors, setErrors] = useState<FestaDivinoFieldErrors>({});
    const createBrinquedo = useCreateFestaDivinoBrinquedo();
    const updateBrinquedo = useUpdateFestaDivinoBrinquedo();

    useEffect(() => {
        if (!state) {
            setErrors({});
            return;
        }

        setErrors({});
        setForm({
            nome: state.item?.nome ?? "",
            descricao: state.item?.descricao ?? "",
            video: state.item?.video ?? "",
            thumb_url: state.item?.thumb_url ?? "",
            ativo: state.item?.ativo ?? true,
        });
    }, [state]);

    if (!state) {
        return null;
    }

    const isSaving = createBrinquedo.isPending || updateBrinquedo.isPending;
    const videoPreview = normalizeFestaDivinoAssetUrl(form.video);
    const thumbPreview = normalizeFestaDivinoAssetUrl(form.thumb_url);

    const updateField = (field: keyof typeof form, value: string | boolean) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload: FestaDivinoBrinquedoPayload = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim(),
            video: form.video.trim(),
            thumb_url: form.thumb_url.trim(),
            ativo: form.ativo,
        };

        try {
            setErrors({});
            if (state.item) {
                await updateBrinquedo.mutateAsync({ id: state.item.id, payload });
            } else {
                await createBrinquedo.mutateAsync(payload);
            }

            showToast.success("Brinquedo salvo com sucesso.");
            onClose();
        } catch (error) {
            setErrors(getFestaDivinoFieldErrors(error));
            showToast.error(apiErrorMessage(error));
        }
    };

    return (
        <Dialog open onOpenChange={(open) => (!open ? onClose() : null)}>
            <DialogContent className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{state.item ? "Editar brinquedo" : "Novo brinquedo"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brinquedo_nome">Nome</Label>
                                <Input
                                    id="brinquedo_nome"
                                    value={form.nome}
                                    onChange={(event) => updateField("nome", event.target.value)}
                                    placeholder="Ex: Roda gigante"
                                />
                                <FieldError error={errors.nome} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brinquedo_descricao">Descricao</Label>
                                <Textarea
                                    id="brinquedo_descricao"
                                    rows={3}
                                    value={form.descricao}
                                    onChange={(event) => updateField("descricao", event.target.value)}
                                    placeholder="Texto curto para o visitante."
                                />
                                <FieldError error={errors.descricao} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brinquedo_video">Video</Label>
                                <Input
                                    id="brinquedo_video"
                                    value={form.video}
                                    onChange={(event) => updateField("video", event.target.value)}
                                    placeholder="/assets/videos/brinquedo.mp4"
                                />
                                <FieldError error={errors.video} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brinquedo_thumb">Miniatura</Label>
                                <Input
                                    id="brinquedo_thumb"
                                    value={form.thumb_url}
                                    onChange={(event) => updateField("thumb_url", event.target.value)}
                                    placeholder="/assets/images/brinquedo.jpg"
                                />
                                <FieldError error={errors.thumb_url} />
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                                <Label htmlFor="brinquedo_ativo">Brinquedo ativo</Label>
                                <Switch
                                    id="brinquedo_ativo"
                                    checked={form.ativo}
                                    onCheckedChange={(checked) => updateField("ativo", checked === true)}
                                />
                                <FieldError error={errors.ativo} />
                            </div>
                        </div>

                        <aside className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                            <p className="text-sm font-medium">Preview</p>
                            {thumbPreview ? (
                                <img src={thumbPreview} alt="" className="h-36 w-full rounded-md object-cover" />
                            ) : (
                                <div className="flex h-36 items-center justify-center rounded-md bg-muted">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="font-medium">{form.nome || "Nome do brinquedo"}</p>
                                <p className="line-clamp-3 text-sm text-muted-foreground">
                                    {form.descricao || "Descricao exibida no card publico."}
                                </p>
                            </div>
                            {videoPreview ? (
                                <a href={videoPreview} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-primary">
                                    <Video className="mr-2 h-4 w-4" />
                                    Abrir video
                                </a>
                            ) : null}
                        </aside>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function BrinquedosSection({ brinquedos }: { brinquedos: FestaDivinoListQuery<FestaDivinoBrinquedo> }) {
    const rows = brinquedos.data?.data ?? [];
    const [dialog, setDialog] = useState<BrinquedoDialogState>(null);
    const { confirm, dialogProps, ConfirmDialog: ConfirmDialogRenderer } = useConfirmDialog();
    const updateStatus = useUpdateFestaDivinoBrinquedoStatus();
    const deleteBrinquedo = useDeleteFestaDivinoBrinquedo();

    const confirmDelete = (brinquedo: FestaDivinoBrinquedo) => {
        confirm({
            title: "Excluir brinquedo?",
            description: `O brinquedo "${brinquedo.nome}" sera removido do site publico.`,
            confirmText: "Excluir brinquedo",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteBrinquedo.mutateAsync(brinquedo.id);
                    showToast.success("Brinquedo removido.");
                } catch (error) {
                    showToast.error(apiErrorMessage(error));
                }
            },
        });
    };

    return (
        <div className="space-y-4">
            <ConfirmDialogRenderer {...dialogProps} />
            <BrinquedoCrudDialog state={dialog} onClose={() => setDialog(null)} />

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Total" value={brinquedos.data?.meta?.total ?? rows.length} icon={Package} />
                <MetricCard label="Ativos" value={countActive(rows)} icon={CheckCircle2} />
                <MetricCard label="Com video" value={rows.filter((item) => Boolean(item.video)).length} icon={Video} />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => brinquedos.refetch()}>
                    Atualizar
                </Button>
                <Button onClick={() => setDialog({})}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo brinquedo
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {brinquedos.isLoading ? (
                    [0, 1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-lg bg-muted" />)
                ) : null}
                {!brinquedos.isLoading && rows.length === 0 ? (
                    <div className="rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
                        Nenhum brinquedo encontrado.
                    </div>
                ) : null}
                {!brinquedos.isLoading
                    ? rows.map((brinquedo) => {
                          const thumbUrl = normalizeFestaDivinoAssetUrl(brinquedo.thumb_url);
                          const videoUrl = normalizeFestaDivinoAssetUrl(brinquedo.video);

                          return (
                              <article key={brinquedo.id} className="overflow-hidden rounded-lg border border-border/60 bg-card">
                                  {thumbUrl ? (
                                      <img src={thumbUrl} alt="" className="h-36 w-full object-cover" />
                                  ) : (
                                      <div className="flex h-36 items-center justify-center bg-muted">
                                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                  )}
                                  <div className="space-y-3 p-4">
                                      <div className="flex items-start justify-between gap-3">
                                          <h2 className="font-semibold">{brinquedo.nome}</h2>
                                          <div className="flex items-center gap-2">
                                              <Switch
                                                  checked={brinquedo.ativo}
                                                  onCheckedChange={(checked) =>
                                                      updateStatus.mutate(
                                                          { id: brinquedo.id, payload: { ativo: checked === true } },
                                                          { onError: (error) => showToast.error(apiErrorMessage(error)) }
                                                      )
                                                  }
                                              />
                                              <StatusBadge active={brinquedo.ativo} />
                                          </div>
                                      </div>
                                      <p className="line-clamp-2 text-sm text-muted-foreground">{brinquedo.descricao}</p>
                                      <div className="flex flex-wrap items-center gap-2">
                                          {videoUrl ? (
                                              <Button variant="outline" size="sm" asChild>
                                                  <a href={videoUrl} target="_blank" rel="noreferrer">
                                                      <Video className="mr-2 h-4 w-4" />
                                                      Ver video
                                                  </a>
                                              </Button>
                                          ) : null}
                                          <Button variant="outline" size="sm" onClick={() => setDialog({ item: brinquedo })}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              Editar
                                          </Button>
                                          <Button variant="outline" size="sm" onClick={() => confirmDelete(brinquedo)}>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Excluir
                                          </Button>
                                      </div>
                                  </div>
                              </article>
                          );
                      })
                    : null}
            </div>
        </div>
    );
}

const auditActionLabels: Record<string, string> = {
    create: "Criacao",
    update: "Edicao",
    status: "Status",
    reorder: "Ordenacao",
    delete: "Exclusao",
};

const auditEntityLabels: Record<string, string> = {
    edicao_festa: "Edicao",
    dia_festa: "Dia da festa",
    programacao_evento: "Evento",
    programacao_categoria: "Categoria programacao",
    programacao_local: "Local",
    programacao_atracao: "Atracao",
    cardapio_categoria: "Categoria cardapio",
    cardapio_produto: "Produto",
    conteudo_noticia: "Noticia",
    conteudo_texto: "Texto",
    midia_video: "Video",
    midia_short: "Short",
    faq_categoria: "Categoria FAQ",
    faq_item: "Pergunta FAQ",
    brinquedo: "Brinquedo",
};

function formatAuditValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "-";
    }

    if (typeof value === "boolean") {
        return value ? "Sim" : "Nao";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

function AuditDiff({ log }: { log: FestaDivinoAuditLog }) {
    const keys = Array.from(
        new Set([...Object.keys(log.old_values ?? {}), ...Object.keys(log.new_values ?? {})])
    ).slice(0, 6);

    if (keys.length === 0) {
        return <span className="text-xs text-muted-foreground">Sem diff registrado</span>;
    }

    return (
        <div className="space-y-1">
            {keys.map((key) => (
                <div key={key} className="grid gap-1 rounded-md bg-muted/40 p-2 text-xs md:grid-cols-[130px_1fr_1fr]">
                    <span className="font-medium text-muted-foreground">{key}</span>
                    <span className="truncate">Antes: {formatAuditValue(log.old_values?.[key])}</span>
                    <span className="truncate">Depois: {formatAuditValue(log.new_values?.[key])}</span>
                </div>
            ))}
        </div>
    );
}

function AuditoriaSection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const action = searchParams.get("acao") ?? "";
    const entity = searchParams.get("entidade") ?? "";
    const from = searchParams.get("inicio") ?? "";
    const to = searchParams.get("fim") ?? "";

    const audit = useFestaDivinoAudit({
        perPage: 50,
        include: ["user"],
        sort: "-created_at",
        filters: {
            action,
            entity_type: entity,
            created_from: from,
            created_to: to,
        },
    });

    const setFilter = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="space-y-4">
            <section className="rounded-lg border border-border/60 bg-card p-4">
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="audit_action">Acao</Label>
                        <select
                            id="audit_action"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={action}
                            onChange={(event) => setFilter("acao", event.target.value)}
                        >
                            <option value="">Todas</option>
                            {Object.entries(auditActionLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="audit_entity">Entidade</Label>
                        <select
                            id="audit_entity"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={entity}
                            onChange={(event) => setFilter("entidade", event.target.value)}
                        >
                            <option value="">Todas</option>
                            {Object.entries(auditEntityLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="audit_from">Inicio</Label>
                        <Input id="audit_from" type="date" value={from} onChange={(event) => setFilter("inicio", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="audit_to">Fim</Label>
                        <Input id="audit_to" type="date" value={to} onChange={(event) => setFilter("fim", event.target.value)} />
                    </div>
                </div>
            </section>

            <DataPanel
                title="Auditoria"
                description="Historico local de escritas feitas no banco externo."
                query={audit}
                columns={[
                    { label: "Quando" },
                    { label: "Acao" },
                    { label: "Entidade" },
                    { label: "Usuario" },
                    { label: "Antes e depois" },
                ]}
                renderRow={(log) => (
                    <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{formatFestaDivinoDateTime(log.created_at)}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{auditActionLabels[log.action] ?? log.action}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{auditEntityLabels[log.entity_type] ?? log.entity_type}</div>
                            <div className="text-xs text-muted-foreground">ID {log.entity_id ?? "-"}</div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{log.user?.name ?? "Sistema"}</div>
                            <div className="text-xs text-muted-foreground">{log.user?.email ?? log.ip_address ?? "-"}</div>
                        </TableCell>
                        <TableCell className="min-w-[360px]">
                            <AuditDiff log={log} />
                        </TableCell>
                    </TableRow>
                )}
            />
        </div>
    );
}

function HealthSection() {
    const health = useFestaDivinoHealth();
    const data = health.data?.data;
    const tables = Object.entries(data?.tables ?? {});

    return (
        <div className="space-y-6">
            <section className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", data?.status === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                            {data?.status === "ok" ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">Saude da conexao externa</h2>
                            <p className="text-sm text-muted-foreground">
                                {data?.connections.read.driver ?? "driver"} · {data?.connections.read.version ?? "versao nao informada"}
                            </p>
                        </div>
                    </div>
                    <Badge variant={data?.status === "ok" ? "secondary" : "destructive"}>
                        {data?.status === "ok" ? "Operacional" : "Degradado"}
                    </Badge>
                </div>
            </section>

            <section className="rounded-lg border border-border/60 bg-card">
                <div className="border-b border-border/60 p-4">
                    <h2 className="text-base font-semibold">Tabelas monitoradas</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Contagem e existencia das tabelas usadas pelos CRUDs.</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tabela</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registros</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {health.isLoading ? <LoadingRows columns={3} /> : null}
                        {!health.isLoading
                            ? tables.map(([table, details]) => (
                                  <TableRow key={table}>
                                      <TableCell className="font-mono text-sm">{table}</TableCell>
                                      <TableCell>
                                          {details.exists ? (
                                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                                  Existe
                                              </Badge>
                                          ) : (
                                              <Badge variant="destructive">Ausente</Badge>
                                          )}
                                      </TableCell>
                                      <TableCell>{details.count ?? "-"}</TableCell>
                                  </TableRow>
                              ))
                            : null}
                    </TableBody>
                </Table>
            </section>
        </div>
    );
}

export default function FestaDivinoPage({ section = "dashboard" }: { section?: FestaDivinoSection }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("q") ?? "";
    const dashboard = useFestaDivinoDashboard({ enabled: section !== "health" });

    const queryParams = useMemo(
        () => ({
            search,
            perPage: 100,
        }),
        [search]
    );

    const programacao = useFestaDivinoProgramacao(
        { ...queryParams, include: ["local", "categoria", "atracoes"], sort: "data_evento,hora_inicio" },
        { enabled: section === "programacao" }
    );
    const edicoes = useFestaDivinoEdicoes({ ...queryParams, sort: "-ano_festa" }, { enabled: section === "edicao" });
    const diasFesta = useFestaDivinoDiasFesta(
        { ...queryParams, include: ["edicao"], sort: "data_evento" },
        { enabled: section === "edicao" }
    );
    const cardapio = useFestaDivinoCardapio({ ...queryParams, include: ["categoria"] }, { enabled: section === "cardapio" });
    const conteudo = useFestaDivinoConteudo(queryParams, { enabled: section === "conteudo" });
    const midia = useFestaDivinoMidia(queryParams, { enabled: section === "midia" });
    const faq = useFestaDivinoFaq({ ...queryParams, include: ["category"] }, { enabled: section === "faq" });
    const brinquedos = useFestaDivinoBrinquedos(queryParams, { enabled: section === "brinquedos" });

    const activeSection = sections.find((item) => item.id === section) ?? sections[0];
    const ActiveSectionIcon = activeSection.icon;
    const showSearch = !["dashboard", "auditoria", "health"].includes(section);

    const handleSearchChange = (nextValue: string) => {
        const next = new URLSearchParams(searchParams);
        if (nextValue) {
            next.set("q", nextValue);
        } else {
            next.delete("q");
        }
        setSearchParams(next, { replace: true });
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">Festa do Divino</h1>
                            <Badge variant={dashboard.data?.data.mode === "write_enabled" ? "destructive" : "secondary"}>
                                {dashboard.data?.data.mode === "write_enabled" ? "Escrita habilitada" : "Somente leitura"}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gestao operacional do site externo com dados do banco legado.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a href="https://festadodivinovip.com.br/" target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Site publico
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/festa-divino/health">
                                <Activity className="mr-2 h-4 w-4" />
                                Health
                            </Link>
                        </Button>
                    </div>
                </header>

                <SectionNav sections={sections} activeSection={activeSection.id} />

                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ActiveSectionIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold">{activeSection.label}</p>
                            <p className="text-sm text-muted-foreground">
                                {dashboard.data?.data.active_edition?.titulo ?? "Banco externo Festa do Divino"}
                            </p>
                        </div>
                    </div>
                    {showSearch ? <SearchBar value={search} onChange={handleSearchChange} /> : null}
                </div>

                {section === "dashboard" ? <DashboardSection /> : null}
                {section === "edicao" ? (
                    <EdicaoSection
                        edicoes={edicoes}
                        dias={diasFesta}
                        defaultEdicaoId={dashboard.data?.data.active_edition?.id}
                    />
                ) : null}
                {section === "programacao" ? (
                    <ProgramacaoSection
                        eventos={programacao.eventos}
                        categorias={programacao.categorias}
                        locais={programacao.locais}
                        atracoes={programacao.atracoes}
                        defaultEdicaoId={dashboard.data?.data.active_edition?.id}
                    />
                ) : null}
                {section === "cardapio" ? (
                    <CardapioSection categorias={cardapio.categorias} produtos={cardapio.produtos} />
                ) : null}
                {section === "conteudo" ? <ConteudoSection noticias={conteudo.noticias} textos={conteudo.textos} /> : null}
                {section === "midia" ? <MidiaSection videos={midia.videos} shorts={midia.shorts} /> : null}
                {section === "faq" ? <FaqSection categorias={faq.categorias} items={faq.items} /> : null}
                {section === "brinquedos" ? <BrinquedosSection brinquedos={brinquedos} /> : null}
                {section === "auditoria" ? <AuditoriaSection /> : null}
                {section === "health" ? <HealthSection /> : null}
            </div>
        </AppShell>
    );
}
