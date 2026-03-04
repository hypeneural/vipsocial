import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Mail,
    Phone,
    Building,
    Shield,
    Key,
    Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, UserRole, ROLE_CONFIG, getUserInitials, getAvatarColor } from "@/types/user";
import { cn } from "@/lib/utils";

const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState(isEditing ? "João Silva" : "");
    const [email, setEmail] = useState(isEditing ? "joao.silva@vipsocial.com.br" : "");
    const [phone, setPhone] = useState(isEditing ? "+55 47 99999-1234" : "");
    const [department, setDepartment] = useState(isEditing ? "Redação" : "");
    const [role, setRole] = useState<UserRole>(isEditing ? "admin" : "viewer");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [active, setActive] = useState(true);
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            alert("Informe o nome do usuário");
            return;
        }
        if (!email.trim()) {
            alert("Informe o email do usuário");
            return;
        }
        if (!isEditing && !password) {
            alert("Informe a senha do usuário");
            return;
        }
        if (password && password !== confirmPassword) {
            alert("As senhas não conferem");
            return;
        }

        setIsSaving(true);

        // TODO: Call API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/usuarios");
    };

    const roleOptions: { value: UserRole; label: string; description: string }[] = [
        { value: "admin", label: "Administrador", description: "Acesso total ao sistema" },
        { value: "editor", label: "Editor", description: "Pode criar e editar conteúdo" },
        { value: "viewer", label: "Visualizador", description: "Apenas visualização" },
    ];

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/usuarios"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Usuários
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Usuário" : "Novo Usuário"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? "Atualize as informações do usuário" : "Cadastre um novo usuário no sistema"}
                        </p>
                    </div>

                    {isEditing && (
                        <div className="flex items-center gap-3">
                            <Label htmlFor="active" className="text-sm">Ativo</Label>
                            <Switch
                                id="active"
                                checked={active}
                                onCheckedChange={setActive}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="max-w-2xl space-y-6">
                {/* Personal Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-3xl border border-border/50 p-6"
                >
                    <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>

                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome do usuário"
                                    className="pl-11 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@vipsocial.com.br"
                                    className="pl-11 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+55 47 99999-9999"
                                    className="pl-11 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Ex: Redação, Jornalismo, TI"
                                    className="pl-11 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Role */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-3xl border border-border/50 p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Papel no Sistema</h3>
                    </div>

                    <div className="space-y-3">
                        {roleOptions.map((option) => {
                            const config = ROLE_CONFIG[option.value];
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setRole(option.value)}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                        role === option.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        config.bgColor
                                    )}>
                                        <Shield className={cn("w-5 h-5", config.color)} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{option.label}</p>
                                        <p className="text-xs text-muted-foreground">{option.description}</p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                        role === option.value
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground"
                                    )}>
                                        {role === option.value && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Password */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-3xl border border-border/50 p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">
                            {isEditing ? "Alterar Senha" : "Senha de Acesso"}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {isEditing ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="rounded-xl"
                            />
                        </div>

                        {password && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="rounded-xl"
                                />
                            </div>
                        )}

                        {!isEditing && (
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                <div>
                                    <p className="font-medium text-sm">Enviar email de boas-vindas</p>
                                    <p className="text-xs text-muted-foreground">
                                        O usuário receberá um email com instruções de acesso
                                    </p>
                                </div>
                                <Switch
                                    checked={sendWelcomeEmail}
                                    onCheckedChange={setSendWelcomeEmail}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 pb-20 md:pb-0"
                >
                    <Button
                        variant="outline"
                        onClick={() => navigate("/usuarios")}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <div className="flex-1" />
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Salvar" : "Criar Usuário"}
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default UserForm;
