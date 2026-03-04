import { useState } from "react";
import { motion } from "framer-motion";
import {
    Settings,
    Save,
    RotateCcw,
    Globe,
    Bell,
    Shield,
    Database,
    Clock,
    Mail,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";

// ==========================================
// TYPES
// ==========================================

interface SystemParams {
    siteName: string;
    siteUrl: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    debugMode: boolean;
    maxUploadSize: number;
    sessionTimeout: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
    autoBackup: boolean;
    backupFrequency: string;
}

// ==========================================
// INITIAL STATE
// ==========================================

const defaultParams: SystemParams = {
    siteName: "VipSocial Editorial",
    siteUrl: "https://vipsocial.com.br",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    maintenanceMode: false,
    debugMode: false,
    maxUploadSize: 10,
    sessionTimeout: 30,
    emailNotifications: true,
    pushNotifications: true,
    autoBackup: true,
    backupFrequency: "daily",
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const Parametros = () => {
    const [params, setParams] = useState<SystemParams>(defaultParams);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = <K extends keyof SystemParams>(key: K, value: SystemParams[K]) => {
        setParams((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        // Simulate API call
        toast.success("Configurações salvas com sucesso!");
        setHasChanges(false);
    };

    const handleReset = () => {
        setParams(defaultParams);
        setHasChanges(false);
        toast.info("Configurações restauradas para o padrão");
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Settings className="w-6 h-6 text-primary" />
                            Parâmetros do Sistema
                        </h1>
                        <p className="text-sm text-muted-foreground">Configure as preferências gerais do sistema</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={handleReset} disabled={!hasChanges}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurar
                        </Button>
                        <Button className="rounded-xl" onClick={handleSave} disabled={!hasChanges}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Settings Tabs */}
            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-muted/50 rounded-xl p-1">
                    <TabsTrigger value="general" className="rounded-lg">
                        <Globe className="w-4 h-4 mr-2" />
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-lg">
                        <Bell className="w-4 h-4 mr-2" />
                        Notificações
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg">
                        <Shield className="w-4 h-4 mr-2" />
                        Segurança
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="rounded-lg">
                        <Database className="w-4 h-4 mr-2" />
                        Backup
                    </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Nome do Site</Label>
                                <Input value={params.siteName} onChange={(e) => handleChange("siteName", e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>URL do Site</Label>
                                <Input value={params.siteUrl} onChange={(e) => handleChange("siteUrl", e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fuso Horário</Label>
                                <Select value={params.timezone} onValueChange={(v) => handleChange("timezone", v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                                        <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Idioma</Label>
                                <Select value={params.language} onValueChange={(v) => handleChange("language", v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                        <SelectItem value="en-US">English (US)</SelectItem>
                                        <SelectItem value="es">Español</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-xl">
                            <div>
                                <Label>Modo Manutenção</Label>
                                <p className="text-xs text-muted-foreground">Desabilita acesso de usuários comuns ao sistema</p>
                            </div>
                            <Switch checked={params.maintenanceMode} onCheckedChange={(v) => handleChange("maintenanceMode", v)} />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                                <Label>Modo Debug</Label>
                                <p className="text-xs text-muted-foreground">Exibe informações de depuração</p>
                            </div>
                            <Switch checked={params.debugMode} onCheckedChange={(v) => handleChange("debugMode", v)} />
                        </div>
                    </motion.div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label>Notificações por Email</Label>
                                    <p className="text-xs text-muted-foreground">Receber alertas importantes por email</p>
                                </div>
                            </div>
                            <Switch checked={params.emailNotifications} onCheckedChange={(v) => handleChange("emailNotifications", v)} />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label>Notificações Push</Label>
                                    <p className="text-xs text-muted-foreground">Receber notificações no navegador</p>
                                </div>
                            </div>
                            <Switch checked={params.pushNotifications} onCheckedChange={(v) => handleChange("pushNotifications", v)} />
                        </div>
                    </motion.div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Timeout da Sessão (minutos)
                                </Label>
                                <Input
                                    type="number"
                                    value={params.sessionTimeout}
                                    onChange={(e) => handleChange("sessionTimeout", Number(e.target.value))}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tamanho Máximo de Upload (MB)</Label>
                                <Input
                                    type="number"
                                    value={params.maxUploadSize}
                                    onChange={(e) => handleChange("maxUploadSize", Number(e.target.value))}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                {/* Backup Tab */}
                <TabsContent value="backup">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label>Backup Automático</Label>
                                    <p className="text-xs text-muted-foreground">Realizar backups automáticos do sistema</p>
                                </div>
                            </div>
                            <Switch checked={params.autoBackup} onCheckedChange={(v) => handleChange("autoBackup", v)} />
                        </div>

                        {params.autoBackup && (
                            <div className="space-y-2">
                                <Label>Frequência do Backup</Label>
                                <Select value={params.backupFrequency} onValueChange={(v) => handleChange("backupFrequency", v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">A cada hora</SelectItem>
                                        <SelectItem value="daily">Diário</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </motion.div>
                </TabsContent>
            </Tabs>
        </AppShell>
    );
};

export default Parametros;
