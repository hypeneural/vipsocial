import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Shield,
    Mail,
    Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    User,
    ROLE_CONFIG,
    getUserInitials,
    getAvatarColor,
    formatLastActivity,
} from "@/types/user";
import { cn } from "@/lib/utils";

// Mock users
const mockUsers: User[] = [
    { user_id: 1, name: "João Silva", email: "joao.silva@vipsocial.com.br", role: "admin", phone: "+55 47 99999-1234", department: "Redação", active: true, last_login_at: "2026-01-20T19:30:00", created_at: "2024-06-15", updated_at: "2026-01-20" },
    { user_id: 2, name: "Maria Santos", email: "maria.santos@vipsocial.com.br", role: "editor", phone: "+55 47 99999-5678", department: "Jornalismo", active: true, last_login_at: "2026-01-20T18:00:00", created_at: "2024-08-20", updated_at: "2026-01-19" },
    { user_id: 3, name: "Carlos Oliveira", email: "carlos.oliveira@vipsocial.com.br", role: "editor", department: "Esportes", active: true, last_login_at: "2026-01-20T14:30:00", created_at: "2025-01-10", updated_at: "2026-01-15" },
    { user_id: 4, name: "Ana Costa", email: "ana.costa@vipsocial.com.br", role: "viewer", department: "Comercial", active: false, last_login_at: "2026-01-15T10:00:00", created_at: "2025-03-05", updated_at: "2026-01-15" },
    { user_id: 5, name: "Pedro Lima", email: "pedro.lima@vipsocial.com.br", role: "viewer", department: "Produção", active: true, last_login_at: "2026-01-20T16:45:00", created_at: "2025-06-01", updated_at: "2026-01-20" },
];

const UsersList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Filter users
    const filteredUsers = users.filter((user) => {
        if (searchQuery &&
            !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filterRole !== "all" && user.role !== filterRole) return false;
        if (filterStatus === "active" && !user.active) return false;
        if (filterStatus === "inactive" && user.active) return false;
        return true;
    });

    const handleToggleActive = (userId: number) => {
        setUsers((prev) =>
            prev.map((u) => (u.user_id === userId ? { ...u, active: !u.active } : u))
        );
        // TODO: Call API
    };

    const handleDelete = (userId: number) => {
        if (confirm("Deseja realmente excluir este usuário?")) {
            setUsers((prev) => prev.filter((u) => u.user_id !== userId));
            // TODO: Call API
        }
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Usuários</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie os usuários do sistema
                        </p>
                    </div>

                    <Link to="/usuarios/novo">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Usuário
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os papéis</option>
                    <option value="admin">Administrador</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Visualizador</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
            </motion.div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="text-left p-4 font-medium text-muted-foreground">Usuário</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Papel</th>
                                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Departamento</th>
                                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Último acesso</th>
                                <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user, index) => {
                                const roleConfig = ROLE_CONFIG[user.role];
                                return (
                                    <motion.tr
                                        key={user.user_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "border-b border-border/30 hover:bg-muted/30 transition-colors",
                                            !user.active && "opacity-60"
                                        )}
                                    >
                                        {/* User */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center flex-shrink-0`}
                                                >
                                                    <span className="text-sm font-bold text-white">
                                                        {getUserInitials(user.name)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="p-4">
                                            <Badge className={`${roleConfig.bgColor} ${roleConfig.color}`}>
                                                <Shield className="w-3 h-3 mr-1" />
                                                {roleConfig.label}
                                            </Badge>
                                        </td>

                                        {/* Department */}
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="text-sm text-muted-foreground">
                                                {user.department || "-"}
                                            </span>
                                        </td>

                                        {/* Last Login */}
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatLastActivity(user.last_login_at)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4 text-center">
                                            <Switch
                                                checked={user.active}
                                                onCheckedChange={() => handleToggleActive(user.user_id)}
                                            />
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-lg">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/usuarios/${user.user_id}/editar`)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(user.user_id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                );
                            })}

                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </AppShell>
    );
};

export default UsersList;
