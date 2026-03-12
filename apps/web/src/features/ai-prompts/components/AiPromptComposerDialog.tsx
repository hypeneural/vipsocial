import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Bot,
    Brain,
    ClipboardCopy,
    ExternalLink,
    FileText,
    RefreshCcw,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import showToast from "@/lib/toast";
import type { NewsItem } from "@/services/newsRadar.service";
import {
    useAiPromptTemplates,
    useAiPromptVariables,
    useCreateStarterAiPromptTemplate,
    useTrackAiPromptTemplateUse,
} from "@/features/ai-prompts/hooks/useAiPrompts";
import {
    buildMarkdownUrl,
    buildProviderDeepLink,
    compilePrompt,
    fetchMarkdownContent,
    getAvailableVariables,
    getDefaultPromptTemplate,
    isDeepLinkSafe,
    sortPromptTemplates,
} from "@/features/ai-prompts/utils/prompt-template-utils";
import type { PromptActionProvider } from "@/features/ai-prompts/types";

interface AiPromptComposerDialogProps {
    open: boolean;
    newsItem: NewsItem | null;
    onOpenChange: (open: boolean) => void;
}

function getProviderLabel(provider: string): string {
    if (provider === "chatgpt") {
        return "ChatGPT";
    }

    if (provider === "claude") {
        return "Claude";
    }

    return "Generico";
}

function getMetaItems(newsItem: NewsItem) {
    return [
        newsItem.source?.name ? `Fonte: ${newsItem.source.name}` : null,
        newsItem.ai_metadata?.city ? `Cidade: ${newsItem.ai_metadata.city}` : null,
        newsItem.ai_metadata?.urgency ? `Urgencia: ${newsItem.ai_metadata.urgency}` : null,
        newsItem.categories_raw?.[0] ? `Categoria: ${newsItem.categories_raw[0]}` : null,
    ].filter(Boolean) as string[];
}

function safeWindowOpen(url: string): boolean {
    const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
    return Boolean(openedWindow);
}

export function AiPromptComposerDialog({
    open,
    newsItem,
    onOpenChange,
}: AiPromptComposerDialogProps) {
    const navigate = useNavigate();
    const templatesQuery = useAiPromptTemplates({ per_page: 100 }, open);
    const variablesQuery = useAiPromptVariables(open);
    const starterMutation = useCreateStarterAiPromptTemplate();
    const trackUseMutation = useTrackAiPromptTemplateUse();

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [draftText, setDraftText] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);

    const templates = useMemo(
        () => sortPromptTemplates(templatesQuery.data?.data ?? []),
        [templatesQuery.data?.data],
    );
    const selectedTemplate = templates.find(
        (template) => String(template.id) === selectedTemplateId,
    ) ?? null;
    const compileResult = useMemo(() => {
        if (!newsItem || !selectedTemplate) {
            return null;
        }

        return compilePrompt(selectedTemplate.content, newsItem);
    }, [newsItem, selectedTemplate]);
    const variableCatalog = variablesQuery.data?.data ?? getAvailableVariables();
    const draftChanged = Boolean(compileResult) && draftText !== compileResult.compiledText;
    const metaItems = newsItem ? getMetaItems(newsItem) : [];

    useEffect(() => {
        if (!open || templates.length === 0) {
            return;
        }

        const defaultTemplate = getDefaultPromptTemplate(templates);
        if (!defaultTemplate) {
            return;
        }

        setSelectedTemplateId((currentId) =>
            currentId && templates.some((template) => String(template.id) === currentId)
                ? currentId
                : String(defaultTemplate.id),
        );
    }, [open, templates]);

    useEffect(() => {
        if (!open || !compileResult) {
            return;
        }

        setDraftText(compileResult.compiledText);
    }, [compileResult?.compiledText, open]);

    const trackUse = () => {
        if (!selectedTemplate) {
            return;
        }

        void trackUseMutation.mutateAsync(selectedTemplate.id).catch(() => undefined);
    };

    const handleOpenProvider = (provider: PromptActionProvider) => {
        if (!draftText.trim()) {
            showToast.warning("Nao ha prompt compilado para abrir.");
            return;
        }

        const url = buildProviderDeepLink(provider, draftText);

        if (!isDeepLinkSafe(url)) {
            showToast.warning(
                "Prompt muito grande para abrir direto. Copie e cole manualmente no provider.",
            );
            return;
        }

        if (!safeWindowOpen(url)) {
            showToast.warning(
                "Popup bloqueado pelo navegador. Copie o prompt e cole manualmente.",
            );
            return;
        }

        trackUse();
    };

    const handleCopyPrompt = async () => {
        if (!draftText.trim()) {
            showToast.warning("Nao ha prompt compilado para copiar.");
            return;
        }

        try {
            await navigator.clipboard.writeText(draftText);
            showToast.success("Prompt copiado.");
            trackUse();
        } catch {
            showToast.error("Nao foi possivel copiar o prompt.");
        }
    };

    const handleOpenMarkdown = () => {
        if (!newsItem) {
            return;
        }

        safeWindowOpen(buildMarkdownUrl(newsItem.public_token));
    };

    const handleViewMarkdown = async () => {
        if (!newsItem) {
            return;
        }

        setPreviewOpen(true);
        setPreviewLoading(true);

        try {
            const content = await fetchMarkdownContent(newsItem.public_token);
            setPreviewContent(content);
        } catch {
            setPreviewContent("Erro ao carregar o markdown.");
            showToast.error("Nao foi possivel carregar o markdown.");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCreateStarter = async () => {
        try {
            const response = await starterMutation.mutateAsync();
            setSelectedTemplateId(String(response.data.id));
        } catch {
            // handled by hook
        }
    };

    const openManager = () => {
        onOpenChange(false);
        navigate("/raspagem/config/prompts-ia");
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Gerar Assistencia de Inteligencia Artificial
                        </DialogTitle>
                        <DialogDescription>
                            Selecione um template, ajuste o texto final e envie para o provider
                            que fizer sentido no momento.
                        </DialogDescription>
                    </DialogHeader>

                    {!newsItem ? null : templatesQuery.isLoading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Carregando templates...
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="space-y-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold">Voce ainda nao possui templates.</p>
                                <p className="text-sm text-muted-foreground">
                                    Crie um prompt personalizado ou use o modelo inicial para
                                    reproduzir o fluxo atual de reescrita.
                                </p>
                            </div>
                            <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                <Button className="rounded-xl" onClick={openManager}>
                                    Criar primeiro template
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={handleCreateStarter}
                                    disabled={starterMutation.isPending}
                                >
                                    Usar modelo inicial
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                                <div className="space-y-2">
                                    <Label>Template selecionado</Label>
                                    <Select
                                        value={selectedTemplateId}
                                        onValueChange={setSelectedTemplateId}
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Selecione um template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem
                                                    key={template.id}
                                                    value={String(template.id)}
                                                >
                                                    {template.name} · {getProviderLabel(template.provider_target)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedTemplate && (
                                    <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedTemplate.is_favorite && (
                                                <Badge className="rounded-full bg-primary/15 text-primary">
                                                    Favorito
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="rounded-full">
                                                {getProviderLabel(selectedTemplate.provider_target)}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full">
                                                Ordem {selectedTemplate.sort_order}
                                            </Badge>
                                        </div>
                                        {selectedTemplate.description && (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                {selectedTemplate.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {compileResult && (
                                <>
                                    {compileResult.unknownVariables.length > 0 && (
                                        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="mt-0.5 h-4 w-4" />
                                                <div>
                                                    O template contem variaveis nao reconhecidas:{" "}
                                                    {compileResult.unknownVariables.join(", ")}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!compileResult.hasMdUrl && (
                                        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="mt-0.5 h-4 w-4" />
                                                <div>
                                                    Este template nao inclui `{"{{md_url}}"}`. O
                                                    salvamento continua liberado, mas a IA perde o
                                                    link limpo para leitura da noticia.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Prompt compilado</Label>
                                        <Textarea
                                            value={draftText}
                                            onChange={(event) => setDraftText(event.target.value)}
                                            className="min-h-[280px] rounded-2xl font-mono text-sm leading-6"
                                        />
                                    </div>

                                    {metaItems.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {metaItems.map((item) => (
                                                <Badge
                                                    key={item}
                                                    variant="secondary"
                                                    className="rounded-full"
                                                >
                                                    {item}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Variaveis disponiveis
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {variableCatalog.map((variable) => (
                                                <Badge
                                                    key={variable.key}
                                                    variant="outline"
                                                    className="rounded-full"
                                                >
                                                    {variable.key}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() =>
                                    compileResult && setDraftText(compileResult.compiledText)
                                }
                                disabled={!compileResult || !draftChanged}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Restaurar template original
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={handleViewMarkdown}
                                disabled={!newsItem}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Visualizar Markdown
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={handleOpenMarkdown}
                                disabled={!newsItem}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Abrir Markdown
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={handleOpenProvider("chatgpt")}
                                disabled={!compileResult}
                            >
                                <Bot className="mr-2 h-4 w-4" />
                                Abrir no ChatGPT
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={handleOpenProvider("claude")}
                                disabled={!compileResult}
                            >
                                <Brain className="mr-2 h-4 w-4" />
                                Abrir no Claude
                            </Button>
                            <Button
                                className="rounded-xl"
                                onClick={handleCopyPrompt}
                                disabled={!compileResult}
                            >
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                Copiar Prompt
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Preview do Markdown</DialogTitle>
                    </DialogHeader>
                    {previewLoading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Carregando markdown...
                        </div>
                    ) : (
                        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/20 p-4 font-mono text-xs leading-6">
                            {previewContent}
                        </pre>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AiPromptComposerDialog;
