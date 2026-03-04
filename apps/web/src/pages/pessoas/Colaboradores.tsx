import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  User,
  Cake,
  Award,
  Mail,
  Phone,
  Building,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Loader2,
  CalendarDays,
  UserPlus,
  Briefcase,
  MapPin,
  Hash,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Collaborator } from "@/services/colaborador.service";
import {
  useColaboradores,
  useColaboradorStats,
  useCreateColaborador,
  useUpdateColaborador,
  useDeleteColaborador,
} from "@/hooks/useColaboradores";
import { RoleIcon } from "@/components/shared/RoleIcon";

// ==========================================
// TYPES & CONSTANTS
// ==========================================

type ProfileType = "admin" | "editor" | "journalist" | "media" | "analyst";

const profileConfig: Record<ProfileType, { label: string; color: string; icon: string; description: string }> = {
  admin: { label: "Administrador", color: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400", icon: "ShieldCheck", description: "Acesso total ao sistema" },
  editor: { label: "Editor", color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400", icon: "PenSquare", description: "Publica e aprova conteúdo" },
  journalist: { label: "Jornalista", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400", icon: "Newspaper", description: "Cria e edita conteúdo" },
  media: { label: "Mídias", color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400", icon: "Smartphone", description: "Gerencia mídias sociais" },
  analyst: { label: "Analista", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400", icon: "BarChart3", description: "Visualiza relatórios" },
};

const departments = ["Redação", "Economia", "Esportes", "Política", "Tecnologia", "Entretenimento", "Produção"];

// ==========================================
// HELPERS
// ==========================================

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ==========================================
// COMPONENT: Detail Row (reusable)
// ==========================================

function DetailRow({ icon: Icon, label, value, className }: { icon: any; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 p-3 bg-muted/30 rounded-xl", className)}>
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <div className="text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: View Collaborator Modal
// ==========================================

function ViewCollaboratorModal({
  collaborator,
  open,
  onClose,
}: {
  collaborator: Collaborator | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!collaborator) return null;

  const profile = profileConfig[collaborator.profile] || profileConfig.journalist;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-background shadow-lg">
              <AvatarImage src={collaborator.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {getInitials(collaborator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{collaborator.name}</h3>
              <p className="text-sm text-muted-foreground">{collaborator.department || "Sem departamento"}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className={cn("text-[10px] rounded-full border flex items-center gap-1", profile.color)}>
                  <RoleIcon name={profile.icon} className="w-3 h-3" /> {profile.label}
                </Badge>
                <Badge className={collaborator.active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] rounded-full border" : "bg-muted text-muted-foreground text-[10px] rounded-full border"}>
                  {collaborator.active ? "● Ativo" : "○ Inativo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <DetailRow icon={Mail} label="Email" value={<span className="truncate block">{collaborator.email}</span>} />
            <DetailRow icon={Phone} label="Telefone" value={collaborator.phone || "—"} />
            <DetailRow icon={CalendarDays} label="Aniversário" value={formatDate(collaborator.birth_date)} />
            <DetailRow icon={Briefcase} label="Admissão" value={formatDate(collaborator.admission_date)} />
            <DetailRow
              icon={Clock}
              label="Tempo de Empresa"
              value={collaborator.years_of_service != null ? `${Math.floor(collaborator.years_of_service)} anos` : "—"}
            />
            <DetailRow
              icon={Cake}
              label="Próximo Aniversário"
              value={
                collaborator.days_until_birthday === 0
                  ? <span className="text-amber-500 font-bold">🎉 Hoje!</span>
                  : collaborator.days_until_birthday != null
                    ? `em ${Math.floor(collaborator.days_until_birthday)} dias`
                    : "—"
              }
            />
          </div>

          {collaborator.upcoming_milestone && collaborator.upcoming_milestone.days_until > 0 && collaborator.upcoming_milestone.days_until <= 90 && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Completa <strong>{collaborator.upcoming_milestone.years} anos</strong> de casa em <strong>{Math.floor(collaborator.upcoming_milestone.days_until)} dias</strong>
            </div>
          )}

          <div className="pt-2">
            <DetailRow
              icon={Shield}
              label="Permissões"
              value={<span className="text-muted-foreground">{profile.description}</span>}
              className="bg-muted/20"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// COMPONENT: Form Modal (Create/Edit shared)
// ==========================================

function CollaboratorFormModal({
  collaborator,
  open,
  onClose,
  onSave,
  saving,
  mode,
}: {
  collaborator?: Collaborator | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  saving?: boolean;
  mode: "create" | "edit";
}) {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState<any>(() => getDefaultForm(collaborator));

  // Reset form when collaborator changes
  if (isEdit && collaborator && formData._id !== collaborator.id) {
    setFormData({
      _id: collaborator.id,
      name: collaborator.name,
      email: collaborator.email,
      phone: collaborator.phone || "",
      department: collaborator.department || "Redação",
      profile: collaborator.profile,
      birth_date: collaborator.birth_date || "",
      admission_date: collaborator.admission_date || "",
      active: collaborator.active,
    });
  }

  function getDefaultForm(collab?: Collaborator | null) {
    if (collab) {
      return {
        _id: collab.id,
        name: collab.name,
        email: collab.email,
        phone: collab.phone || "",
        department: collab.department || "Redação",
        profile: collab.profile,
        birth_date: collab.birth_date || "",
        admission_date: collab.admission_date || "",
        active: collab.active,
      };
    }
    return {
      _id: null,
      name: "",
      email: "",
      phone: "",
      department: "Redação",
      profile: "journalist" as ProfileType,
      birth_date: "",
      admission_date: new Date().toISOString().split("T")[0],
      active: true,
    };
  }

  const handleSave = () => {
    const payload: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      department: formData.department,
      profile: formData.profile,
      birth_date: formData.birth_date || null,
      admission_date: formData.admission_date || null,
    };
    if (isEdit) payload.active = formData.active;
    onSave(payload);
  };

  const handleClose = () => {
    if (!isEdit) {
      setFormData(getDefaultForm());
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isEdit ? <Edit className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
            {isEdit ? "Editar Colaborador" : "Novo Colaborador"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do colaborador" : "Preencha os dados para cadastrar um novo colaborador"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Dados pessoais */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Dados Pessoais
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome Completo *</Label>
                <Input
                  placeholder="Nome do colaborador"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  placeholder="email@vipsocial.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* Dados profissionais */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Dados Profissionais
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Departamento</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Perfil de Acesso *</Label>
                <Select value={formData.profile} onValueChange={(v) => setFormData({ ...formData, profile: v as ProfileType })}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(profileConfig).map(([key, { label, icon }]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5"><RoleIcon name={icon} className="w-3.5 h-3.5" /> {label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Data de Admissão</Label>
                <Input
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* Status toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", formData.active ? "bg-emerald-500/10" : "bg-muted")}>
                  {formData.active ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <Label className="text-sm font-medium">Status Ativo</Label>
                  <p className="text-xs text-muted-foreground">O colaborador pode acessar o sistema</p>
                </div>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={handleSave} disabled={saving || !formData.name || !formData.email}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isEdit ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isEdit ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const PessoasColaboradores = () => {
  // API filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProfile, setFilterProfile] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = { per_page: 50 };
    if (searchQuery) params["filter[search]"] = searchQuery;
    if (filterProfile !== "all") params["filter[profile]"] = filterProfile;
    if (filterStatus !== "all") params["filter[active]"] = filterStatus === "active" ? "1" : "0";
    return params;
  }, [searchQuery, filterProfile, filterStatus]);

  // Queries
  const { data: colaboradoresData, isLoading, error } = useColaboradores(queryParams);
  const { data: statsData } = useColaboradorStats();

  // Mutations
  const createMutation = useCreateColaborador();
  const updateMutation = useUpdateColaborador();
  const deleteMutation = useDeleteColaborador();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewCollab, setViewCollab] = useState<Collaborator | null>(null);
  const [editCollab, setEditCollab] = useState<Collaborator | null>(null);
  const [deleteCollab, setDeleteCollab] = useState<Collaborator | null>(null);

  const collaborators = colaboradoresData?.data || [];
  const stats = statsData?.data;

  // Handlers
  const handleCreate = (data: any) => {
    createMutation.mutate(data, { onSuccess: () => setIsAddDialogOpen(false) });
  };

  const handleEdit = (data: any) => {
    if (!editCollab) return;
    updateMutation.mutate({ id: editCollab.id, data }, { onSuccess: () => setEditCollab(null) });
  };

  const handleDelete = () => {
    if (!deleteCollab) return;
    deleteMutation.mutate(deleteCollab.id, { onSuccess: () => setDeleteCollab(null) });
  };

  return (
    <AppShell>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              Colaboradores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats ? `${stats.total} pessoas cadastradas · ${stats.active} ativos` : "Carregando..."}
            </p>
          </div>

          <Button className="bg-primary hover:bg-primary/90 rounded-xl shadow-sm" onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Colaborador
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: User, label: "Total", value: stats?.total, color: "bg-card border-border/50", textColor: "" },
          { icon: CheckCircle2, label: "Ativos", value: stats?.active, color: "bg-emerald-500/5 border-emerald-500/20", textColor: "text-emerald-600" },
          { icon: Cake, label: "Aniversários", value: stats?.birthdays_this_month, color: "bg-blue-500/5 border-blue-500/20", textColor: "text-blue-600", sub: "este mês" },
          { icon: Award, label: "Marcos", value: stats?.upcoming_milestones, color: "bg-amber-500/5 border-amber-500/20", textColor: "text-amber-600", sub: "próx. 30 dias" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn("rounded-xl p-4 border", stat.color)}
          >
            <div className={cn("flex items-center gap-2 text-sm", stat.textColor || "text-muted-foreground")}>
              <stat.icon className="w-4 h-4" />
              {stat.label}
            </div>
            <p className={cn("text-2xl font-bold mt-1", stat.textColor)}>{stat.value ?? "—"}</p>
            {stat.sub && <p className="text-[10px] text-muted-foreground">{stat.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-secondary/50 h-10"
          />
        </div>
        <Select value={filterProfile} onValueChange={setFilterProfile}>
          <SelectTrigger className="w-full md:w-[160px] rounded-xl h-10">
            <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Perfis</SelectItem>
            {Object.entries(profileConfig).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-1.5"><RoleIcon name={icon} className="w-3.5 h-3.5" /> {label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[140px] rounded-xl h-10">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">✅ Ativos</SelectItem>
            <SelectItem value="inactive">⏸ Inativos</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-muted-foreground text-sm">Carregando colaboradores...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="text-destructive font-medium">Erro ao carregar colaboradores</p>
          <p className="text-sm text-muted-foreground mt-1">Verifique se a API está rodando</p>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
          <AnimatePresence>
            {collaborators.map((person, i) => {
              const profile = profileConfig[person.profile] || profileConfig.journalist;
              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "bg-card rounded-xl p-4 border transition-all hover:shadow-md hover:border-primary/20 group",
                    !person.active ? "opacity-50 border-border/20" : "border-border/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-11 h-11 flex-shrink-0 ring-1 ring-border">
                      <AvatarImage src={person.avatar_url || undefined} />
                      <AvatarFallback className={cn("text-xs font-bold", profile.color)}>
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-sm">{person.name}</h3>
                        <Badge className={cn("text-[10px] rounded-full border px-2 py-0 flex items-center gap-1", profile.color)}>
                          <RoleIcon name={profile.icon} className="w-3 h-3" /> {profile.label}
                        </Badge>
                        {!person.active && (
                          <Badge variant="outline" className="text-[10px] rounded-full text-muted-foreground">
                            Inativo
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">{person.department || "Sem departamento"}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{person.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{person.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{person.years_of_service != null ? `${Math.floor(person.years_of_service)} anos` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Cake className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {person.days_until_birthday === 0
                              ? "🎉 Hoje!"
                              : person.days_until_birthday != null
                                ? `Aniversário em ${Math.floor(person.days_until_birthday)} dias`
                                : "—"}
                          </span>
                        </div>
                      </div>

                      {person.upcoming_milestone && person.upcoming_milestone.days_until > 0 && person.upcoming_milestone.days_until <= 30 && (
                        <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[11px] flex items-center gap-1.5">
                          <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span>
                            Completa <strong>{person.upcoming_milestone.years} anos</strong> em{" "}
                            <strong>{Math.floor(person.upcoming_milestone.days_until)} dias</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewCollab(person)}>
                          <Eye className="w-4 h-4 mr-2" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditCollab(person)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = "/pessoas/permissoes"}>
                          <Shield className="w-4 h-4 mr-2" /> Permissões
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteCollab(person)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {collaborators.length === 0 && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhum colaborador encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tente ajustar os filtros ou adicione um novo colaborador</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <ViewCollaboratorModal collaborator={viewCollab} open={!!viewCollab} onClose={() => setViewCollab(null)} />

      <CollaboratorFormModal
        mode="create"
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleCreate}
        saving={createMutation.isPending}
      />

      <CollaboratorFormModal
        mode="edit"
        collaborator={editCollab}
        open={!!editCollab}
        onClose={() => setEditCollab(null)}
        onSave={handleEdit}
        saving={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteCollab}
        onOpenChange={(open) => !open && setDeleteCollab(null)}
        title="Remover Colaborador"
        description={
          <>
            Tem certeza que deseja remover <strong>{deleteCollab?.name}</strong>?
            <br />
            O acesso ao sistema será revogado.
          </>
        }
        confirmText="Remover"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
};

export default PessoasColaboradores;
