import { useMemo, useState } from "react";
import { Globe, KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
import { useConfirmDialog } from "@/components/ConfirmDialog";
import {
  useCreatePollSite,
  useCreatePollSiteDomain,
  useDeletePollSiteDomain,
  usePollSites,
  useUpdatePollSite,
  useUpdatePollSiteDomain,
} from "@/hooks/useEnquetes";
import type {
  CreatePollSiteDTO,
  CreatePollSiteDomainDTO,
  PollSite,
  PollSiteDomain,
} from "@/services/enquete.service";

interface SiteFormState {
  id?: number;
  name: string;
  public_key: string;
  secret_key: string;
  is_active: boolean;
}

interface DomainFormState {
  id?: number;
  siteId: number | null;
  domain_pattern: string;
  is_active: boolean;
}

const emptySiteForm = (): SiteFormState => ({
  name: "",
  public_key: "",
  secret_key: "",
  is_active: true,
});

const emptyDomainForm = (): DomainFormState => ({
  siteId: null,
  domain_pattern: "",
  is_active: true,
});

export function PollSitesManager() {
  const sitesQuery = usePollSites();
  const createSiteMutation = useCreatePollSite();
  const updateSiteMutation = useUpdatePollSite();
  const createDomainMutation = useCreatePollSiteDomain();
  const updateDomainMutation = useUpdatePollSiteDomain();
  const deleteDomainMutation = useDeletePollSiteDomain();

  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [siteForm, setSiteForm] = useState<SiteFormState>(emptySiteForm);
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [domainForm, setDomainForm] = useState<DomainFormState>(emptyDomainForm);

  const {
    confirm,
    dialogProps,
    ConfirmDialog: ConfirmDialogRenderer,
  } = useConfirmDialog();

  const sites = useMemo(() => sitesQuery.data?.data ?? [], [sitesQuery.data]);
  const isSavingSite = createSiteMutation.isPending || updateSiteMutation.isPending;
  const isSavingDomain = createDomainMutation.isPending || updateDomainMutation.isPending;

  const openCreateSite = () => {
    setSiteForm(emptySiteForm());
    setSiteDialogOpen(true);
  };

  const openEditSite = (site: PollSite) => {
    setSiteForm({
      id: site.id,
      name: site.name,
      public_key: site.public_key,
      secret_key: "",
      is_active: site.is_active,
    });
    setSiteDialogOpen(true);
  };

  const openCreateDomain = (siteId: number) => {
    setDomainForm({
      ...emptyDomainForm(),
      siteId,
    });
    setDomainDialogOpen(true);
  };

  const openEditDomain = (domain: PollSiteDomain) => {
    setDomainForm({
      id: domain.id,
      siteId: domain.poll_site_id,
      domain_pattern: domain.domain_pattern,
      is_active: domain.is_active,
    });
    setDomainDialogOpen(true);
  };

  const handleSaveSite = async () => {
    const payload: CreatePollSiteDTO = {
      name: siteForm.name.trim(),
      public_key: siteForm.public_key.trim() || null,
      secret_key: siteForm.secret_key.trim() || null,
      is_active: siteForm.is_active,
    };

    if (!payload.name) return;

    if (siteForm.id) {
      await updateSiteMutation.mutateAsync({ id: siteForm.id, data: payload });
    } else {
      await createSiteMutation.mutateAsync(payload);
    }

    setSiteDialogOpen(false);
    setSiteForm(emptySiteForm());
  };

  const handleSaveDomain = async () => {
    if (!domainForm.siteId) return;

    const payload: CreatePollSiteDomainDTO = {
      domain_pattern: domainForm.domain_pattern.trim(),
      is_active: domainForm.is_active,
    };

    if (!payload.domain_pattern) return;

    if (domainForm.id) {
      await updateDomainMutation.mutateAsync({ id: domainForm.id, data: payload });
    } else {
      await createDomainMutation.mutateAsync({ siteId: domainForm.siteId, data: payload });
    }

    setDomainDialogOpen(false);
    setDomainForm(emptyDomainForm());
  };

  const handleDeleteDomain = (domain: PollSiteDomain) => {
    confirm({
      title: "Remover dominio autorizado?",
      description: `O dominio ${domain.domain_pattern} sera removido do site autorizado.`,
      confirmText: "Remover",
      onConfirm: async () => {
        await deleteDomainMutation.mutateAsync(domain.id);
      },
    });
  };

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sites autorizados</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre os parceiros e dominios que podem incorporar o widget.
            </p>
          </div>

          <Button type="button" variant="outline" className="rounded-xl" onClick={openCreateSite}>
            <Plus className="mr-2 h-4 w-4" />
            Novo site
          </Button>
        </div>

        {sitesQuery.isLoading ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            Carregando sites autorizados...
          </div>
        ) : sites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            Nenhum site autorizado cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <div key={site.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{site.name}</h3>
                      <Badge variant={site.is_active ? "default" : "secondary"} className="rounded-full">
                        {site.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {site.has_secret_key ? (
                        <Badge variant="outline" className="rounded-full">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Secret configurado
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5" />
                        {site.public_key}
                      </span>
                      <span>{site.domains_count} dominio(s)</span>
                      <span>{site.placements_count} placement(s)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openCreateDomain(site.id)}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Dominio
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openEditSite(site)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {site.domains.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum dominio vinculado a este site.
                    </p>
                  ) : (
                    site.domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{domain.domain_pattern}</p>
                          <p className="text-xs text-muted-foreground">
                            {domain.is_active ? "Dominio liberado" : "Dominio inativo"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openEditDomain(domain)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDomain(domain)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{siteForm.id ? "Editar site" : "Novo site"}</DialogTitle>
            <DialogDescription>
              Defina o parceiro externo e a chave publica usada no contexto do embed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-site-name">Nome *</Label>
              <Input
                id="poll-site-name"
                value={siteForm.name}
                onChange={(event) => setSiteForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-xl"
                placeholder="Ex: Portal TV VIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-site-public-key">Public key</Label>
              <Input
                id="poll-site-public-key"
                value={siteForm.public_key}
                onChange={(event) => setSiteForm((current) => ({ ...current, public_key: event.target.value }))}
                className="rounded-xl"
                placeholder="Gerada automaticamente se vazio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-site-secret-key">Secret key</Label>
              <Input
                id="poll-site-secret-key"
                value={siteForm.secret_key}
                onChange={(event) => setSiteForm((current) => ({ ...current, secret_key: event.target.value }))}
                className="rounded-xl"
                placeholder={siteForm.id ? "Preencha apenas para trocar a chave" : "Opcional no MVP"}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Site ativo</p>
                <p className="text-xs text-muted-foreground">
                  Sites inativos nao devem ser usados em novos embeds.
                </p>
              </div>
              <Switch
                checked={siteForm.is_active}
                onCheckedChange={(checked) =>
                  setSiteForm((current) => ({ ...current, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSiteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="rounded-xl" onClick={handleSaveSite} disabled={isSavingSite}>
              {isSavingSite ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{domainForm.id ? "Editar dominio" : "Novo dominio"}</DialogTitle>
            <DialogDescription>
              Exemplo: tvvip.social, *.tvvip.social ou parceiro.com.br.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-site-domain">Dominio *</Label>
              <Input
                id="poll-site-domain"
                value={domainForm.domain_pattern}
                onChange={(event) =>
                  setDomainForm((current) => ({ ...current, domain_pattern: event.target.value }))
                }
                className="rounded-xl"
                placeholder="*.tvvip.social"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Dominio ativo</p>
                <p className="text-xs text-muted-foreground">
                  Desative para bloquear o uso sem perder historico.
                </p>
              </div>
              <Switch
                checked={domainForm.is_active}
                onCheckedChange={(checked) =>
                  setDomainForm((current) => ({ ...current, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDomainDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" className="rounded-xl" onClick={handleSaveDomain} disabled={isSavingDomain}>
              {isSavingDomain ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialogRenderer {...dialogProps} />
    </>
  );
}

export default PollSitesManager;
