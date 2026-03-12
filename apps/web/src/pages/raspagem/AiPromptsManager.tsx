import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowDown,
    ArrowUp,
    Bot,
    Copy,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Star,
    Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
    useAiPromptTemplates,
    useAiPromptVariables,
    useArchiveAiPromptTemplate,
    useCreateAiPromptTemplate,
    useCreateStarterAiPromptTemplate,
    useReorderAiPromptTemplates,
    useSetFavoriteAiPromptTemplate,
    useUpdateAiPromptTemplate,
} from "@/features/ai-prompts/hooks/useAiPrompts";
import type {
    PromptProviderTarget,
    PromptTemplate,
    PromptTemplatePayload,
} from "@/features/ai-prompts/types";
import {
    compilePrompt,
    createPromptPreviewNewsItem,
    getAvailableVariables,
    sortPromptTemplates,
} from "@/features/ai-prompts/utils/prompt-template-utils";

type DialogMode = "create" | "edit";

interface PromptFormState {
    name: string;
    description: string;
    content: string;
    provider_target: PromptProviderTarget;
}

const defaultFormState: PromptFormState = {
    name: "",
    description: "",
    content: "",
    provider_target: "generic",
};

function getProviderLabel(provider: PromptProviderTarget): string {
    if (provider === "chatgpt") {
        return "ChatGPT";
    }

    if (provider === "claude") {
        return "Claude";
    }

    return "Generico";
}

function formatLastUsedAt(value?: string | null): string {
    if (!value) {
        return "Nunca usado";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Nunca usado";
    }

    return `Usado em ${date.toLocaleString("pt-BR")}`;
}

function templateToForm(template: PromptTemplate): PromptFormState {
    return {
        name: template.name,
        description: template.description ?? "",
        content: template.content,
        provider_target: template.provider_target,
    };
}

const sampleNewsItem = createPromptPreviewNewsItem();

const AiPromptsManager = () => {
    const { user } = useAuth();
    const canViewAiPrompts =
        user?.role === "admin" || user?.permissions?.includes("ai_prompts.view");
    const canEditAiPrompts =
        user?.role === "admin" || user?.permissions?.includes("ai_prompts.edit");
    const canCreateAiPrompts =
        user?.role === "admin" || user?.permissions?.includes("ai_prompts.create");
    const canDeleteAiPrompts =
        user?.role === "admin" || user?.permissions?.includes("ai_prompts.delete");

    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>("create");
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromptTemplate | null>(null);
    const [form, setForm] = useState<PromptFormState>(defaultFormState);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const templatesQuery = useAiPromptTemplates({ per_page: 100 }, Boolean(canViewAiPrompts));
    const variablesQuery = useAiPromptVariables(Boolean(canViewAiPrompts));
    const createMutation = useCreateAiPromptTemplate();
    const updateMutation = useUpdateAiPromptTemplate();
    const archiveMutation = useArchiveAiPromptTemplate();
    const favoriteMutation = useSetFavoriteAiPromptTemplate();
    const reorderMutation = useReorderAiPromptTemplates();
    const starterMutation = useCreateStarterAiPromptTemplate();

    const templates = useMemo(
        () => sortPromptTemplates(templatesQuery.data?.data ?? []),
        [templatesQuery.data?.data],
    );
    const filteredTemplates = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return templates;
        }

        return templates.filter((template) =>
            [template.name, template.description ?? "", template.content]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch),
        );
    }, [search, templates]);
    const variables = variablesQuery.data?.data ?? getAvailableVariables();
    const previewResult = useMemo(() => compilePrompt(form.content, sampleNewsItem), [form.content]);

    const openCreateDialog = () => {
        setDialogMode("create");
        setEditingTemplate(null);
        setForm(defaultFormState);
        setDialogOpen(true);
    };

    const openEditDialog = (template: PromptTemplate) => {
        setDialogMode("edit");
        setEditingTemplate(template);
        setForm(templateToForm(template));
        setDialogOpen(true);
    };

    const setField = <K extends keyof PromptFormState>(field: K, value: PromptFormState[K]) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const insertVariableAtCursor = (variableKey: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setField("content", `${form.content}${variableKey}`);
            return;
        }

        const { selectionStart, selectionEnd } = textarea;
        const nextContent =
            form.content.slice(0, selectionStart) +
            variableKey +
            form.content.slice(selectionEnd);

        setField("content", nextContent);

        window.requestAnimationFrame(() => {
            textarea.focus();
            const nextCursorPosition = selectionStart + variableKey.length;
            textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
        });
    };

    const handleSave = async () => {
        if (!canCreateAiPrompts && dialogMode === "create") {
            return;
        }

        if (!canEditAiPrompts && dialogMode === "edit") {
            return;
        }

        const payload: PromptTemplatePayload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            content: form.content,
            provider_target: form.provider_target,
        };

        if (!payload.name || !payload.content.trim()) {
            return;
        }

        try {
            if (dialogMode === "create") {
                await createMutation.mutateAsync(payload);
            } else if (editingTemplate) {
                await updateMutation.mutateAsync({
                    id: editingTemplate.id,
                    payload,
                });
            }

            setDialogOpen(false);
        } catch {
            // handled by hook
        }
    };

    const handleMove = async (templateId: number, direction: "up" | "down") => {
        const currentIndex = templates.findIndex((template) => template.id === templateId);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= templates.length) {
            return;
        }

        const nextOrder = [...templates];
        const [movedItem] = nextOrder.splice(currentIndex, 1);
        nextOrder.splice(targetIndex, 0, movedItem);

        try {
            await reorderMutation.mutateAsync(nextOrder.map((template) => template.id));
        } catch {
            // handled by hook
        }
    };

    const handleDuplicate = async (template: PromptTemplate) => {
        if (!canCreateAiPrompts) {
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: `${template.name} (Copia)`,
                description: template.description ?? "",
                content: template.content,
                provider_target: template.provider_target,
            });
        } catch {
            // handled by hook
        }
    };

    const handleSetFavorite = async (templateId: number) => {
        if (!canEditAiPrompts) {
            return;
        }

        try {
            await favoriteMutation.mutateAsync(templateId);
        } catch {
            // handled by hook
        }
    };

    const handleCreateStarter = async () => {
        if (!canCreateAiPrompts) {
            return;
        }

        try {
            await starterMutation.mutateAsync();
        } catch {
            // handled by hook
        }
    };

    if (!canViewAiPrompts) {
        return (
            <AppShell>
                <EmptyState
                    icon={Bot}
                    title="Acesso indisponivel"
                    description="Seu usuario nao possui permissao para visualizar o gerenciador de prompts."
                />
            </AppShell>
        );
    }

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold md:text-2xl">Prompt Manager</h1>
                        <p className="text-sm text-muted-foreground">
                            Cadastre, favorite e organize os templates usados pelo fluxo de I.A.
                        </p>
                    </div>

                    <Button
                        className="rounded-xl"
                        onClick={openCreateDialog}
                        disabled={!canCreateAiPrompts}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo template
                    </Button>
                </div>
            </motion.div>

            <div className="mb-6 rounded-2xl border border-border/50 bg-card p-4">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nome, descricao ou conteudo"
                        className="rounded-xl pl-10"
                    />
                </div>
            </div>

            {templatesQuery.isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
                    Carregando templates...
                </div>
            ) : templates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8">
                    <div className="mx-auto max-w-xl space-y-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold">
                                Nenhum template cadastrado ainda.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Crie um prompt do zero ou use o modelo inicial para reproduzir o
                                fluxo atual de reescrita jornalistica.
                            </p>
                        </div>
                        <div className="flex flex-col justify-center gap-2 sm:flex-row">
                            <Button
                                className="rounded-xl"
                                onClick={openCreateDialog}
                                disabled={!canCreateAiPrompts}
                            >
                                Criar primeiro template
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={handleCreateStarter}
                                disabled={!canCreateAiPrompts || starterMutation.isPending}
                            >
                                Usar modelo inicial
                            </Button>
                        </div>
                    </div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Nenhum template encontrado"
                    description="Ajuste o termo de busca ou limpe os filtros para ver os templates cadastrados."
                    size="sm"
                />
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {filteredTemplates.map((template) => {
                        const templateIndex = templates.findIndex(
                            (candidate) => candidate.id === template.id,
                        );

                        return (
                            <div
                                key={template.id}
                                className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm"
                            >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-semibold">{template.name}</h2>
                                        {template.is_favorite && (
                                            <Badge className="rounded-full bg-primary/15 text-primary">
                                                <Star className="mr-1 h-3 w-3" />
                                                Favorito
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="rounded-full">
                                            {getProviderLabel(template.provider_target)}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {template.description || "Sem descricao auxiliar."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg"
                                        onClick={() => openEditDialog(template)}
                                        disabled={!canEditAiPrompts}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg"
                                        onClick={() => handleDuplicate(template)}
                                        disabled={!canCreateAiPrompts}
                                    >
                                        <Copy className="mr-1 h-3 w-3" />
                                        Duplicar
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
                                <pre className="line-clamp-6 whitespace-pre-wrap font-mono text-xs leading-6 text-muted-foreground">
                                    {template.content}
                                </pre>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="rounded-full">
                                    Ordem {template.sort_order}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                    Uso {template.usage_count}
                                </Badge>
                                <span>{formatLastUsedAt(template.last_used_at)}</span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => handleSetFavorite(template.id)}
                                    disabled={!canEditAiPrompts || template.is_favorite}
                                >
                                    <Star className="mr-1 h-3 w-3" />
                                    {template.is_favorite ? "Favorito atual" : "Definir favorito"}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => handleMove(template.id, "up")}
                                    disabled={!canEditAiPrompts || templateIndex === 0}
                                >
                                    <ArrowUp className="mr-1 h-3 w-3" />
                                    Subir
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => handleMove(template.id, "down")}
                                    disabled={
                                        !canEditAiPrompts ||
                                        templateIndex === templates.length - 1
                                    }
                                >
                                    <ArrowDown className="mr-1 h-3 w-3" />
                                    Descer
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget(template)}
                                    disabled={!canDeleteAiPrompts}
                                >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Arquivar
                                </Button>
                            </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "create" ? "Novo template" : "Editar template"}
                        </DialogTitle>
                        <DialogDescription>
                            Monte um prompt reutilizavel, com placeholders oficiais e preview de
                            compilacao para uma noticia de exemplo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(event) =>
                                            setField("name", event.target.value)
                                        }
                                        placeholder="Reescrita Jornalistica Padrao"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <Select
                                        value={form.provider_target}
                                        onValueChange={(value: PromptProviderTarget) =>
                                            setField("provider_target", value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="generic">Generico</SelectItem>
                                            <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                            <SelectItem value="claude">Claude</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Descricao</Label>
                                <Input
                                    value={form.description}
                                    onChange={(event) =>
                                        setField("description", event.target.value)
                                    }
                                    placeholder="Quando usar, tom esperado, observacoes para a redacao..."
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Template</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {variables.map((variable) => (
                                            <Button
                                                key={variable.key}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => insertVariableAtCursor(variable.key)}
                                            >
                                                {variable.key}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {!previewResult.hasMdUrl && (
                                    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                                        Este template nao inclui `{"{{md_url}}"}`. O salvamento
                                        continua liberado, mas a IA perde o link limpo para leitura
                                        da noticia.
                                    </div>
                                )}

                                {previewResult.unknownVariables.length > 0 && (
                                    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                                        Variaveis nao reconhecidas:{" "}
                                        {previewResult.unknownVariables.join(", ")}
                                    </div>
                                )}

                                <Textarea
                                    ref={textareaRef}
                                    value={form.content}
                                    onChange={(event) => setField("content", event.target.value)}
                                    placeholder="Cole aqui o template com variaveis como {{md_url}} e {{item_title}}."
                                    className="min-h-[320px] rounded-2xl font-mono text-sm leading-6"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold">Preview de compilacao</h3>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Simulacao usando uma noticia de exemplo.
                                </p>
                                <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-card p-4 font-mono text-xs leading-6 text-muted-foreground">
                                    {previewResult.compiledText || "Digite um template para ver o preview."}
                                </pre>
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-card p-4">
                                <h3 className="font-semibold">Noticia de exemplo</h3>
                                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                    <p>
                                        <span className="font-medium text-foreground">Titulo:</span>{" "}
                                        {sampleNewsItem.title}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Fonte:</span>{" "}
                                        {sampleNewsItem.source?.name}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Cidade:</span>{" "}
                                        {sampleNewsItem.ai_metadata?.city}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Categorias:</span>{" "}
                                        {sampleNewsItem.categories_raw?.join(", ")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-xl"
                            onClick={handleSave}
                            disabled={
                                !form.name.trim() ||
                                !form.content.trim() ||
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            {dialogMode === "create" ? "Criar template" : "Salvar alteracoes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                title="Arquivar template?"
                description={`O template ${deleteTarget?.name ?? ""} sera arquivado e saira do fluxo operacional no V1.`}
                confirmText="Arquivar"
                onConfirm={async () => {
                    if (!deleteTarget) {
                        return;
                    }

                    await archiveMutation.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </AppShell>
    );
};

export default AiPromptsManager;
