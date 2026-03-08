import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock3,
    Image,
    Loader2,
    Logs,
    Search,
    ServerCrash,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useVipCoverageLogs } from "@/hooks/useExternas";

const routingStatusLabels: Record<string, string> = {
    received: "Recebido",
    processing: "Processando",
    queued_ingest: "Na fila de ingestão",
    queued_delete: "Na fila de exclusão",
    published: "Publicado",
    failed: "Falhou",
    ignored_no_event: "Ignorado sem evento",
    ignored_duplicate: "Ignorado duplicado",
    ignored_text_command: "Texto ignorado",
    ignored_delete_not_allowed: "Delete não permitido",
    invalid_payload: "Payload inválido",
    invalid_delete_command: "Delete inválido",
    ignored_unsupported: "Não suportado",
};

const routingStatusTone: Record<string, string> = {
    received: "bg-amber-500 text-white",
    processing: "bg-sky-500 text-white",
    queued_ingest: "bg-sky-600 text-white",
    queued_delete: "bg-indigo-600 text-white",
    published: "bg-emerald-600 text-white",
    failed: "bg-destructive text-white",
    ignored_no_event: "bg-zinc-600 text-white",
    ignored_duplicate: "bg-zinc-600 text-white",
    ignored_text_command: "bg-zinc-600 text-white",
    ignored_delete_not_allowed: "bg-zinc-600 text-white",
    invalid_payload: "bg-destructive text-white",
    invalid_delete_command: "bg-destructive text-white",
    ignored_unsupported: "bg-zinc-600 text-white",
};

function formatDateTime(value?: string | null): string {
    if (!value) {
        return "Sem data";
    }

    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const VipCoverageLogs = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [routingStatus, setRoutingStatus] = useState("all");

    const { data, isLoading, error } = useVipCoverageLogs({
        search: searchQuery || undefined,
        routing_status: routingStatus === "all" ? undefined : routingStatus,
        limit: 100,
    });

    const payload = data?.data;
    const summary = payload?.summary;
    const queues = payload?.queues || [];
    const logs = payload?.logs || [];

    return (
        <AppShell>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/externas/cobertura-vip")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Logs className="h-4 w-4" />
                                </div>
                                Log da Cobertura VIP
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Fila, estágio da pipeline, erros e webhooks recentes da galeria VIP.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {payload?.root_cause && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-700">Causa provável detectada</p>
                            <p className="mt-1 text-sm text-amber-700/90">{payload.root_cause}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {summary && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
                >
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Clock3 className="h-4 w-4" />
                            <p className="text-sm">Recebidos</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{summary.received_logs}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Camera className="h-4 w-4" />
                            <p className="text-sm">Fotos Processadas</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{summary.photos_processed}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4" />
                            <p className="text-sm">Jobs Pendentes</p>
                        </div>
                        <p className="text-2xl font-bold text-sky-600">{summary.pending_jobs}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <ServerCrash className="h-4 w-4" />
                            <p className="text-sm">Falhas</p>
                        </div>
                        <p className="text-2xl font-bold text-destructive">{summary.failed_logs + summary.failed_jobs}</p>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6 flex flex-col gap-3 lg:flex-row"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Buscar por messageId, grupo ou erro"
                        className="h-11 rounded-xl pl-10"
                    />
                </div>
                <Select value={routingStatus} onValueChange={setRoutingStatus}>
                    <SelectTrigger className="h-11 w-full rounded-xl lg:w-[260px]">
                        <SelectValue placeholder="Status da pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(routingStatusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {queues.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 }}
                    className="mb-6 rounded-2xl border bg-card p-4"
                >
                    <div className="flex flex-wrap gap-2">
                        {queues.map((queue) => (
                            <Badge key={queue.queue} variant="outline" className="rounded-full px-3 py-1 text-sm">
                                {queue.queue}: {queue.pending}
                            </Badge>
                        ))}
                    </div>
                </motion.div>
            )}

            {error ? (
                <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <ServerCrash className="h-7 w-7 text-destructive" />
                    </div>
                    <p className="font-medium text-destructive">Erro ao carregar os logs da Cobertura VIP</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : logs.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-card/70 px-6 py-16 text-center">
                    <Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
                    <h2 className="text-lg font-semibold">Nenhum log encontrado</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Quando os webhooks chegarem, a linha do tempo operacional aparece aqui.
                    </p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-3"
                >
                    {logs.map((log) => (
                        <div key={log.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <Badge className={routingStatusTone[log.routing_status] || "bg-zinc-700 text-white"}>
                                            {routingStatusLabels[log.routing_status] || log.routing_status}
                                        </Badge>
                                        <Badge variant="outline">
                                            {log.detected_type === "image" ? "Imagem" : log.detected_type}
                                        </Badge>
                                        {log.photo_processing_status && (
                                            <Badge variant="outline">Foto: {log.photo_processing_status}</Badge>
                                        )}
                                    </div>
                                    <p className="font-medium">{log.event_title || log.group_label || log.phone || "Webhook sem vínculo"}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDateTime(log.created_at)} • messageId: {log.message_id || "não informado"}
                                    </p>
                                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                        <p>Grupo: {log.group_label || log.phone || "não identificado"}</p>
                                        {log.sender_name && <p>Remetente: {log.sender_name}</p>}
                                        {log.participant_phone && <p>Participante: {log.participant_phone}</p>}
                                        {log.error_message && <p className="text-destructive">Erro: {log.error_message}</p>}
                                    </div>
                                </div>
                                {log.event_id && (
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => navigate(`/externas/${log.event_id}`)}
                                    >
                                        Ver evento
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </AppShell>
    );
};

export default VipCoverageLogs;
