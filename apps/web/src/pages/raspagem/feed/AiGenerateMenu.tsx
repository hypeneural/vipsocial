import { useState } from "react";
import {
    Bot,
    Brain,
    ClipboardCopy,
    Eye,
    ExternalLink,
    FileText,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import showToast from "@/lib/toast";
import {
    getChatGptUrl,
    getClaudeUrl,
    getMarkdownUrl,
    getRewritePrompt,
    fetchMarkdownContent,
} from "./ai-generate-utils";

interface AiGenerateMenuProps {
    publicToken: string | null | undefined;
}

function safeWindowOpen(url: string): void {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
        showToast.warning("Popup bloqueado pelo navegador. Copie o prompt e cole manualmente.");
    }
}

export function AiGenerateMenu({ publicToken }: AiGenerateMenuProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState("");
    const [loadingPreview, setLoadingPreview] = useState(false);

    if (!publicToken) return null;

    const handleOpenChatGpt = () => {
        safeWindowOpen(getChatGptUrl(publicToken));
    };

    const handleOpenClaude = () => {
        safeWindowOpen(getClaudeUrl(publicToken));
    };

    const handleCopyPrompt = async () => {
        try {
            const mdUrl = getMarkdownUrl(publicToken);
            const prompt = getRewritePrompt(mdUrl);
            await navigator.clipboard.writeText(prompt);
            showToast.success("Prompt copiado!");
        } catch {
            showToast.error("Nao foi possivel copiar o prompt");
        }
    };

    const handleCopyMarkdown = async () => {
        try {
            const content = await fetchMarkdownContent(publicToken);
            await navigator.clipboard.writeText(content);
            showToast.success("Markdown copiado!");
        } catch {
            showToast.error("Erro ao buscar markdown");
        }
    };

    const handleViewMarkdown = async () => {
        setLoadingPreview(true);
        setPreviewOpen(true);
        try {
            const content = await fetchMarkdownContent(publicToken);
            setPreviewContent(content);
        } catch {
            setPreviewContent("Erro ao carregar o markdown.");
            showToast.error("Erro ao buscar markdown");
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleOpenMarkdown = () => {
        const url = getMarkdownUrl(publicToken);
        safeWindowOpen(url);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                    >
                        <Sparkles className="mr-1 h-3 w-3" />
                        Gerar com I.A.
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={handleOpenChatGpt}>
                        <Bot className="mr-2 h-4 w-4" />
                        Abrir no ChatGPT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenClaude}>
                        <Brain className="mr-2 h-4 w-4" />
                        Abrir no Claude
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyPrompt}>
                        <ClipboardCopy className="mr-2 h-4 w-4" />
                        Copiar Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyMarkdown}>
                        <FileText className="mr-2 h-4 w-4" />
                        Copiar Markdown
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleViewMarkdown}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenMarkdown}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir Markdown
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Preview Markdown</DialogTitle>
                    </DialogHeader>
                    {loadingPreview ? (
                        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                            Carregando...
                        </div>
                    ) : (
                        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/30 p-4 font-mono text-xs leading-relaxed">
                            {previewContent}
                        </pre>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
