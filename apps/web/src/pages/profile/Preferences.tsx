import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Moon,
    Sun,
    Monitor,
    Bell,
    Mail,
    MessageCircle,
    Smartphone,
    LayoutDashboard,
    Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserPreferences } from "@/types/user";
import { cn } from "@/lib/utils";

// Mock preferences
const mockPreferences: UserPreferences = {
    user_id: 1,
    theme: "system",
    language: "pt-BR",
    notifications_email: true,
    notifications_push: true,
    notifications_whatsapp: false,
    sidebar_collapsed: false,
    dashboard_widgets: ["news", "alerts", "distribution"],
};

const Preferences = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [theme, setTheme] = useState<UserPreferences["theme"]>(mockPreferences.theme);
    const [language, setLanguage] = useState<UserPreferences["language"]>(mockPreferences.language);
    const [notificationsEmail, setNotificationsEmail] = useState(mockPreferences.notifications_email);
    const [notificationsPush, setNotificationsPush] = useState(mockPreferences.notifications_push);
    const [notificationsWhatsapp, setNotificationsWhatsapp] = useState(mockPreferences.notifications_whatsapp);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(mockPreferences.sidebar_collapsed);

    const handleSave = async () => {
        setIsSaving(true);

        // TODO: Call API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/perfil");
    };

    const themeOptions: { value: UserPreferences["theme"]; label: string; icon: typeof Sun }[] = [
        { value: "light", label: "Claro", icon: Sun },
        { value: "dark", label: "Escuro", icon: Moon },
        { value: "system", label: "Sistema", icon: Monitor },
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
                    to="/perfil"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Perfil
                </Link>

                <h1 className="text-xl md:text-2xl font-bold">Preferências</h1>
                <p className="text-sm text-muted-foreground">
                    Personalize sua experiência no sistema
                </p>
            </motion.div>

            <div className="max-w-2xl space-y-6">
                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-3xl border border-border/50 p-6"
                >
                    <h3 className="font-semibold text-lg mb-4">Aparência</h3>

                    {/* Theme */}
                    <div className="space-y-3">
                        <Label>Tema</Label>
                        <div className="flex gap-3">
                            {themeOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value)}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                            theme === option.value
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-6 h-6",
                                            theme === option.value ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-medium",
                                            theme === option.value ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="mt-6 space-y-3">
                        <Label>Idioma</Label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as UserPreferences["language"])}
                            className="w-full px-4 py-3 border rounded-xl bg-background text-sm"
                        >
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                        </select>
                    </div>

                    {/* Sidebar */}
                    <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Barra lateral recolhida</p>
                                <p className="text-xs text-muted-foreground">Iniciar com menu compacto</p>
                            </div>
                        </div>
                        <Switch
                            checked={sidebarCollapsed}
                            onCheckedChange={setSidebarCollapsed}
                        />
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-3xl border border-border/50 p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Notificações</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Email */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Notificações por Email</p>
                                    <p className="text-xs text-muted-foreground">Receber alertas no email</p>
                                </div>
                            </div>
                            <Switch
                                checked={notificationsEmail}
                                onCheckedChange={setNotificationsEmail}
                            />
                        </div>

                        {/* Push */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Notificações Push</p>
                                    <p className="text-xs text-muted-foreground">Receber notificações no navegador</p>
                                </div>
                            </div>
                            <Switch
                                checked={notificationsPush}
                                onCheckedChange={setNotificationsPush}
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Notificações WhatsApp</p>
                                    <p className="text-xs text-muted-foreground">Receber alertas no WhatsApp</p>
                                </div>
                            </div>
                            <Switch
                                checked={notificationsWhatsapp}
                                onCheckedChange={setNotificationsWhatsapp}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-3 pb-20 md:pb-0"
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

export default Preferences;
