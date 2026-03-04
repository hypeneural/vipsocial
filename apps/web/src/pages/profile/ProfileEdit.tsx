import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Camera,
    User as UserIcon,
    Mail,
    Phone,
    Building,
    Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserInitials, getAvatarColor } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { toast } from "@/lib/toast";

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // Form state — initialized from authenticated user
    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [department, setDepartment] = useState(user?.department ?? "");

    if (!user) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            toast.error("Nome e email são obrigatórios");
            return;
        }

        setIsSaving(true);
        try {
            const response = await authService.updateProfile({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                department: department.trim() || undefined,
            });

            if (response.success) {
                // Update local auth context immediately
                updateUser({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    department: department.trim() || null,
                });
                toast.success("Perfil atualizado com sucesso!");
                navigate("/perfil");
            }
        } catch (err: any) {
            const message =
                err.response?.data?.message || "Erro ao atualizar perfil";
            toast.error(message);
        } finally {
            setIsSaving(false);
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
                <Link
                    to="/perfil"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Perfil
                </Link>

                <h1 className="text-xl md:text-2xl font-bold">Editar Perfil</h1>
                <p className="text-sm text-muted-foreground">
                    Atualize suas informações pessoais
                </p>
            </motion.div>

            <div className="max-w-2xl">
                {/* Avatar Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-3xl border border-border/50 p-6 mb-6"
                >
                    <h3 className="font-semibold text-lg mb-4">Foto de Perfil</h3>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div
                                className={`w-20 h-20 rounded-full ${getAvatarColor(name)} flex items-center justify-center`}
                            >
                                <span className="text-2xl font-bold text-white">
                                    {getUserInitials(name)}
                                </span>
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-dark transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                JPG, PNG ou GIF. Máximo 2MB.
                            </p>
                            <Button variant="outline" size="sm" className="mt-2 rounded-lg">
                                Enviar foto
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
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
                                    placeholder="Seu nome"
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
                                    placeholder="seu@email.com"
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

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-3 mt-6 pb-20 md:pb-0"
                >
                    <Button
                        variant="outline"
                        onClick={() => navigate("/perfil")}
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
                                Salvar
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default ProfileEdit;
