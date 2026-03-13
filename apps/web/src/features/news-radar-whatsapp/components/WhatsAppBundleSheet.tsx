import { useEffect, useMemo, useState } from "react";
import {
    ArrowUpRight,
    ClipboardCopy,
    CopyPlus,
    FileText,
    Loader2,
    Save,
    Sparkles,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import showToast from "@/lib/toast";
import { useAiPromptComposer } from "@/features/ai-prompts/components/AiPromptComposerProvider";
import {
    getBundleStatusLabel,
    useDuplicateWhatsAppBundle,
    useExportWhatsAppBundleMarkdown,
    usePreviewWhatsAppBundleMarkdown,
    usePromoteWhatsAppBundle,
    useRemoveWhatsAppNewsBundleItem,
    useUpdateWhatsAppNewsBundle,
    useWhatsAppNewsBundle,
} from "@/features/news-radar-whatsapp/hooks/useNewsRadarWhatsApp";
import type { WhatsAppNewsBundle } from "@/features/news-radar-whatsapp/types";
import { formatWhatsAppDateTime } from "@/features/news-radar-whatsapp/utils/formatters";

interface WhatsAppBundleSheetProps {
    open: boolean;
    bundleId: number | null;
    onOpenChange: (open: boolean) => void;
}

interface BundleFormState {
    title: string;
    headline_draft: string;
    lead_draft: string;
    summary: string;
    city: string;
    urgency: string;
    category: string;
    categories_csv: string;
    notes: string;
    editorial_notes: string;
    promotion_notes: string;
}

const EMPTY_FORM: BundleFormState = {
    title: "",
    headline_draft: "",
    lead_draft: "",
    summary: "",
    city: "",
    urgency: "",
    category: "",
    categories_csv: "",
    notes: "",
    editorial_notes: "",
    promotion_notes: "",
};

function mapBundleToForm(bundle: WhatsAppNewsBundle): BundleFormState {
    return {
        title: bundle.title ?? "",
        headline_draft: bundle.headline_draft ?? "",
        lead_draft: bundle.lead_draft ?? "",
        summary: bundle.summary ?? "",
        city: bundle.city ?? "",
        urgency: bundle.urgency ?? "",
        category: bundle.category ?? "",
        categories_csv: bundle.categories_json?.join(", ") ?? "",
        notes: bundle.notes ?? "",
        editorial_notes: bundle.editorial_notes ?? "",
        promotion_notes: bundle.promotion_notes ?? "",
    };
}

function parseCategoriesCsv(value: string): string[] | null {
    const categories = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    return categories.length > 0 ? categories : null;
}

export function WhatsAppBundleSheet({
    open,
    bundleId,
    onOpenChange,
}: WhatsAppBundleSheetProps) {
    const { openBundleComposer } = useAiPromptComposer();
    const bundleQuery = useWhatsAppNewsBundle(bundleId ?? undefined, open);
    const previewQuery = usePreviewWhatsAppBundleMarkdown(bundleId ?? undefined, open);
    const updateMutation = useUpdateWhatsAppNewsBundle();
    const removeItemMutation = useRemoveWhatsAppNewsBundleItem();
    const duplicateMutation = useDuplicateWhatsAppBundle();
    const exportMarkdownMutation = useExportWhatsAppBundleMarkdown();
    const promoteMutation = usePromoteWhatsAppBundle();

    const bundle = bundleQuery.data?.data ?? null;
    const [form, setForm] = useState<BundleFormState>(EMPTY_FORM);

    useEffect(() => {
        if (!bundle) {
            setForm(EMPTY_FORM);
            return;
        }

        setForm(mapBundleToForm(bundle));
    }, [bundle]);

    const canEdit = bundle?.status === "open" || bundle?.status === "reviewing" || bundle?.status === "ready";
    const isDirty = useMemo(() => {
        if (!bundle) {
            return false;
        }

        const current = mapBundleToForm(bundle);

        return Object.entries(current).some(
            ([key, value]) => form[key as keyof BundleFormState] !== value,
        );
    }, [bundle, form]);

    const handleFieldChange = (field: keyof BundleFormState, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        if (!bundle) {
            return;
        }

        await updateMutation.mutateAsync({
            id: bundle.id,
            payload: {
                lock_version: bundle.lock_version,
                title: form.title || null,
                headline_draft: form.headline_draft || null,
                lead_draft: form.lead_draft || null,
                summary: form.summary || null,
                city: form.city || null,
                urgency: form.urgency || null,
                category: form.category || null,
                categories_json: parseCategoriesCsv(form.categories_csv),
                notes: form.notes || null,
                editorial_notes: form.editorial_notes || null,
                promotion_notes: form.promotion_notes || null,
            },
        });
    };

    const handleCopyMarkdownLink = async () => {
        if (!bundle) {
            return;
        }

        try {
            const response = await exportMarkdownMutation.mutateAsync({
                id: bundle.id,
                lockVersion: bundle.lock_version,
            });

            await navigator.clipboard.writeText(response.data.signed_url);
            showToast.success("Link assinado do markdown copiado.");
        } catch {
            // handled by mutation
        }
    };

    const handleOpenMarkdown = async () => {
        if (!bundle) {
            return;
        }

        try {
            const response = await exportMarkdownMutation.mutateAsync({
                id: bundle.id,
                lockVersion: bundle.lock_version,
            });

            window.open(response.data.signed_url, "_blank", "noopener,noreferrer");
        } catch {
            // handled by mutation
        }
    };

    const handlePromote = async () => {
        if (!bundle) {
            return;
        }

        await promoteMutation.mutateAsync({
            id: bundle.id,
            lockVersion: bundle.lock_version,
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
                <SheetHeader className="pr-8">
                    <SheetTitle>Agrupamento editorial</SheetTitle>
                    <SheetDescription>
                        Edite o rascunho, revise os itens de origem e envie para a I.A. a
                        partir do mesmo fluxo.
                    </SheetDescription>
                </SheetHeader>

                {!bundleId ? null : bundleQuery.isLoading ? (
                    <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando agrupamento...
                    </div>
                ) : !bundle ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        Agrupamento editorial nao encontrado.
                    </div>
                ) : (
                    <div className="mt-6 space-y-6">
                        <div className="rounded-3xl border border-border/60 bg-card p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="rounded-full">
                                    {getBundleStatusLabel(bundle.status)}
                                </Badge>
                                <Badge variant="outline" className="rounded-full">
                                    {bundle.message_count} mensagem(ns)
                                </Badge>
                                <Badge variant="outline" className="rounded-full">
                                    v{bundle.lock_version}
                                </Badge>
                                {bundle.has_updated_source_messages ? (
                                    <Badge className="rounded-full border-warning/30 bg-warning/10 text-warning">
                                        Fonte atualizada
                                    </Badge>
                                ) : null}
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        Grupo
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        {bundle.group?.name || bundle.whatsapp_group_fk}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        Primeira mensagem
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        {formatWhatsAppDateTime(bundle.first_message_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        Ultima atualizacao
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        {formatWhatsAppDateTime(bundle.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="bundle-title">Titulo</Label>
                                <Input
                                    id="bundle-title"
                                    value={form.title}
                                    onChange={(event) =>
                                        handleFieldChange("title", event.target.value)
                                    }
                                    className="rounded-xl"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bundle-headline">Titulo de apoio</Label>
                                <Input
                                    id="bundle-headline"
                                    value={form.headline_draft}
                                    onChange={(event) =>
                                        handleFieldChange("headline_draft", event.target.value)
                                    }
                                    className="rounded-xl"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="bundle-city">Cidade</Label>
                                <Input
                                    id="bundle-city"
                                    value={form.city}
                                    onChange={(event) =>
                                        handleFieldChange("city", event.target.value)
                                    }
                                    className="rounded-xl"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bundle-urgency">Urgencia</Label>
                                <Input
                                    id="bundle-urgency"
                                    value={form.urgency}
                                    onChange={(event) =>
                                        handleFieldChange("urgency", event.target.value)
                                    }
                                    className="rounded-xl"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bundle-category">Categoria principal</Label>
                                <Input
                                    id="bundle-category"
                                    value={form.category}
                                    onChange={(event) =>
                                        handleFieldChange("category", event.target.value)
                                    }
                                    className="rounded-xl"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bundle-categories">Categorias</Label>
                            <Input
                                id="bundle-categories"
                                value={form.categories_csv}
                                onChange={(event) =>
                                    handleFieldChange("categories_csv", event.target.value)
                                }
                                className="rounded-xl"
                                placeholder="Transito, Seguranca, BR-101"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bundle-lead">Lead</Label>
                            <Textarea
                                id="bundle-lead"
                                value={form.lead_draft}
                                onChange={(event) =>
                                    handleFieldChange("lead_draft", event.target.value)
                                }
                                className="min-h-[96px] rounded-2xl"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bundle-summary">Resumo</Label>
                            <Textarea
                                id="bundle-summary"
                                value={form.summary}
                                onChange={(event) =>
                                    handleFieldChange("summary", event.target.value)
                                }
                                className="min-h-[120px] rounded-2xl"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="bundle-notes">Notas</Label>
                                <Textarea
                                    id="bundle-notes"
                                    value={form.notes}
                                    onChange={(event) =>
                                        handleFieldChange("notes", event.target.value)
                                    }
                                    className="min-h-[140px] rounded-2xl"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bundle-editorial-notes">Notas editoriais</Label>
                                <Textarea
                                    id="bundle-editorial-notes"
                                    value={form.editorial_notes}
                                    onChange={(event) =>
                                        handleFieldChange("editorial_notes", event.target.value)
                                    }
                                    className="min-h-[140px] rounded-2xl"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bundle-promotion-notes">Notas de promocao</Label>
                            <Textarea
                                id="bundle-promotion-notes"
                                value={form.promotion_notes}
                                onChange={(event) =>
                                    handleFieldChange("promotion_notes", event.target.value)
                                }
                                className="min-h-[96px] rounded-2xl"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="rounded-3xl border border-border/60 bg-card p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Itens de origem
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Mensagens agrupadas para construir esta noticia.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {bundle.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-border/50 bg-muted/20 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full"
                                                    >
                                                        Ordem {item.sort_order}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-sm text-foreground">
                                                    {item.event?.text_message ||
                                                        "Mensagem sem texto consolidado."}
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {item.event?.sender_name || "Sem remetente"} •{" "}
                                                    {formatWhatsAppDateTime(item.event?.sent_at)}
                                                </p>
                                            </div>

                                            {canEdit && item.event ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl"
                                                    onClick={() =>
                                                        removeItemMutation.mutate({
                                                            id: bundle.id,
                                                            eventId: item.event!.id,
                                                            lockVersion: bundle.lock_version,
                                                        })
                                                    }
                                                    disabled={removeItemMutation.isPending}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remover
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-border/60 bg-card p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Markdown consolidado
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Snapshot para conferencia e exportacao para I.A.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={handleCopyMarkdownLink}
                                        disabled={exportMarkdownMutation.isPending}
                                    >
                                        <ClipboardCopy className="mr-2 h-4 w-4" />
                                        Copiar link
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={handleOpenMarkdown}
                                        disabled={exportMarkdownMutation.isPending}
                                    >
                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                        Abrir snapshot
                                    </Button>
                                </div>
                            </div>

                            {previewQuery.isLoading ? (
                                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando preview...
                                </div>
                            ) : (
                                <pre className="mt-4 max-h-[240px] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/50 bg-muted/20 p-4 font-mono text-xs leading-6">
                                    {previewQuery.data?.data.markdown_text ||
                                        "Markdown indisponivel no momento."}
                                </pre>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => bundle && openBundleComposer(bundle)}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar o Prompt de I.A.
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => bundle && duplicateMutation.mutate(bundle.id)}
                                disabled={duplicateMutation.isPending}
                            >
                                <CopyPlus className="mr-2 h-4 w-4" />
                                Duplicar
                            </Button>
                            {bundle.status !== "promoted" && bundle.status !== "archived" ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={handlePromote}
                                    disabled={promoteMutation.isPending}
                                >
                                    <ArrowUpRight className="mr-2 h-4 w-4" />
                                    Promover
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                className="rounded-xl"
                                onClick={handleSave}
                                disabled={!canEdit || !isDirty || updateMutation.isPending}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {updateMutation.isPending ? "Salvando..." : "Salvar alteracoes"}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default WhatsAppBundleSheet;
