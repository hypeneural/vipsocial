import { ChangeEvent, useEffect, useRef, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";
import { getUserInitials, getAvatarColor } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useUploadAvatar } from "@/hooks/useUsers";
import { toast } from "@/lib/toast";

function revokeObjectUrl(url: string | null) {
    if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
}

const ProfileEdit = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { user, updateUser } = useAuth();
    const uploadAvatar = useUploadAvatar();

    const [isSaving, setIsSaving] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
    const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [department, setDepartment] = useState(user?.department ?? "");

    useEffect(() => {
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setPhone(user?.phone ?? "");
        setDepartment(user?.department ?? "");
        setLocalAvatarPreview(user?.avatar_md_url ?? user?.avatar_url ?? null);
    }, [user]);

    useEffect(() => {
        return () => {
            revokeObjectUrl(rawImageUrl);
            revokeObjectUrl(localAvatarPreview);
        };
    }, [localAvatarPreview, rawImageUrl]);

    if (!user) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    const avatarSrc = localAvatarPreview ?? user.avatar_md_url ?? user.avatar_url ?? undefined;

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            toast.error("Nome e email sao obrigatorios");
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
            const message = err.response?.data?.message || "Erro ao atualizar perfil";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Selecione uma imagem JPG, PNG ou WebP.");
            event.currentTarget.value = "";
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        revokeObjectUrl(rawImageUrl);
        setRawImageUrl(objectUrl);
        setCropDialogOpen(true);
        event.currentTarget.value = "";
    };

    const handleAvatarConfirm = async (file: File, previewUrl: string) => {
        const previousPreview = localAvatarPreview;
        setLocalAvatarPreview(previewUrl);

        try {
            const response = await uploadAvatar.mutateAsync(file);
            const avatarUrl = response.data?.avatar_md_url ?? response.data?.avatar_url ?? previewUrl;

            updateUser({
                avatar_url: response.data?.avatar_url ?? avatarUrl,
                avatar_thumb_url: response.data?.avatar_thumb_url ?? response.data?.avatar_url ?? avatarUrl,
                avatar_md_url: avatarUrl,
            });

            setLocalAvatarPreview(avatarUrl);
            revokeObjectUrl(previewUrl);
        } catch (err: any) {
            setLocalAvatarPreview(previousPreview ?? user.avatar_md_url ?? user.avatar_url ?? null);
            revokeObjectUrl(previewUrl);
            const message = err.response?.data?.message || "Erro ao enviar a foto de perfil";
            toast.error(message);
            throw err;
        } finally {
            revokeObjectUrl(rawImageUrl);
            setRawImageUrl(null);
        }
    };

    const handleCropClose = () => {
        setCropDialogOpen(false);
        revokeObjectUrl(rawImageUrl);
        setRawImageUrl(null);
    };

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/perfil"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o Perfil
                </Link>

                <h1 className="text-xl font-bold md:text-2xl">Editar Perfil</h1>
                <p className="text-sm text-muted-foreground">
                    Atualize suas informacoes pessoais e sua foto de perfil.
                </p>
            </motion.div>

            <div className="max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 rounded-3xl border border-border/50 bg-card p-6"
                >
                    <h3 className="mb-4 text-lg font-semibold">Foto de Perfil</h3>

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={handlePickFile}
                                className="rounded-full transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                                aria-label="Alterar foto de perfil"
                            >
                                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                                    <AvatarImage src={avatarSrc} alt={name || user.name} className="object-cover" />
                                    <AvatarFallback className={`${getAvatarColor(name || user.name)} text-2xl font-bold text-white`}>
                                        {getUserInitials(name || user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                            <button
                                type="button"
                                onClick={handlePickFile}
                                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary/90"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Selecione uma imagem, ajuste o corte em 1:1 e salve a versao final em 512x512.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handlePickFile}
                                disabled={uploadAvatar.isPending}
                            >
                                {uploadAvatar.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando foto...
                                    </>
                                ) : (
                                    "Alterar foto"
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Formatos aceitos: JPG, PNG e WebP. Tamanho maximo de 5 MB.
                            </p>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-3xl border border-border/50 bg-card p-6"
                >
                    <h3 className="mb-4 text-lg font-semibold">Informacoes Pessoais</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+55 47 99999-9999"
                                    className="rounded-xl pl-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Ex: Redacao, Jornalismo, TI"
                                    className="rounded-xl pl-11"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 flex gap-3 pb-20 md:pb-0"
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
                        className="min-w-[120px] rounded-xl"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>

            <AvatarCropDialog
                open={cropDialogOpen}
                imageSrc={rawImageUrl}
                onClose={handleCropClose}
                onConfirm={handleAvatarConfirm}
            />
        </AppShell>
    );
};

export default ProfileEdit;
