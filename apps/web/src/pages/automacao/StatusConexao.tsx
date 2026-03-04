import { useState } from "react";
import { motion } from "framer-motion";
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Wifi,
    WifiOff,
    Battery,
    Signal,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { cn } from "@/lib/utils";

interface DeviceStatus {
    connected: boolean;
    phone: string;
    deviceName: string;
    lastSeen: string;
    battery: number;
    signal: "good" | "medium" | "poor";
    messagessSent: number;
    messagesFailed: number;
}

const mockDeviceStatus: DeviceStatus = {
    connected: true,
    phone: "+55 11 99999-1234",
    deviceName: "iPhone 15 Pro",
    lastSeen: "Agora",
    battery: 78,
    signal: "good",
    messagessSent: 1248,
    messagesFailed: 3,
};

const StatusConexao = () => {
    const [device, setDevice] = useState<DeviceStatus>(mockDeviceStatus);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const handleDisconnect = () => {
        setDevice((prev) => ({ ...prev, connected: false }));
        setShowQR(true);
    };

    const handleReconnect = () => {
        setShowQR(true);
        // Simular reconexão após 3 segundos
        setTimeout(() => {
            setDevice((prev) => ({ ...prev, connected: true }));
            setShowQR(false);
        }, 3000);
    };

    const signalConfig = {
        good: { label: "Excelente", color: "text-success" },
        medium: { label: "Moderado", color: "text-warning" },
        poor: { label: "Fraco", color: "text-destructive" },
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
                        <h1 className="text-xl md:text-2xl font-bold">Status de Conexão</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie a conexão do WhatsApp Business
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                        Atualizar Status
                    </Button>
                </div>
            </motion.div>

            {/* Connection Status Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "distribution-toggle mb-6",
                    device.connected ? "active" : "inactive"
                )}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center",
                                device.connected
                                    ? "bg-success/20 text-success"
                                    : "bg-destructive/20 text-destructive"
                            )}
                        >
                            {device.connected ? (
                                <Wifi className="w-8 h-8" />
                            ) : (
                                <WifiOff className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <StatusIndicator
                                    status={device.connected ? "online" : "offline"}
                                    size="lg"
                                    showLabel
                                    label={device.connected ? "Conectado" : "Desconectado"}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {device.connected
                                    ? `Dispositivo ativo: ${device.deviceName}`
                                    : "Nenhum dispositivo conectado"}
                            </p>
                        </div>
                    </div>

                    {device.connected ? (
                        <Button variant="outline" className="rounded-xl" onClick={handleDisconnect}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Desconectar
                        </Button>
                    ) : (
                        <Button className="rounded-xl bg-success hover:bg-success/90" onClick={handleReconnect}>
                            <QrCode className="w-4 h-4 mr-2" />
                            Reconectar
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* QR Code Section */}
            {showQR && !device.connected && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                        <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>
                        <div className="qr-container inline-block mx-auto mb-4">
                            {/* Placeholder QR code */}
                            <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                <div className="grid grid-cols-5 gap-1">
                                    {[...Array(25)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-6 h-6 rounded-sm",
                                                Math.random() > 0.5 ? "bg-gray-800" : "bg-transparent"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Abra o WhatsApp no seu celular, vá em Configurações &gt; Dispositivos vinculados e
                            escaneie o código acima.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4 text-warning">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Aguardando leitura...</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Device Details */}
            {device.connected && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Device Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card rounded-2xl border border-border/50 p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Dispositivo
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Número</span>
                                <span className="font-medium">{device.phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Modelo</span>
                                <span className="font-medium">{device.deviceName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Última atividade</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {device.lastSeen}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Bateria</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Battery className="w-4 h-4" />
                                    {device.battery}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Sinal</span>
                                <span className={cn("font-medium flex items-center gap-1", signalConfig[device.signal].color)}>
                                    <Signal className="w-4 h-4" />
                                    {signalConfig[device.signal].label}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card rounded-2xl border border-border/50 p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Estatísticas de Envio</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-success/10 rounded-xl p-4 text-center">
                                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                                <p className="text-2xl font-bold text-success">{device.messagessSent}</p>
                                <p className="text-xs text-muted-foreground">Enviadas com sucesso</p>
                            </div>
                            <div className="bg-destructive/10 rounded-xl p-4 text-center">
                                <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                                <p className="text-2xl font-bold text-destructive">{device.messagesFailed}</p>
                                <p className="text-xs text-muted-foreground">Falhas de envio</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                            <p className="text-sm text-center">
                                Taxa de sucesso:{" "}
                                <span className="font-bold text-success">
                                    {((device.messagessSent / (device.messagessSent + device.messagesFailed)) * 100).toFixed(1)}%
                                </span>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-info/10 rounded-2xl border border-info/30 p-4"
            >
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-info mb-1">Dicas de Conexão</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Mantenha o celular conectado à internet (Wi-Fi ou dados móveis)</li>
                            <li>• Não feche o WhatsApp Web em outros dispositivos</li>
                            <li>• Verifique se a bateria do celular está acima de 20%</li>
                            <li>• Em caso de desconexão frequente, reinicie o aplicativo</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </AppShell>
    );
};

export default StatusConexao;
