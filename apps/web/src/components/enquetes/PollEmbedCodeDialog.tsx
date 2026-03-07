import { useMemo } from "react";
import { Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { PollPlacement } from "@/services/enquete.service";
import showToast from "@/lib/toast";

interface PollEmbedCodeDialogProps {
  placement: PollPlacement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildLoaderSnippet(placement: PollPlacement) {
  return `<script src="${placement.embed_loader_url}" data-min-height="640" data-max-width="720px" async></script>`;
}

function buildIframeSnippet(placement: PollPlacement) {
  return [
    "<div style=\"width: 100%; max-width: 720px; margin: 0 auto; overflow: hidden;\">",
    `  <iframe src="${placement.embed_url}"`,
    "    loading=\"lazy\"",
    "    frameborder=\"0\"",
    "    scrolling=\"no\"",
    "    style=\"width: 100%; min-height: 640px; border: none; overflow: hidden; display: block; background: transparent;\">",
    "  </iframe>",
    "</div>",
  ].join("\n");
}

export function PollEmbedCodeDialog({
  placement,
  open,
  onOpenChange,
}: PollEmbedCodeDialogProps) {
  const snippets = useMemo(() => {
    if (!placement) {
      return { loader: "", iframe: "" };
    }

    return {
      loader: buildLoaderSnippet(placement),
      iframe: buildIframeSnippet(placement),
    };
  }, [placement]);

  const copySnippet = async (content: string, successMessage: string) => {
    if (!content) {
      showToast.warning("Nenhum codigo disponivel para copiar");
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      showToast.success(successMessage);
    } catch {
      showToast.error("Nao foi possivel copiar o codigo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Codigos de incorporacao</DialogTitle>
          <DialogDescription>
            Use o script loader para responsividade automatica ou o iframe simples para integracao direta.
          </DialogDescription>
        </DialogHeader>

        {!placement ? (
          <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
            Nenhum placement selecionado para gerar o codigo.
          </div>
        ) : (
          <Tabs defaultValue="loader" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loader">Responsivo Automatico (JS)</TabsTrigger>
              <TabsTrigger value="iframe">Iframe Responsivo Simples</TabsTrigger>
            </TabsList>

            <TabsContent value="loader" className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Recomendado. O loader injeta o iframe e ajusta a altura automaticamente.
                </p>
                <Textarea readOnly value={snippets.loader} className="min-h-[160px] rounded-xl font-mono text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl" onClick={() => copySnippet(snippets.loader, "Snippet JS copiado")}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar JS
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                  <a href={placement.embed_loader_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir loader.js
                  </a>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-3">
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Alternativa simples. Mantem controle direto do container no site host.
                </p>
                <Textarea readOnly value={snippets.iframe} className="min-h-[220px] rounded-xl font-mono text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl" onClick={() => copySnippet(snippets.iframe, "Snippet iframe copiado")}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar iframe
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                  <a href={placement.embed_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir iframe
                  </a>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PollEmbedCodeDialog;
