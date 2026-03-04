import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    User as UserIcon,
    Mail,
    Phone,
    Building,
    Calendar,
    Clock,
    Edit,
    Settings,
    Shield,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    Cake,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ROLE_CONFIG,
    getUserInitials,
    getAvatarColor,
    formatLastActivity,
} from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { RoleIcon } from "@/components/shared/RoleIcon";
import { authService } from "@/services/auth.service";
import { toast } from "@/lib/toast";

// ==========================================
// HELPER
// ==========================================
function formatDate(dateString?: string | null): string {
    if (!dateString) return "Não informado";
    return new Date(dateString + (dateString.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

// ==========================================
// INFO CARD COMPONENT
// ==========================================
function InfoCard({
    icon: Icon,
    label,
    value,
    iconBg = "bg-primary/10",
    iconColor = "text-primary",
}: {
    icon: any;
    label: string;
    value: string;
    iconBg?: string;
    iconColor?: string;
}) {
    return (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="font-medium text-sm truncate">{value}</p>
            </div>
        </div>
    );
}

// ==========================================
// PASSWORD CHANGE DIALOG
// ==========================================
function PasswordChangeDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isValid =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword;

    const handleSubmit = async () => {
        setError("");
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }
        if (newPassword.length < 8) {
            setError("A nova senha deve ter pelo menos 8 caracteres");
            return;
        }

        setIsLoading(true);
        try {
            await authService.updatePassword(currentPassword, newPassword, confirmPassword);
            toast.success("Senha alterada com sucesso!");
            handleClose();
        } catch (err: any) {
            const message = err.response?.data?.message || "Erro ao alterar senha. Verifique a senha atual.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setError("");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[440px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Alterar Senha
                    </DialogTitle>
                    <DialogDescription>
                        Para sua segurança, informe a senha atual antes de definir uma nova
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Senha Atual *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Digite sua senha atual"
                                className="pl-10 pr-10 h-10 rounded-xl"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-border/50" />

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Nova Senha *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="pl-10 pr-10 h-10 rounded-xl"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {newPassword.length > 0 && newPassword.length < 8 && (
                            <p className="text-[11px] text-destructive">Mínimo 8 caracteres</p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Confirmar Nova Senha *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                className="pl-10 pr-10 h-10 rounded-xl"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                            <p className="text-[11px] text-destructive">As senhas não coincidem</p>
                        )}
                        {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8 && (
                            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        className="rounded-xl"
                        onClick={handleSubmit}
                        disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Lock className="w-4 h-4 mr-2" />
                        )}
                        Alterar Senha
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
const Profile = () => {
    const { user } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    if (!user) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.viewer;

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    Meu Perfil
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Visualize e gerencie suas informações
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1"
                >
                    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
                        {/* Gradient Header */}
                        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

                        <div className="px-6 pb-6 -mt-10 text-center">
                            {/* Avatar */}
                            <div
                                className={`w-20 h-20 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center mx-auto ring-4 ring-card shadow-lg`}
                            >
                                <span className="text-2xl font-bold text-white">
                                    {getUserInitials(user.name)}
                                </span>
                            </div>

                            {/* Name & Role */}
                            <h2 className="text-xl font-bold mt-3">{user.name}</h2>
                            <Badge className={`${roleConfig.bgColor} ${roleConfig.color} mt-2 border-0`}>
                                <RoleIcon name={roleConfig.icon} className="w-3 h-3 mr-1" />
                                {roleConfig.label}
                            </Badge>

                            {/* Email */}
                            <p className="text-sm text-muted-foreground mt-2">{user.email}</p>

                            {/* Status */}
                            <div className="mt-3">
                                <Badge className={user.active ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-muted text-muted-foreground border-0"}>
                                    {user.active ? "● Ativo" : "○ Inativo"}
                                </Badge>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-2">
                                <Link to="/perfil/editar" className="block">
                                    <Button variant="outline" className="w-full rounded-xl">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar Perfil
                                    </Button>
                                </Link>
                                <Link to="/perfil/preferencias" className="block">
                                    <Button variant="outline" className="w-full rounded-xl">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Preferências
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Personal Info */}
                    <div className="bg-card rounded-3xl border border-border/50 p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            Informações Pessoais
                        </h3>

                        <div className="grid md:grid-cols-2 gap-3">
                            <InfoCard icon={UserIcon} label="Nome" value={user.name} />
                            <InfoCard icon={Mail} label="Email" value={user.email} />
                            <InfoCard icon={Phone} label="Telefone" value={user.phone || "Não informado"} />
                            <InfoCard icon={Building} label="Departamento" value={user.department || "Não informado"} />
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="bg-card rounded-3xl border border-border/50 p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Atividade
                        </h3>

                        <div className="grid md:grid-cols-2 gap-3">
                            <InfoCard
                                icon={Clock}
                                label="Último acesso"
                                value={formatLastActivity(user.last_login_at)}
                                iconBg="bg-emerald-500/10"
                                iconColor="text-emerald-500"
                            />
                            <InfoCard
                                icon={Calendar}
                                label="Membro desde"
                                value={formatDate(user.created_at)}
                                iconBg="bg-blue-500/10"
                                iconColor="text-blue-500"
                            />
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-card rounded-3xl border border-border/50 p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Segurança
                        </h3>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Senha de Acesso</p>
                                    <p className="text-xs text-muted-foreground">Altere sua senha periodicamente para maior segurança</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setIsPasswordDialogOpen(true)}
                            >
                                <Lock className="w-3.5 h-3.5 mr-1.5" />
                                Alterar Senha
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl mt-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Perfil de Acesso</p>
                                    <p className="text-xs text-muted-foreground">{roleConfig.label} — Gerenciado pelo administrador</p>
                                </div>
                            </div>
                            <Badge className={`${roleConfig.bgColor} ${roleConfig.color} border-0`}>
                                <RoleIcon name={roleConfig.icon} className="w-3 h-3 mr-1" />
                                {roleConfig.label}
                            </Badge>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Password Change Dialog */}
            <PasswordChangeDialog
                open={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
            />
        </AppShell>
    );
};

export default Profile;
