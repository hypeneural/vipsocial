import { useMemo, useState } from "react";
import { Copy, ExternalLink, Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreatePollPlacement,
  usePollPlacements,
  usePollSites,
  useTogglePollPlacement,
  useUpdatePollPlacement,
} from "@/hooks/useEnquetes";
import type {
  CreatePollPlacementDTO,
  PollPlacement,
} from "@/services/enquete.service";
import showToast from "@/lib/toast";

interface PollPlacementsManagerProps {
  pollId: number;
}

interface PlacementFormState {
  id?: number;
  poll_site_id: number | null;
  placement_name: string;
  article_external_id: string;
  article_title: string;
  canonical_url: string;
  page_path: string;
  is_active: boolean;
}

const emptyPlacementForm = (): PlacementFormState => ({
  poll_site_id: null,
  placement_name: "",
  article_external_id: "",
  article_title: "",
  canonical_url: "",
  page_path: "",
  is_active: true,
});

function formatDate(value: string | null) {
  if (!value) return "Nunca visto";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PollPlacementsManager({ pollId }: PollPlacementsManagerProps) {
  const placementsQuery = usePollPlacements(pollId);
  const sitesQuery = usePollSites();
  const createPlacementMutation = useCreatePollPlacement(pollId);
  const updatePlacementMutation = useUpdatePollPlacement();
  const togglePlacementMutation = useTogglePollPlacement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PlacementFormState>(emptyPlacementForm);

  const placements = useMemo(() => placementsQuery.data?.data ?? [], [placementsQuery.data]);
  const sites = useMemo(() => sitesQuery.data?.data ?? [], [sitesQuery.data]);
  const isSaving = createPlacementMutation.isPending || updatePlacementMutation.isPending;

  const openCreateDialog = () => {
    setForm(emptyPlacementForm());
    setDialogOpen(true);
  };

  const openEditDialog = (placement: PollPlacement) => {
    setForm({
      id: placement.id,
      poll_site_id: placement.poll_site_id,
      placement_name: placement.placement_name,
      article_external_id: placement.article_external_id ?? "",
      article_title: placement.article_title ?? "",
      canonical_url: placement.canonical_url ?? "",
      page_path: placement.page_path ?? "",
      is_active: placement.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: CreatePollPlacementDTO = {
      poll_site_id: form.poll_site_id,
      placement_name: form.placement_name.trim(),
      article_external_id: form.article_external_id.trim() || null,
      article_title: form.article_title.trim() || null,
      canonical_url: form.canonical_url.trim() || null,
      page_path: form.page_path.trim() || null,
      is_active: form.is_active,
    };

    if (!payload.placement_name) return;

    if (form.id) {
      await updatePlacementMutation.mutateAsync({ id: form.id, data: payload });
    } else {
      await createPlacementMutation.mutateAsync(payload);
    }

    setDialogOpen(false);
    setForm(emptyPlacementForm());
  };

  const handleToggle = async (placement: PollPlacement) => {
    await togglePlacementMutation.mutateAsync(placement.id);
  };

  const handleCopy = async (placement: PollPlacement) => {
    try {
      await navigator.clipboard.writeText(placement.embed_url);
      showToast.success("URL de embed copiada");
    } catch {
      showToast.error("Falha ao copiar URL de embed");
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Placements e embed</h2>
            <p className="text-sm text-muted-foreground">
              Vincule a enquete a artigos, paginas e parceiros externos.
            </p>
          </div>

          <Button type="button" variant="outline" className="rounded-xl" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo placement
          </Button>
        </div>

        {placementsQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            Carregando placements...
          </div>
        ) : placements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            Nenhum placement cadastrado para esta enquete.
          </div>
        ) : (
          <div className="space-y-4">
            {placements.map((placement) => (
              <div key={placement.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{placement.placement_name}</h3>
                      <Badge variant={placement.is_active ? "default" : "secondary"} className="rounded-full">
                        {placement.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {placement.site ? (
                        <Badge variant="outline" className="rounded-full">
                          {placement.site.name}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {placement.article_title ? <p>{placement.article_title}</p> : null}
                      {placement.canonical_url ? <p className="break-all">{placement.canonical_url}</p> : null}
                      {placement.page_path ? <p>{placement.page_path}</p> : null}
                      <p>Ultimo acesso: {formatDate(placement.last_seen_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => handleCopy(placement)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Embed
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      asChild
                    >
                      <a href={placement.embed_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openEditDialog(placement)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => handleToggle(placement)}
                      disabled={togglePlacementMutation.isPending}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {placement.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar placement" : "Novo placement"}</DialogTitle>
            <DialogDescription>
              Use placements para medir artigo, URL e origem do embed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="placement-name">Nome do placement *</Label>
              <Input
                id="placement-name"
                value={form.placement_name}
                onChange={(event) => setForm((current) => ({ ...current, placement_name: event.target.value }))}
                className="rounded-xl"
                placeholder="Ex: Noticia destaque capa"
              />
            </div>

            <div className="space-y-2">
              <Label>Site parceiro</Label>
              <Select
                value={form.poll_site_id ? String(form.poll_site_id) : "none"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    poll_site_id: value === "none" ? null : Number(value),
                  }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sem site vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem site vinculado</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placement-article-id">ID externo do artigo</Label>
              <Input
                id="placement-article-id"
                value={form.article_external_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, article_external_id: event.target.value }))
                }
                className="rounded-xl"
                placeholder="cms_12345"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="placement-article-title">Titulo do artigo</Label>
              <Input
                id="placement-article-title"
                value={form.article_title}
                onChange={(event) => setForm((current) => ({ ...current, article_title: event.target.value }))}
                className="rounded-xl"
                placeholder="Titulo exibido no CMS"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="placement-canonical">URL canonica</Label>
              <Input
                id="placement-canonical"
                value={form.canonical_url}
                onChange={(event) => setForm((current) => ({ ...current, canonical_url: event.target.value }))}
                className="rounded-xl"
                placeholder="https://tvvip.social/noticia/exemplo"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="placement-page-path">Page path</Label>
              <Input
                id="placement-page-path"
                value={form.page_path}
                onChange={(event) => setForm((current) => ({ ...current, page_path: event.target.value }))}
                className="rounded-xl"
                placeholder="/noticia/exemplo"
              />
            </div>

            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Placement ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Placements inativos nao devem aceitar boot nem voto.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, is_active: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="rounded-xl" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PollPlacementsManager;
