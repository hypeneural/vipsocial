import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Power,
  QrCode,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
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
import {
  useDisconnectWhatsApp,
  useRefreshWhatsAppConnection,
  useWhatsAppConnection,
} from "@/hooks/useWhatsApp";
import { cn } from "@/lib/utils";
import showToast from "@/lib/toast";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
}

function formatCheckedAt(value?: string | null): string {
  if (!value) {
    return "Agora";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function translateStatusMessage(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized === "You are not connected.") {
    return "WhatsApp desconectado no momento.";
  }

  if (normalized === "You are already connected.") {
    return "WhatsApp ja esta conectado.";
  }

  if (normalized === "You need to restore the session.") {
    return "A sessao precisa ser restaurada antes de reconectar.";
  }

  return normalized;
}

function translateDevice(value?: string | null): string {
  if (!value) {
    return "Nao informado";
  }

  const normalized = value.toLowerCase();

  if (normalized === "iphone") {
    return "iPhone";
  }

  if (normalized === "android") {
    return "Android";
  }

  if (normalized === "smbi") {
    return "Business para iPhone";
  }

  if (normalized === "smba") {
    return "Business para Android";
  }

  return value;
}

const StatusConexao = () => {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useWhatsAppConnection(undefined, true, {
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const refreshMutation = useRefreshWhatsAppConnection();
  const disconnectMutation = useDisconnectWhatsApp();

  const connection = response?.data;
  const translatedStatusMessage = translateStatusMessage(connection?.status_message);
  const checkedAtLabel = formatCheckedAt(connection?.checked_at);

  const profileInitial = useMemo(() => {
    const name = connection?.profile.name?.trim();
    if (!name) {
      return "WA";
    }

    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "WA";
  }, [connection?.profile.name]);

  const isBusy = isFetching || refreshMutation.isPending || disconnectMutation.isPending;

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
      showToast.success("Status do WhatsApp atualizado.");
    } catch (refreshError) {
      showToast.error(getErrorMessage(refreshError, "Nao foi possivel atualizar o status agora."));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      await refreshMutation.mutateAsync();
      showToast.success("Instancia desconectada com sucesso.");
      setShowDisconnectDialog(false);
    } catch (disconnectError) {
      showToast.error(getErrorMessage(disconnectError, "Falha ao desconectar a instancia."));
    }
  };

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Status de Conexao</h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento em tempo real da instancia WhatsApp conectada na Z-API.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-info/30 bg-info/10 px-3 py-1 text-info">
              Atualizacao automatica a cada 10s
            </Badge>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleRefresh}
              disabled={isBusy}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isBusy && "animate-spin")} />
              Atualizar agora
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "mb-6 rounded-3xl border p-6 shadow-sm",
          connection?.connected
            ? "border-success/30 bg-gradient-to-br from-success/10 via-card to-card"
            : "border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-card"
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl",
                connection?.connected
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {connection?.connected ? (
                <Wifi className="h-8 w-8" />
              ) : (
                <WifiOff className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <StatusIndicator
                  status={
                    isLoading ? "loading" : connection?.connected ? "online" : "offline"
                  }
                  size="lg"
                  showLabel
                  label={
                    isLoading
                      ? "Verificando..."
                      : connection?.connected
                        ? "WhatsApp conectado"
                        : "WhatsApp desconectado"
                  }
                />

                {connection && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1",
                      connection.smartphone_connected
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-warning/30 bg-warning/10 text-warning"
                    )}
                  >
                    {connection.smartphone_connected ? "Celular online" : "Celular offline"}
                  </Badge>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold md:text-xl">
                  {connection?.connected
                    ? connection.profile.name || "Instancia conectada"
                    : "Aguardando leitura do QR Code"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {connection?.connected
                    ? connection.formatted_phone || connection.phone || "Numero nao informado"
                    : translatedStatusMessage || "Escaneie o QR Code abaixo para reconectar a sessao."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ultima verificacao: {checkedAtLabel}
                </span>
                {connection?.device.session_name && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Sessao: {connection.device.session_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {connection?.connected && (
              <Button
                variant="outline"
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={disconnectMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                Desconectar instancia
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Falha ao consultar a instancia</p>
                <p className="text-sm text-muted-foreground">
                  {getErrorMessage(error, "Nao foi possivel carregar o estado atual da conexao.")}
                </p>
              </div>
            </div>

            <Button className="rounded-xl" onClick={handleRefresh} disabled={isBusy}>
              Tentar novamente
            </Button>
          </div>
        </motion.div>
      )}

      {isLoading && !connection && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <div className="mb-4 h-6 w-44 animate-pulse rounded bg-muted" />
            <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-2xl bg-muted" />
              <div className="h-14 animate-pulse rounded-2xl bg-muted" />
              <div className="h-14 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      )}

      {!isLoading && connection?.connected && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Perfil conectado</h3>
                <p className="text-sm text-muted-foreground">
                  Dados retornados pelo endpoint do device da Z-API.
                </p>
              </div>

              {connection.profile.is_business !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-3 py-1",
                    connection.profile.is_business
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border/60 bg-muted/40 text-muted-foreground"
                  )}
                >
                  {connection.profile.is_business ? "Conta Business" : "Conta pessoal"}
                </Badge>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border/50 bg-muted/30 p-5 text-center">
                {connection.profile.img_url ? (
                  <motion.img
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    src={connection.profile.img_url}
                    alt={connection.profile.name || "Perfil WhatsApp"}
                    className="h-36 w-36 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-success/10 text-3xl font-bold text-success">
                    {profileInitial}
                  </div>
                )}

                <div className="mt-4 space-y-1">
                  <p className="text-lg font-semibold">
                    {connection.profile.name || "Instancia sem nome"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {connection.formatted_phone || connection.phone || "Numero nao informado"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Numero</p>
                  <p className="mt-1 font-semibold">
                    {connection.formatted_phone || connection.phone || "Nao informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">LID</p>
                  <p className="mt-1 break-all font-semibold">
                    {connection.profile.lid || "Nao informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Recado do perfil</p>
                  <p className="mt-1 text-sm text-foreground">
                    {connection.profile.about || "Nenhum recado configurado."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plataforma</p>
                  <p className="mt-1 font-semibold">
                    {translateDevice(connection.device.original_device)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Modelo da sessao</p>
                  <p className="mt-1 font-semibold">
                    {connection.device.device_model || "Nao informado"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Estado da sessao</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/10 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">Conexao ativa</p>
                      <p className="text-sm text-muted-foreground">A instancia esta pronta para operar.</p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-success text-success-foreground">Online</Badge>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Celular vinculado</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.smartphone_connected
                          ? "O aparelho principal esta com internet."
                          : "A sessao esta ativa, mas o celular nao respondeu como online."}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1",
                      connection.smartphone_connected
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-warning/30 bg-warning/10 text-warning"
                    )}
                  >
                    {connection.smartphone_connected ? "Online" : "Atencao"}
                  </Badge>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessao Z-API</p>
                      <p className="mt-1 font-semibold">
                        {connection.device.session_name || "Nao informado"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Session ID</p>
                      <p className="mt-1 font-semibold">
                        {connection.device.session_id ?? "Nao informado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {connection.device_error && (
                <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                  {connection.device_error}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-info/30 bg-info/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-info" />
                <div className="space-y-2">
                  <p className="font-semibold text-info">Boas praticas de operacao</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Mantenha o celular principal conectado a internet.</li>
                    <li>- Evite encerrar a sessao manualmente em outro dispositivo.</li>
                    <li>- Use o botao de atualizar para validar uma reconexao imediatamente.</li>
                    <li>- Se a foto ou dados do perfil sumirem, confirme o status do device.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {!isLoading && connection && !connection.connected && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">QR Code para reconexao</h3>
                <p className="text-sm text-muted-foreground">
                  Gere e leia o codigo pelo WhatsApp no aparelho principal.
                </p>
              </div>

              {connection.qr_available && (
                <Badge variant="outline" className="rounded-full border-warning/30 bg-warning/10 px-3 py-1 text-warning">
                  Expira em cerca de {connection.qr_expires_in_sec ?? 20}s
                </Badge>
              )}
            </div>

            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-6 text-center">
              {connection.qr_available && connection.qr_code ? (
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <motion.img
                    key={connection.qr_code}
                    initial={{ opacity: 0.4, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    src={connection.qr_code}
                    alt="QR Code do WhatsApp"
                    className="w-full max-w-[320px] rounded-3xl border border-border/50 bg-white p-4 shadow-lg"
                  />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Depois de escanear, a tela atualiza automaticamente. Se preferir, force a
                    verificacao pelo botao "Atualizar agora".
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <QrCode className="h-10 w-10" />
                  </div>
                  <p className="text-base font-semibold">QR Code indisponivel</p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {connection.qr_error || "A Z-API nao retornou um QR Code valido neste ciclo."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Checklist de reconexao</h3>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="font-medium">1. Abra o WhatsApp no celular</p>
                  <p className="text-sm text-muted-foreground">
                    Entre em Configuracoes &gt; Dispositivos conectados.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="font-medium">2. Escaneie o QR Code exibido</p>
                  <p className="text-sm text-muted-foreground">
                    O codigo muda periodicamente. Se expirar, atualize a tela.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                  <p className="font-medium">3. Aguarde a validacao</p>
                  <p className="text-sm text-muted-foreground">
                    A pagina consulta a API a cada 10 segundos e troca para o modo conectado
                    automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-warning/30 bg-warning/10 p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 text-warning" />
                <div className="space-y-2">
                  <p className="font-semibold text-warning">Estado atual da sessao</p>
                  <p className="text-sm text-muted-foreground">
                    {translatedStatusMessage ||
                      "A instancia nao esta conectada no momento. Gere um novo QR Code e reconecte."}
                  </p>
                  {connection.qr_error && (
                    <p className="text-sm text-warning">{connection.qr_error}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar a instancia do WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao encerra a sessao atual da Z-API. Para voltar a operar sera necessario ler
              um novo QR Code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDisconnect();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar desconexao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default StatusConexao;
