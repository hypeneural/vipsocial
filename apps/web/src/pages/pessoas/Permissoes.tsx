import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Users,
    Check,
    X,
    Edit,
    Save,
    RotateCcw,
    Loader2,
    XCircle,
    Lock,
    UserPlus,
    Search,
    ChevronRight,
    Plus,
    Trash2,
    LayoutDashboard,
    Newspaper,
    MapPin,
    FileText,
    BarChart3,
    Zap,
    Workflow,
    Bot,
    Settings,
    AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    usePermissoes,
    useUpdateRolePermissions,
    useUserPermissions,
    useUpdateUserPermissions,
    useRoleUsers,
    useCreateRole,
    useUpdateRoleMeta,
    useDeleteRole,
} from "@/hooks/usePermissoes";
import { useColaboradores } from "@/hooks/useColaboradores";
import { RoleIcon } from "@/components/shared/RoleIcon";
import type { ModulePermissionData, RoleData } from "@/services/permissao.service";

// ==========================================
// ICON MAP — Lucide icon components by name
// ==========================================
const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard,
    Newspaper,
    MapPin,
    FileText,
    BarChart3,
    Zap,
    Workflow,
    Bot,
    Users,
    Settings,
};

function ModuleIcon({ name, className }: { name: string; className?: string }) {
    const Icon = iconMap[name] || Shield;
    return <Icon className={className} />;
}

function getInitials(name: string): string {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const permLabels: Record<string, string> = {
    view: "Ver",
    create: "Criar",
    edit: "Editar",
    delete: "Excluir",
    publish: "Publicar",
};

// Role color palette
const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-600 border-red-500/20",
    editor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    journalist: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    media: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    analyst: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function getRoleColor(roleId: string): string {
    return roleColors[roleId] || "bg-violet-500/10 text-violet-600 border-violet-500/20";
}

// ==========================================
// MAIN COMPONENT
// ==========================================
const Permissoes = () => {
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedPermissions, setEditedPermissions] = useState<
        Record<string, Record<string, ModulePermissionData>> | null
    >(null);
    const [activeTab, setActiveTab] = useState("roles");

    // User exceptions tab
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [editedUserPerms, setEditedUserPerms] = useState<string[] | null>(null);

    // Modals
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [showEditRole, setShowEditRole] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRoleUsers, setShowRoleUsers] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [editRoleDesc, setEditRoleDesc] = useState("");

    // Queries
    const { data: permData, isLoading, error } = usePermissoes();
    const { data: colaboradoresData } = useColaboradores({ per_page: 100 });
    const { data: userPermsData, isLoading: isLoadingUserPerms } = useUserPermissions(selectedUserId);
    const { data: roleUsersData, isLoading: isLoadingRoleUsers } = useRoleUsers(showRoleUsers);

    // Mutations
    const updateRoleMutation = useUpdateRolePermissions();
    const updateUserPermsMutation = useUpdateUserPermissions();
    const createRoleMutation = useCreateRole();
    const updateRoleMetaMutation = useUpdateRoleMeta();
    const deleteRoleMutation = useDeleteRole();

    const roles = permData?.data?.roles || [];
    const modules = permData?.data?.modules || [];
    const serverPermissions = permData?.data?.permissions || {};

    // Set default role
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0].id);
        }
    }, [roles, selectedRole]);

    const currentPermissions = editedPermissions || serverPermissions;
    const currentRole = roles.find((r) => r.id === selectedRole);

    // Collaborators for user tab
    const collaborators = colaboradoresData?.data || [];
    const filteredCollaborators = useMemo(() => {
        if (!userSearch) return collaborators;
        const lower = userSearch.toLowerCase();
        return collaborators.filter(
            (c: any) => c.name.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower)
        );
    }, [collaborators, userSearch]);

    useEffect(() => { setEditedUserPerms(null); }, [selectedUserId]);

    const currentUserDirectPerms = editedUserPerms ?? (userPermsData?.data?.direct_permissions || []);

    // ── HANDLERS ──────────────────────────────

    const togglePermission = (module: string, action: keyof ModulePermissionData["permissions"]) => {
        if (!isEditing || !currentPermissions[selectedRole]) return;
        const updated = { ...currentPermissions };
        updated[selectedRole] = { ...updated[selectedRole] };
        updated[selectedRole][module] = {
            ...updated[selectedRole][module],
            permissions: {
                ...updated[selectedRole][module].permissions,
                [action]: !updated[selectedRole][module].permissions[action],
            },
        };
        setEditedPermissions(updated);
    };

    const handleSaveRole = () => {
        if (!editedPermissions || !selectedRole) return;
        updateRoleMutation.mutate(
            { roleName: selectedRole, permissions: editedPermissions[selectedRole] },
            { onSuccess: () => { setIsEditing(false); setEditedPermissions(null); } }
        );
    };

    const handleCancel = () => { setIsEditing(false); setEditedPermissions(null); };

    const handleStartEdit = () => {
        setEditedPermissions(JSON.parse(JSON.stringify(serverPermissions)));
        setIsEditing(true);
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) return;
        createRoleMutation.mutate(
            { name: newRoleName.trim(), description: newRoleDesc.trim() || undefined },
            {
                onSuccess: () => {
                    setShowCreateRole(false);
                    setNewRoleName("");
                    setNewRoleDesc("");
                },
            }
        );
    };

    const handleEditRole = () => {
        if (!selectedRole) return;
        updateRoleMetaMutation.mutate(
            { roleName: selectedRole, description: editRoleDesc },
            { onSuccess: () => setShowEditRole(false) }
        );
    };

    const handleDeleteRole = () => {
        if (!selectedRole) return;
        deleteRoleMutation.mutate(selectedRole, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                setSelectedRole(roles.find((r) => r.id !== selectedRole)?.id || "");
            },
        });
    };

    const toggleUserPerm = (permName: string) => {
        const current = [...currentUserDirectPerms];
        const idx = current.indexOf(permName);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(permName);
        setEditedUserPerms(current);
    };

    const handleSaveUserPerms = () => {
        if (!selectedUserId || !editedUserPerms) return;
        updateUserPermsMutation.mutate(
            { userId: selectedUserId, permissions: editedUserPerms },
            { onSuccess: () => setEditedUserPerms(null) }
        );
    };

    // ── RENDER ────────────────────────────────

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                    <span className="text-muted-foreground text-sm">Carregando permissões...</span>
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell>
                <div className="text-center py-20">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium">Erro ao carregar permissões</p>
                    <p className="text-sm text-muted-foreground mt-1">Verifique se a API está rodando</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-primary" />
                            </div>
                            Perfis e Permissões
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gerencie perfis de acesso, permissões por módulo e exceções por usuário
                        </p>
                    </div>
                    <Button className="rounded-xl" onClick={() => setShowCreateRole(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Novo Perfil
                    </Button>
                </div>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex h-auto gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="roles"
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:border border-border/50"
                    >
                        <Shield className="w-4 h-4 mr-2" /> Perfis
                    </TabsTrigger>
                    <TabsTrigger
                        value="users"
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:border border-border/50"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Exceções por Usuário
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════ TAB 1 — ROLE PERMISSIONS ═══════════ */}
                <TabsContent value="roles">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Role Selector */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => { setSelectedRole(role.id); handleCancel(); }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium",
                                        selectedRole === role.id
                                            ? cn(getRoleColor(role.id), "shadow-md ring-1 ring-current/20")
                                            : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <RoleIcon name={role.icon} className="w-4 h-4" />
                                    {role.name}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowRoleUsers(role.id); }}
                                        className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-[10px] font-bold"
                                        title="Ver usuários vinculados"
                                    >
                                        <Users className="w-3 h-3" />
                                        {role.users_count}
                                    </button>
                                </button>
                            ))}
                        </div>

                        {/* Role Info + Actions */}
                        {currentRole && (
                            <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={cn("text-xs border", getRoleColor(currentRole.id))}>{currentRole.name}</Badge>
                                            <button
                                                onClick={() => setShowRoleUsers(currentRole.id)}
                                                className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                                            >
                                                <Users className="w-3 h-3" />
                                                {currentRole.users_count} usuário{currentRole.users_count !== 1 ? "s" : ""}
                                            </button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {currentRole.description || "Sem descrição"}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {selectedRole !== "admin" && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl"
                                                    onClick={() => {
                                                        setEditRoleDesc(currentRole.description || "");
                                                        setShowEditRole(true);
                                                    }}
                                                >
                                                    <Edit className="w-3.5 h-3.5 mr-1" /> Editar Perfil
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                                                </Button>
                                            </>
                                        )}
                                        {isEditing ? (
                                            <>
                                                <Button variant="outline" className="rounded-xl" onClick={handleCancel} size="sm">
                                                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Cancelar
                                                </Button>
                                                <Button
                                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={handleSaveRole}
                                                    disabled={updateRoleMutation.isPending}
                                                    size="sm"
                                                >
                                                    {updateRoleMutation.isPending ? (
                                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                                    ) : (
                                                        <Save className="w-3.5 h-3.5 mr-1" />
                                                    )}
                                                    Salvar Permissões
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                className="rounded-xl"
                                                onClick={handleStartEdit}
                                                disabled={selectedRole === "admin"}
                                                size="sm"
                                            >
                                                <Edit className="w-3.5 h-3.5 mr-1" /> Editar Permissões
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedRole === "admin" && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-sm text-amber-600 flex items-center gap-2">
                                <Lock className="w-4 h-4 flex-shrink-0" />
                                O perfil Administrador tem acesso total e não pode ser editado
                            </div>
                        )}

                        {/* Permission Matrix */}
                        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="text-left py-3 px-4 text-xs font-semibold min-w-[180px] uppercase tracking-wider text-muted-foreground">
                                                Módulo
                                            </th>
                                            {Object.entries(permLabels).map(([key, label]) => (
                                                <th key={key} className="text-center py-3 px-4 text-xs font-semibold min-w-[80px] uppercase tracking-wider text-muted-foreground">
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modules.map((mod: any) => {
                                            const moduleData = currentPermissions[selectedRole]?.[mod.label];
                                            if (!moduleData) return null;

                                            return (
                                                <tr key={mod.label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                                                <ModuleIcon name={mod.icon} className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <span className="font-medium text-sm">{mod.label}</span>
                                                        </div>
                                                    </td>
                                                    {(["view", "create", "edit", "delete", "publish"] as const).map((perm) => (
                                                        <td
                                                            key={perm}
                                                            className={cn(
                                                                "text-center py-3 px-4",
                                                                isEditing && selectedRole !== "admin" && "cursor-pointer hover:bg-muted/50"
                                                            )}
                                                            onClick={() => togglePermission(mod.label, perm)}
                                                        >
                                                            {moduleData.permissions[perm] ? (
                                                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10">
                                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted/30">
                                                                    <X className="w-4 h-4 text-muted-foreground/30" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {isEditing && selectedRole !== "admin" && (
                            <p className="text-sm text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                                <Edit className="w-3.5 h-3.5" /> Clique nas células para alternar as permissões
                            </p>
                        )}
                    </motion.div>
                </TabsContent>

                {/* ═══════════ TAB 2 — USER EXCEPTIONS ═══════════ */}
                <TabsContent value="users">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* User List */}
                            <div className="lg:col-span-1">
                                <div className="bg-card rounded-2xl border border-border/50 p-4">
                                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" /> Selecionar Usuário
                                    </h3>
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome ou e-mail..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="pl-9 rounded-xl h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                        {filteredCollaborators.map((user: any) => (
                                            <button
                                                key={user.id}
                                                onClick={() => setSelectedUserId(user.id)}
                                                className={cn(
                                                    "flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-all text-sm",
                                                    selectedUserId === user.id
                                                        ? "bg-primary/10 border border-primary/20"
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarFallback className="text-[10px] bg-muted font-bold">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{user.profile || user.email}</p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* User Permission Editor */}
                            <div className="lg:col-span-2">
                                {!selectedUserId ? (
                                    <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                            <UserPlus className="w-7 h-7 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">Selecione um usuário</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            Escolha um colaborador para ver e editar suas permissões diretas
                                        </p>
                                    </div>
                                ) : isLoadingUserPerms ? (
                                    <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                                        <span className="text-muted-foreground text-sm">Carregando...</span>
                                    </div>
                                ) : userPermsData?.data ? (
                                    <div className="space-y-4">
                                        {/* User Info */}
                                        <div className="bg-card rounded-2xl border border-border/50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                            {getInitials(userPermsData.data.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{userPermsData.data.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {userPermsData.data.email} · Perfil: <strong>{userPermsData.data.role}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                                {editedUserPerms && (
                                                    <Button
                                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={handleSaveUserPerms}
                                                        disabled={updateUserPermsMutation.isPending}
                                                        size="sm"
                                                    >
                                                        {updateUserPermsMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <Save className="w-4 h-4 mr-1" />
                                                        )}
                                                        Salvar Exceções
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info banner */}
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-600 flex items-start gap-2">
                                            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium">Permissões diretas (exceções)</p>
                                                <p className="text-xs text-blue-500 mt-0.5">
                                                    Marque permissões adicionais que este usuário precisa além do perfil ({userPermsData.data.role}).
                                                </p>
                                            </div>
                                        </div>

                                        {/* Permission grid */}
                                        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-border bg-muted/30">
                                                            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                                                                Módulo
                                                            </th>
                                                            {Object.entries(permLabels).map(([key, label]) => (
                                                                <th key={key} className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[80px]">
                                                                    {label}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {modules.map((mod: any) => {
                                                            const actions = ["view", "create", "edit", "delete", "publish"];
                                                            const rolePerms = serverPermissions[userPermsData.data.role || ""]?.[mod.label]?.permissions || {};

                                                            return (
                                                                <tr key={mod.label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                                                                <ModuleIcon name={mod.icon} className="w-4 h-4 text-muted-foreground" />
                                                                            </div>
                                                                            <span className="font-medium text-sm">{mod.label}</span>
                                                                        </div>
                                                                    </td>
                                                                    {actions.map((action) => {
                                                                        const permName = `${mod.slug}.${action}`;
                                                                        const fromRole = rolePerms[action as keyof typeof rolePerms] || false;
                                                                        const isDirect = currentUserDirectPerms.includes(permName);

                                                                        return (
                                                                            <td
                                                                                key={action}
                                                                                className={cn(
                                                                                    "text-center py-3 px-4",
                                                                                    !fromRole && "cursor-pointer hover:bg-muted/50"
                                                                                )}
                                                                                onClick={() => { if (!fromRole) toggleUserPerm(permName); }}
                                                                            >
                                                                                {fromRole ? (
                                                                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10" title="Via perfil">
                                                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                                                    </div>
                                                                                ) : isDirect ? (
                                                                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 ring-2 ring-blue-500/30" title="Exceção direta">
                                                                                        <Check className="w-4 h-4 text-blue-500" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted/30">
                                                                                        <X className="w-4 h-4 text-muted-foreground/30" />
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Legend */}
                                        <div className="flex gap-6 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                Via perfil (herdado)
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-blue-500/10 ring-2 ring-blue-500/30 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-blue-500" />
                                                </div>
                                                Exceção direta
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-muted/30 flex items-center justify-center">
                                                    <X className="w-3 h-3 text-muted-foreground/30" />
                                                </div>
                                                Sem acesso
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* ═══════════ MODALS ═══════════ */}

            {/* Create Role Modal */}
            <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Novo Perfil
                        </DialogTitle>
                        <DialogDescription>
                            Crie um novo perfil de acesso ao sistema. Depois de criar, configure as permissões.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="role-name">Nome do Perfil</Label>
                            <Input
                                id="role-name"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="Ex: supervisor"
                                className="mt-1.5 rounded-xl"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Use nome simples, sem acentos. Será convertido para minúsculas.
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="role-desc">Descrição</Label>
                            <Textarea
                                id="role-desc"
                                value={newRoleDesc}
                                onChange={(e) => setNewRoleDesc(e.target.value)}
                                placeholder="Ex: Supervisiona equipes e aprova publicações"
                                className="mt-1.5 rounded-xl resize-none"
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateRole(false)} className="rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateRole}
                            disabled={!newRoleName.trim() || createRoleMutation.isPending}
                            className="rounded-xl"
                        >
                            {createRoleMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            Criar Perfil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Modal */}
            <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-primary" /> Editar Perfil
                        </DialogTitle>
                        <DialogDescription>
                            Editar a descrição do perfil "{currentRole?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="edit-role-desc">Descrição</Label>
                        <Textarea
                            id="edit-role-desc"
                            value={editRoleDesc}
                            onChange={(e) => setEditRoleDesc(e.target.value)}
                            className="mt-1.5 rounded-xl resize-none"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditRole(false)} className="rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditRole}
                            disabled={updateRoleMetaMutation.isPending}
                            className="rounded-xl"
                        >
                            {updateRoleMetaMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" /> Excluir Perfil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o perfil <strong>"{currentRole?.name}"</strong>?
                            {(currentRole?.users_count ?? 0) > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    ⚠️ Este perfil possui {currentRole?.users_count} usuário(s) vinculado(s) e não poderá ser excluído.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRole}
                            className="rounded-xl bg-destructive hover:bg-destructive/90"
                            disabled={deleteRoleMutation.isPending}
                        >
                            {deleteRoleMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Role Users Modal */}
            <Dialog open={!!showRoleUsers} onOpenChange={() => setShowRoleUsers(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Usuários — {roleUsersData?.data?.role || "..."}
                        </DialogTitle>
                        <DialogDescription>
                            Lista de colaboradores vinculados a este perfil
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[50vh]">
                        {isLoadingRoleUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (roleUsersData?.data?.users?.length ?? 0) === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a este perfil</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nome</th>
                                        <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                                        <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cargo</th>
                                        <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tempo de Empresa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleUsersData?.data?.users?.map((u) => (
                                        <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                                                            {getInitials(u.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">{u.email}</td>
                                            <td className="py-2.5 px-3">{u.department}</td>
                                            <td className="py-2.5 px-3">{u.tempo_empresa}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default Permissoes;
