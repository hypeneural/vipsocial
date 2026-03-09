import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    Edit,
    ExternalLink,
    Eye,
    Image,
    Link2,
    Loader2,
    Logs,
    MapPin,
    MessageCircle,
    Monitor,
    PauseCircle,
    Phone,
    Plus,
    RotateCcw,
    Save,
    Search,
    Trash2,
    Users,
    XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    useDeleteVipCoverage,
    useDownloadAllVipGalleryPhotos,
    useExpireVipGallerySlideshow,
    useResetVipGallerySlideshow,
    useUpdateVipGallerySlideshow,
    useUpdateVipGalleryPhotoApproval,
    useUpdateVipGalleryPhotoSlideshowMetadata,
    useUpdateVipCoverageStatus,
    useUploadVipGallerySlideshowBackground,
    useUploadVipGallerySlideshowPartnerLogo,
    useVipCoverageEvents,
    useVipCoveragePhotos,
    useVipCoverageStats,
    useVipGalleryOptions,
    useVipGallerySlideshow,
} from "@/hooks/useExternas";
import type {
    VipCoverageEvent,
    VipCoveragePhotoDetail,
    VipGallerySlideshowData,
    VipGalleryStatus,
    VipSlideshowLayout,
    VipSlideshowStatus,
} from "@/types/externas";
import showToast from "@/lib/toast";
import { cn } from "@/lib/utils";
import { FALLBACK_VIP_GROUPS, vipGroupLabel } from "@/features/externas/vipGallery";

const vipStatusConfig: Record<VipGalleryStatus, { label: string; color: string; tone: string }> = {
    draft: {
        label: "Rascunho",
        color: "bg-slate-500",
        tone: "text-slate-600",
    },
    active: {
        label: "Ativa",
        color: "bg-emerald-500",
        tone: "text-emerald-600",
    },
    paused: {
        label: "Pausada",
        color: "bg-amber-500",
        tone: "text-amber-600",
    },
    archived: {
        label: "Arquivada",
        color: "bg-zinc-500",
        tone: "text-zinc-600",
    },
};

const vipSlideshowStatusLabels: Record<VipSlideshowStatus, string> = {
    draft: "Rascunho",
    active: "Ativo",
    paused: "Pausado",
    archived: "Arquivado",
    expired: "Encerrado",
};

const vipSlideshowLayoutLabels: Record<VipSlideshowLayout, string> = {
    auto: "Automatico",
    polaroid: "Polaroid",
    fullscreen: "Tela cheia",
    split: "Dividido",
    cinematic: "Cinemático",
};

const defaultSlideshowStatusOptions = (Object.keys(vipSlideshowStatusLabels) as VipSlideshowStatus[]).map((value) => ({
    value,
    label: vipSlideshowStatusLabels[value],
}));

const defaultSlideshowLayoutOptions = (Object.keys(vipSlideshowLayoutLabels) as VipSlideshowLayout[]).map((value) => ({
    value,
    label: vipSlideshowLayoutLabels[value],
}));

function VipStatusIcon({ status, className }: { status: VipGalleryStatus; className?: string }) {
    if (status === "active") {
        return <CheckCircle2 className={className} />;
    }

    if (status === "paused") {
        return <PauseCircle className={className} />;
    }

    if (status === "archived") {
        return <Image className={className} />;
    }

    return <Edit className={className} />;
}

function formatEventDate(value: string): string {
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return "Ainda sem registro";
    }

    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function participantDisplayName(senderName?: string | null, participantPhone?: string | null): string {
    return senderName?.trim() || participantPhone?.trim() || "Participante sem identificacao";
}

function photoSentAt(photo: VipCoveragePhotoDetail): string | null {
    return photo.received_at || photo.published_at || photo.created_at || null;
}

type VipSlideshowFormState = {
    is_enabled: boolean;
    status: VipSlideshowStatus;
    layout: VipSlideshowLayout;
    interval_seconds: number;
    queue_limit: number;
    show_neon: boolean;
    neon_text: string;
    instructions_text: string;
    expires_at: string;
};

function formatDateTimeLocalInput(value?: string | null): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    return local.toISOString().slice(0, 16);
}

function intervalMsToSeconds(value?: number | null): number {
    const milliseconds = Number(value ?? 10000);
    const seconds = Math.round(milliseconds / 1000);
    return Math.max(3, Math.min(60, seconds || 10));
}

function clampSlideshowSecondsInput(value?: number | null): number {
    const seconds = Math.round(Number(value ?? 10));
    return Math.max(3, Math.min(60, seconds || 10));
}

function createSlideshowFormState(
    slideshow?: VipGallerySlideshowData | null,
    event?: Pick<VipCoverageEvent, "titulo"> | null
): VipSlideshowFormState {
    return {
        is_enabled: slideshow?.is_enabled ?? false,
        status: slideshow?.status ?? "draft",
        layout: slideshow?.layout ?? "auto",
        interval_seconds: intervalMsToSeconds(slideshow?.interval_ms),
        queue_limit: slideshow?.queue_limit ?? 100,
        show_neon: slideshow?.show_neon ?? true,
        neon_text: slideshow?.neon_text?.trim() || event?.titulo?.trim() || "",
        instructions_text: slideshow?.instructions_text ?? "",
        expires_at: formatDateTimeLocalInput(slideshow?.expires_at),
    };
}

function VipSlideshowDialog({
    event,
    open,
    onOpenChange,
}: {
    event: VipCoverageEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const eventId = event?.id || 0;
    const { data, isLoading, error } = useVipGallerySlideshow(eventId);
    const updateVipGallerySlideshow = useUpdateVipGallerySlideshow();
    const uploadVipGallerySlideshowBackground = useUploadVipGallerySlideshowBackground();
    const uploadVipGallerySlideshowPartnerLogo = useUploadVipGallerySlideshowPartnerLogo();
    const expireVipGallerySlideshow = useExpireVipGallerySlideshow();
    const resetVipGallerySlideshow = useResetVipGallerySlideshow();
    const slideshowResponse = data?.data;
    const slideshow = slideshowResponse?.slideshow ?? null;
    const [form, setForm] = useState<VipSlideshowFormState>(() => createSlideshowFormState(undefined, event));
    const [hydratedEventId, setHydratedEventId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setHydratedEventId(null);
            return;
        }

        if (hydratedEventId === eventId && slideshow) {
            return;
        }

        setForm(createSlideshowFormState(slideshow, event));

        if (slideshow) {
            setHydratedEventId(eventId);
        }
    }, [event, eventId, hydratedEventId, open, slideshow]);

    const statusOptions = slideshowResponse?.meta.statuses?.map((option) => ({
        value: option.value,
        label: vipSlideshowStatusLabels[option.value] ?? option.label,
    })) || defaultSlideshowStatusOptions;

    const layoutOptions = slideshowResponse?.meta.layouts?.map((option) => ({
        value: option.value,
        label: vipSlideshowLayoutLabels[option.value] ?? option.label,
    })) || defaultSlideshowLayoutOptions;

    const isMutating =
        updateVipGallerySlideshow.isPending
        || uploadVipGallerySlideshowBackground.isPending
        || uploadVipGallerySlideshowPartnerLogo.isPending
        || expireVipGallerySlideshow.isPending
        || resetVipGallerySlideshow.isPending;

    const handleSave = () => {
        if (!event) {
            return;
        }

        updateVipGallerySlideshow.mutate(
            {
                eventId: event.id,
                dto: {
                    is_enabled: form.is_enabled,
                    status: form.status,
                    layout: form.layout,
                    interval_ms: clampSlideshowSecondsInput(form.interval_seconds) * 1000,
                    queue_limit: Math.max(1, Math.min(500, form.queue_limit)),
                    show_neon: form.show_neon,
                    neon_text: form.neon_text.trim() || null,
                    instructions_text: form.instructions_text.trim() || null,
                    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                },
            },
            {
                onSuccess: (response) => {
                    setForm(createSlideshowFormState(response.data.slideshow, event));
                },
            }
        );
    };

    const handleCopyLink = async () => {
        if (!slideshow?.public_url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(slideshow.public_url);
            showToast.success("Link do telão copiado!");
        } catch {
            showToast.error("Não foi possível copiar o link do telão");
        }
    };

    const handleBackgroundUpload = (file?: File | null) => {
        if (!event || !file) {
            return;
        }

        uploadVipGallerySlideshowBackground.mutate({
            eventId: event.id,
            file,
        });
    };

    const handlePartnerLogoUpload = (file?: File | null) => {
        if (!event || !file) {
            return;
        }

        uploadVipGallerySlideshowPartnerLogo.mutate({
            eventId: event.id,
            file,
        });
    };

    const handleExpire = () => {
        if (!event) {
            return;
        }

        expireVipGallerySlideshow.mutate(
            {
                eventId: event.id,
                reason: "manual",
                expiresAt: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            },
            {
                onSuccess: (response) => {
                    setForm(createSlideshowFormState(response.data.slideshow, event));
                },
            }
        );
    };

    const handleReset = () => {
        if (!event) {
            return;
        }

        resetVipGallerySlideshow.mutate(event.id, {
            onSuccess: (response) => {
                setForm(createSlideshowFormState(response.data.slideshow, event));
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] w-[min(96vw,1120px)] max-w-none flex-col overflow-hidden rounded-[28px] p-0">
                <DialogHeader className="shrink-0 border-b px-6 py-5">
                    <DialogTitle>Telão / Slideshow</DialogTitle>
                    <DialogDescription>
                        {event
                            ? `Configure o player público em tempo real do evento ${event.titulo}.`
                            : "Configure o player público da Cobertura VIP."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isLoading ? (
                        <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-5">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div>
                                <p className="font-medium">Carregando telão</p>
                                <p className="text-sm text-muted-foreground">
                                    Buscando as configurações atuais e a URL pública do player.
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                            Não foi possível carregar as configurações do telão agora. Tente novamente em alguns instantes.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Ativar Telão</p>
                                    <p className="text-sm text-muted-foreground">
                                        Quando ativo, o link público do player pode abrir o slideshow e receber atualizações em tempo real.
                                    </p>
                                </div>
                                <Switch
                                    checked={form.is_enabled}
                                    onCheckedChange={(checked) => setForm((current) => ({
                                        ...current,
                                        is_enabled: checked,
                                        status: checked && current.status === "draft" ? "active" : current.status,
                                    }))}
                                    disabled={isMutating}
                                />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-4 rounded-2xl border p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Status do Telão</Label>
                                            <Select
                                                value={form.status}
                                                onValueChange={(value) => setForm((current) => ({
                                                    ...current,
                                                    status: value as VipSlideshowStatus,
                                                }))}
                                                disabled={isMutating}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Layout</Label>
                                            <Select
                                                value={form.layout}
                                                onValueChange={(value) => setForm((current) => ({
                                                    ...current,
                                                    layout: value as VipSlideshowLayout,
                                                }))}
                                                disabled={isMutating}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {layoutOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slideshow-interval">Velocidade (segundos)</Label>
                                            <Input
                                                id="slideshow-interval"
                                                type="number"
                                                min={3}
                                                max={60}
                                                step={1}
                                                value={form.interval_seconds}
                                                onChange={(e) => setForm((current) => ({
                                                    ...current,
                                                    interval_seconds: clampSlideshowSecondsInput(Number(e.target.value || 0)),
                                                }))}
                                                disabled={isMutating}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slideshow-limit">Limite da fila</Label>
                                            <Input
                                                id="slideshow-limit"
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={form.queue_limit}
                                                onChange={(e) => setForm((current) => ({
                                                    ...current,
                                                    queue_limit: Number(e.target.value || 0),
                                                }))}
                                                disabled={isMutating}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slideshow-expires-at">Expira em</Label>
                                            <Input
                                                id="slideshow-expires-at"
                                                type="datetime-local"
                                                value={form.expires_at}
                                                onChange={(e) => setForm((current) => ({
                                                    ...current,
                                                    expires_at: e.target.value,
                                                }))}
                                                disabled={isMutating}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Mostrar placa neon</Label>
                                            <div className="flex h-10 items-center rounded-xl border px-3">
                                                <Switch
                                                    checked={form.show_neon}
                                                    onCheckedChange={(checked) => setForm((current) => ({
                                                        ...current,
                                                        show_neon: checked,
                                                    }))}
                                                    disabled={isMutating}
                                                />
                                                <span className="ml-3 text-sm text-muted-foreground">
                                                    {form.show_neon ? "Ligada" : "Desligada"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slideshow-neon-text">Texto da placa</Label>
                                        <Input
                                            id="slideshow-neon-text"
                                            value={form.neon_text}
                                            onChange={(e) => setForm((current) => ({
                                                ...current,
                                                neon_text: e.target.value,
                                            }))}
                                            placeholder={event?.titulo || "Titulo do evento"}
                                            disabled={isMutating}
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slideshow-instructions">Texto de instrução</Label>
                                        <Textarea
                                            id="slideshow-instructions"
                                            value={form.instructions_text}
                                            onChange={(e) => setForm((current) => ({
                                                ...current,
                                                instructions_text: e.target.value,
                                            }))}
                                            placeholder="Envio interno ativo. Assim que uma foto for aprovada, ela entra automaticamente no telao."
                                            rows={4}
                                            disabled={isMutating}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-2xl border p-4">
                                    <div className="space-y-2">
                                        <Label>Código do Telão</Label>
                                        <Input value={slideshow?.slideshow_code || "Será gerado ao salvar pela primeira vez"} readOnly className="rounded-xl" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>URL pública</Label>
                                        <Input value={slideshow?.public_url || "Salve ou ative o telão para gerar a URL pública"} readOnly className="rounded-xl" />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={handleCopyLink}
                                            disabled={!slideshow?.public_url}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar link
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => window.open(slideshow?.public_url || "", "_blank", "noopener,noreferrer")}
                                            disabled={!slideshow?.public_url}
                                        >
                                            <Monitor className="mr-2 h-4 w-4" />
                                            Abrir telão
                                        </Button>
                                    </div>

                                    <div className="space-y-3 rounded-2xl bg-muted/20 p-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="slideshow-background">Background</Label>
                                            {slideshow?.background_url ? (
                                                <div className="overflow-hidden rounded-xl border bg-muted">
                                                    <img src={slideshow.background_url} alt="Background do telão" className="h-28 w-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground">
                                                    Nenhum background enviado
                                                </div>
                                            )}
                                            <Input
                                                id="slideshow-background"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => handleBackgroundUpload(e.target.files?.[0])}
                                                disabled={isMutating}
                                                className="rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slideshow-partner-logo">Logo do parceiro</Label>
                                            {slideshow?.partner_logo_url ? (
                                                <div className="flex h-28 items-center justify-center rounded-xl border bg-muted p-4">
                                                    <img src={slideshow.partner_logo_url} alt="Logo do parceiro" className="max-h-full max-w-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground">
                                                    Nenhuma logo do parceiro enviada
                                                </div>
                                            )}
                                            <Input
                                                id="slideshow-partner-logo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => handlePartnerLogoUpload(e.target.files?.[0])}
                                                disabled={isMutating}
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="font-medium">Operação rápida</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Use estas ações para encerrar o player ou voltar às configurações padrão do evento.
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl"
                                                onClick={handleReset}
                                                disabled={isMutating}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Resetar
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="rounded-xl"
                                                onClick={handleExpire}
                                                disabled={isMutating}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Encerrar Telão
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 border-t bg-background px-6 py-4 sm:justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || !!error || isMutating || !event}>
                        {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar configurações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function VipCoverageCard({
    event,
    vipGroups,
    isEditingStatus,
    isUpdatingStatus,
    onStartEditStatus,
    onChangeStatus,
    onOpenSlideshow,
    onDownloadAll,
    onOpenPhotos,
    onOpenDelete,
}: {
    event: VipCoverageEvent;
    vipGroups: { value: string; label: string }[];
    isEditingStatus: boolean;
    isUpdatingStatus: boolean;
    onStartEditStatus: (eventId: number | null) => void;
    onChangeStatus: (event: VipCoverageEvent, status: VipGalleryStatus) => void;
    onOpenSlideshow: (event: VipCoverageEvent) => void;
    onDownloadAll: (event: VipCoverageEvent) => void;
    onOpenPhotos: (event: VipCoverageEvent) => void;
    onOpenDelete: (event: VipCoverageEvent) => void;
}) {
    const navigate = useNavigate();
    const galleryStatus = event.vip_gallery_status || "draft";
    const status = vipStatusConfig[galleryStatus];
    const hasPhotos = event.vip_gallery_photos_count > 0;
    const visibleParticipants = event.vip_gallery_participants_summary?.slice(0, 3) || [];
    const hiddenParticipantsCount = Math.max((event.vip_gallery_participants_summary?.length || 0) - visibleParticipants.length, 0);
    const hasParticipants = (event.vip_gallery_total_participants || 0) > 0 && visibleParticipants.length > 0;
    const hasFirstPhoto = !!event.vip_gallery_first_photo_sent_at;
    const hasLastPhoto = !!event.vip_gallery_last_photo_sent_at;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Camera className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold">{event.titulo}</h3>
                            <p className="truncate text-xs text-muted-foreground">
                                {event.gallery_slug || "Slug pendente"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {isEditingStatus ? (
                            <Select
                                open={isEditingStatus}
                                value={galleryStatus}
                                onValueChange={(value) => onChangeStatus(event, value as VipGalleryStatus)}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        onStartEditStatus(null);
                                    }
                                }}
                                disabled={isUpdatingStatus}
                            >
                                <SelectTrigger className="h-9 min-w-[170px] rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(vipStatusConfig).map(([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                            <span className="flex items-center gap-2">
                                                <VipStatusIcon
                                                    status={value as VipGalleryStatus}
                                                    className={cn("h-4 w-4", config.tone)}
                                                />
                                                {config.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <button
                                type="button"
                                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => onStartEditStatus(event.id)}
                            >
                                <Badge className={cn("gap-1 text-white", status.color)}>
                                    <VipStatusIcon status={galleryStatus} className="h-3.5 w-3.5" />
                                    {status.label}
                                </Badge>
                            </button>
                        )}
                        {event.vip_gallery_public_url && (
                            <Badge variant="outline" className="gap-1">
                                <Link2 className="h-3 w-3" />
                                URL pública pronta
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                    <p>{formatEventDate(event.data_hora)}</p>
                    <p className="mt-1">{event.category?.name || "Sem categoria"}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/40 p-3">
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fotos</p>
                    <p className="mt-1 text-lg font-semibold">{event.vip_gallery_photos_count}</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Views</p>
                    <p className="mt-1 text-lg font-semibold text-sky-600">{event.views_count || 0}</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Downloads</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">{event.vip_gallery_downloads_count}</p>
                </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.local}</span>
                </p>
                <p className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{vipGroupLabel(event.whatsapp_group_id, vipGroups)}</span>
                </p>
            </div>

            {(hasFirstPhoto || hasLastPhoto) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {hasFirstPhoto && (
                        <div className="rounded-2xl border bg-muted/20 p-3">
                            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                Primeira foto
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                                {formatDateTime(event.vip_gallery_first_photo_sent_at)}
                            </p>
                        </div>
                    )}
                    {hasLastPhoto && (
                        <div className="rounded-2xl border bg-muted/20 p-3">
                            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                Ultima foto
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                                {formatDateTime(event.vip_gallery_last_photo_sent_at)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {hasParticipants && (
                <div className="mt-4 rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-medium">
                            <Users className="h-4 w-4 text-primary" />
                            Participantes que enviaram fotos
                        </p>
                        <Badge variant="outline">{event.vip_gallery_total_participants || 0}</Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                        {visibleParticipants.map((participant) => (
                            <div key={`${participant.participant_phone || participant.sender_name}-${participant.total_photos}`} className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {participantDisplayName(participant.sender_name, participant.participant_phone)}
                                    </p>
                                    {participant.participant_phone && (
                                        <p className="truncate text-xs text-muted-foreground">{participant.participant_phone}</p>
                                    )}
                                </div>
                                <Badge variant="secondary">{participant.total_photos} foto(s)</Badge>
                            </div>
                        ))}
                        {hiddenParticipantsCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                +{hiddenParticipantsCount} participante(s) adicional(is) visivel(is) nos detalhes.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/externas/${event.id}`)}>
                    Ver evento
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/externas/${event.id}/editar`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => onOpenSlideshow(event)}>
                    <Monitor className="mr-2 h-4 w-4" />
                    Telão
                </Button>
                {event.vip_gallery_public_url && (
                    <Button
                        className="rounded-xl"
                        onClick={() => window.open(event.vip_gallery_public_url || "", "_blank", "noopener,noreferrer")}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir galeria
                    </Button>
                )}
                {hasPhotos && (
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => onDownloadAll(event)}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Todas
                    </Button>
                )}
                {hasPhotos && (
                    <Button variant="outline" className="rounded-xl" onClick={() => onOpenPhotos(event)}>
                        <Image className="mr-2 h-4 w-4" />
                        Ver Detalhes de Fotos
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onOpenDelete(event)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Cobertura VIP
                </Button>
            </div>
        </motion.div>
    );
}

const VipCoverageDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | VipGalleryStatus>("all");
    const [statusEditorEventId, setStatusEditorEventId] = useState<number | null>(null);
    const [downloadEvent, setDownloadEvent] = useState<VipCoverageEvent | null>(null);
    const [photosEvent, setPhotosEvent] = useState<VipCoverageEvent | null>(null);
    const [deleteEvent, setDeleteEvent] = useState<VipCoverageEvent | null>(null);
    const [slideshowEvent, setSlideshowEvent] = useState<VipCoverageEvent | null>(null);
    const [photoMetadataDrafts, setPhotoMetadataDrafts] = useState<Record<number, { short_text: string; highlight_score: number }>>({});
    const [downloadResult, setDownloadResult] = useState<{
        download_url: string;
        file_name: string;
        total_files: number;
        generated_at: string;
    } | null>(null);

    const { data: statsData } = useVipCoverageStats();
    const { data: vipOptionsData } = useVipGalleryOptions();
    const downloadAllVipGalleryPhotos = useDownloadAllVipGalleryPhotos();
    const updateVipCoverageStatus = useUpdateVipCoverageStatus();
    const updateVipGalleryPhotoApproval = useUpdateVipGalleryPhotoApproval();
    const updateVipGalleryPhotoSlideshowMetadata = useUpdateVipGalleryPhotoSlideshowMetadata();
    const deleteVipCoverage = useDeleteVipCoverage();
    const { data: eventsData, isLoading, error } = useVipCoverageEvents({
        per_page: 100,
        search: searchQuery || undefined,
        vip_gallery_status: filterStatus === "all" ? undefined : filterStatus,
    });
    const { data: photosData, isLoading: isPhotosLoading } = useVipCoveragePhotos(photosEvent?.id || 0);

    const stats = statsData?.data;
    const events = eventsData?.data || [];
    const vipGroups = vipOptionsData?.data.groups || FALLBACK_VIP_GROUPS;
    const photoDetails = photosData?.data;
    const latestPhoto = photoDetails?.photos?.[0] || null;
    const earliestPhoto = photoDetails?.photos?.length
        ? photoDetails.photos[photoDetails.photos.length - 1]
        : null;

    useEffect(() => {
        if (!photoDetails) {
            setPhotoMetadataDrafts({});
            return;
        }

        setPhotoMetadataDrafts(
            Object.fromEntries(
                photoDetails.photos.map((photo) => [
                    photo.id,
                    {
                        short_text: photo.short_text || "",
                        highlight_score: photo.highlight_score ?? 0,
                    },
                ])
            )
        );
    }, [photoDetails]);

    const handleOpenDownloadAll = (event: VipCoverageEvent) => {
        setDownloadEvent(event);
        setDownloadResult(null);
        downloadAllVipGalleryPhotos.mutate(event.id, {
            onSuccess: (response) => {
                setDownloadResult(response.data);
                window.open(response.data.download_url, "_blank", "noopener,noreferrer");
            },
        });
    };

    const handleCloseDownloadModal = (open: boolean) => {
        if (open) {
            return;
        }

        setDownloadEvent(null);
        setDownloadResult(null);
    };

    const handleOpenPhotos = (event: VipCoverageEvent) => {
        setPhotosEvent(event);
    };

    const handleClosePhotosModal = (open: boolean) => {
        if (open) {
            return;
        }

        setPhotosEvent(null);
    };

    const handleDeactivatePhoto = (photo: VipCoveragePhotoDetail) => {
        updateVipGalleryPhotoApproval.mutate({
            photoId: photo.id,
            isApproved: false,
        });
    };

    const handleActivatePhoto = (photo: VipCoveragePhotoDetail) => {
        updateVipGalleryPhotoApproval.mutate({
            photoId: photo.id,
            isApproved: true,
        });
    };

    const handlePhotoDraftChange = (
        photoId: number,
        changes: Partial<{ short_text: string; highlight_score: number }>
    ) => {
        setPhotoMetadataDrafts((current) => ({
            ...current,
            [photoId]: {
                short_text: changes.short_text ?? current[photoId]?.short_text ?? "",
                highlight_score: changes.highlight_score ?? current[photoId]?.highlight_score ?? 0,
            },
        }));
    };

    const handleSavePhotoMetadata = (photo: VipCoveragePhotoDetail) => {
        const draft = photoMetadataDrafts[photo.id] ?? {
            short_text: photo.short_text || "",
            highlight_score: photo.highlight_score ?? 0,
        };

        updateVipGalleryPhotoSlideshowMetadata.mutate({
            photoId: photo.id,
            shortText: draft.short_text.trim() || null,
            highlightScore: Math.max(0, Math.min(100, Number(draft.highlight_score || 0))),
        });
    };

    const handleStatusChange = (event: VipCoverageEvent, vipGalleryStatus: VipGalleryStatus) => {
        if ((event.vip_gallery_status || "draft") === vipGalleryStatus) {
            setStatusEditorEventId(null);
            return;
        }

        updateVipCoverageStatus.mutate(
            {
                eventId: event.id,
                vipGalleryStatus,
            },
            {
                onSuccess: () => setStatusEditorEventId(null),
            }
        );
    };

    const handleCloseDeleteModal = (open: boolean) => {
        if (open) {
            return;
        }

        setDeleteEvent(null);
    };

    const handleConfirmDeleteCoverage = () => {
        if (!deleteEvent) {
            return;
        }

        deleteVipCoverage.mutate(deleteEvent.id, {
            onSuccess: () => {
                if (photosEvent?.id === deleteEvent.id) {
                    setPhotosEvent(null);
                }

                setDeleteEvent(null);
            },
        });
    };

    if (error) {
        return (
            <AppShell>
                <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <p className="font-medium text-destructive">Erro ao carregar a Cobertura VIP</p>
                    <p className="mt-1 text-sm text-muted-foreground">Verifique a API autenticada de externas.</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Camera className="h-4 w-4" />
                            </div>
                            Cobertura VIP
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Eventos com galeria VIP configurada dentro do módulo de Externas.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate("/externas/cobertura-vip/logs")} className="rounded-xl">
                            <Logs className="mr-2 h-4 w-4" />
                            Log
                        </Button>
                        <Button onClick={() => navigate("/externas/novo")} className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Evento
                        </Button>
                    </div>
                </div>
            </motion.div>

            {stats && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
                >
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Image className="h-4 w-4" />
                            <p className="text-sm">Total Galerias</p>
                        </div>
                        <p className="text-2xl font-bold">{stats.total_galleries}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Galerias Ativas</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.active_galleries}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-sky-600">
                            <Eye className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Total Views</p>
                        </div>
                        <p className="text-2xl font-bold text-sky-600">{stats.total_views.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600">
                            <Download className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Total Downloads</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.total_downloads.toLocaleString("pt-BR")}</p>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 flex flex-col gap-3 lg:flex-row"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título, slug ou grupo WhatsApp"
                        className="h-11 rounded-xl pl-10"
                    />
                </div>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | VipGalleryStatus)}>
                    <SelectTrigger className="h-11 w-full rounded-xl lg:w-[220px]">
                        <SelectValue placeholder="Status da galeria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(vipStatusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                                <span className="flex items-center gap-2">
                                    <VipStatusIcon status={value as VipGalleryStatus} className={cn("h-4 w-4", config.tone)} />
                                    {config.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : events.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-card/70 px-6 py-16 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
                    <h2 className="text-lg font-semibold">Nenhuma cobertura VIP encontrada</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ative a cobertura VIP em um evento de Externas para ele aparecer aqui.
                    </p>
                    <Button variant="outline" className="mt-5 rounded-xl" onClick={() => navigate("/externas/novo")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar evento com VIP
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                    {events.map((event) => (
                        <VipCoverageCard
                            key={event.id}
                            event={event}
                            vipGroups={vipGroups}
                            isEditingStatus={statusEditorEventId === event.id}
                            isUpdatingStatus={updateVipCoverageStatus.isPending}
                            onStartEditStatus={setStatusEditorEventId}
                            onChangeStatus={handleStatusChange}
                            onOpenSlideshow={setSlideshowEvent}
                            onDownloadAll={handleOpenDownloadAll}
                            onOpenPhotos={handleOpenPhotos}
                            onOpenDelete={setDeleteEvent}
                        />
                    ))}
                </motion.div>
            )}

            <VipSlideshowDialog
                event={slideshowEvent}
                open={!!slideshowEvent}
                onOpenChange={(open) => {
                    if (!open) {
                        setSlideshowEvent(null);
                    }
                }}
            />

            <Dialog open={!!downloadEvent} onOpenChange={handleCloseDownloadModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Baixar Todas</DialogTitle>
                        <DialogDescription>
                            {downloadEvent
                                ? `Compactando as fotos publicas da cobertura ${downloadEvent.titulo}.`
                                : "Compactando as fotos da cobertura selecionada."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {downloadAllVipGalleryPhotos.isPending && (
                            <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div>
                                    <p className="font-medium">Compactando imagens</p>
                                    <p className="text-sm text-muted-foreground">
                                        Aguarde. O link do ZIP sera liberado automaticamente.
                                    </p>
                                </div>
                            </div>
                        )}

                        {downloadResult && (
                            <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
                                <div>
                                    <p className="font-medium">{downloadResult.file_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {downloadResult.total_files} imagem(ns) compactada(s)
                                    </p>
                                </div>
                                <Input value={downloadResult.download_url} readOnly className="rounded-xl" />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => handleCloseDownloadModal(false)}>
                            Fechar
                        </Button>
                        {downloadResult && (
                            <Button onClick={() => window.open(downloadResult.download_url, "_blank", "noopener,noreferrer")}>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar novamente
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!photosEvent} onOpenChange={handleClosePhotosModal}>
                <DialogContent className="sm:max-w-[920px]">
                    <DialogHeader>
                        <DialogTitle>Detalhes das Fotos</DialogTitle>
                        <DialogDescription>
                            {photosEvent
                                ? `Lista completa de fotos recebidas na cobertura ${photosEvent.titulo}.`
                                : "Lista completa de fotos recebidas na cobertura selecionada."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {isPhotosLoading ? (
                            <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-5">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div>
                                    <p className="font-medium">Carregando fotos</p>
                                    <p className="text-sm text-muted-foreground">
                                        Buscando detalhes, participantes e horarios desta galeria.
                                    </p>
                                </div>
                            </div>
                        ) : photoDetails ? (
                            <>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl border bg-muted/30 p-4">
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total de fotos</p>
                                        <p className="mt-2 text-2xl font-bold">{photoDetails.total_photos}</p>
                                    </div>
                                    <div className="rounded-2xl border bg-muted/30 p-4">
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fotos ativas</p>
                                        <p className="mt-2 text-2xl font-bold text-emerald-600">{photoDetails.active_photos}</p>
                                    </div>
                                    <div className="rounded-2xl border bg-muted/30 p-4">
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fotos desativadas</p>
                                        <p className="mt-2 text-2xl font-bold text-amber-600">{photoDetails.inactive_photos}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            Primeira foto enviada
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            {earliestPhoto?.image_url ? (
                                                <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                                                    <img
                                                        src={earliestPhoto.image_url}
                                                        alt="Thumb da primeira foto"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : null}
                                            <p className="text-sm font-medium">{formatDateTime(photoDetails.first_photo_sent_at)}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            Ultima foto enviada
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            {latestPhoto?.image_url ? (
                                                <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                                                    <img
                                                        src={latestPhoto.image_url}
                                                        alt="Thumb da ultima foto"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : null}
                                            <p className="text-sm font-medium">{formatDateTime(photoDetails.last_photo_sent_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <Users className="h-4 w-4 text-primary" />
                                        Participantes desta galeria
                                    </p>
                                    {photoDetails.participants.length === 0 ? (
                                        <p className="mt-3 text-sm text-muted-foreground">Nenhum participante identificado ainda.</p>
                                    ) : (
                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            {photoDetails.participants.map((participant) => (
                                                <div key={`${participant.participant_phone || participant.sender_name}-${participant.total_photos}`} className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {participantDisplayName(participant.sender_name, participant.participant_phone)}
                                                        </p>
                                                        {participant.participant_phone && (
                                                            <p className="truncate text-xs text-muted-foreground">{participant.participant_phone}</p>
                                                        )}
                                                    </div>
                                                    <Badge variant="secondary">{participant.total_photos} foto(s)</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                                    {photoDetails.photos.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed bg-card/70 px-5 py-10 text-center">
                                            <Image className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                                            <p className="font-medium">Nenhuma foto nesta cobertura</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Assim que o webhook publicar imagens, elas aparecerao aqui.
                                            </p>
                                        </div>
                                    ) : (
                                        photoDetails.photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className={cn(
                                                    "rounded-2xl border bg-card p-4",
                                                    !photo.is_approved && "border-destructive/40 bg-destructive/5"
                                                )}
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row">
                                                    {photo.image_url ? (
                                                        <div className="h-24 w-full overflow-hidden rounded-xl border bg-muted md:w-32">
                                                            <img src={photo.image_url} alt={participantDisplayName(photo.sender_name, photo.participant_phone)} className="h-full w-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-24 w-full items-center justify-center rounded-xl border bg-muted md:w-32">
                                                            <Image className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1 space-y-3">
                                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold">
                                                                    {participantDisplayName(photo.sender_name, photo.participant_phone)}
                                                                </p>
                                                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                                    {photo.participant_phone && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Phone className="h-3.5 w-3.5" />
                                                                            {photo.participant_phone}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        {formatDateTime(photoSentAt(photo))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Badge variant={photo.is_approved ? "default" : "secondary"} className={cn(!photo.is_approved && "bg-amber-500/15 text-amber-700")}>
                                                                    {photo.is_approved ? "Ativa na galeria" : "Desativada"}
                                                                </Badge>
                                                                <Badge variant="outline">{photo.processing_status}</Badge>
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                                                            <p>Mensagem: {photo.zapi_message_id}</p>
                                                            <p>Downloads: {photo.downloads_count}</p>
                                                            <p>Tamanho: {photo.width || 0}x{photo.height || 0}</p>
                                                        </div>

                                                        <div className="grid gap-3 rounded-2xl border bg-muted/20 p-3 md:grid-cols-[1.3fr_180px_auto]">
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`photo-short-text-${photo.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    Texto curto do telão
                                                                </Label>
                                                                <Input
                                                                    id={`photo-short-text-${photo.id}`}
                                                                    value={photoMetadataDrafts[photo.id]?.short_text ?? ""}
                                                                    onChange={(event) => handlePhotoDraftChange(photo.id, {
                                                                        short_text: event.target.value,
                                                                    })}
                                                                    className="rounded-xl bg-background"
                                                                    maxLength={255}
                                                                    placeholder="Ex.: Entrada dos noivos"
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                    {photo.caption?.trim() ? `Legenda original: ${photo.caption}` : "Sem legenda original no WhatsApp"}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor={`photo-highlight-${photo.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    Score de destaque
                                                                </Label>
                                                                <Input
                                                                    id={`photo-highlight-${photo.id}`}
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    value={photoMetadataDrafts[photo.id]?.highlight_score ?? 0}
                                                                    onChange={(event) => handlePhotoDraftChange(photo.id, {
                                                                        highlight_score: Number(event.target.value || 0),
                                                                    })}
                                                                    className="rounded-xl bg-background"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline">
                                                                        {photoMetadataDrafts[photo.id]?.highlight_score ?? 0}/100
                                                                    </Badge>
                                                                    {(photoMetadataDrafts[photo.id]?.highlight_score ?? 0) >= 80 ? (
                                                                        <Badge className="bg-orange-500 text-white">Destaque</Badge>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col justify-between gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    className="rounded-xl"
                                                                    onClick={() => handleSavePhotoMetadata(photo)}
                                                                    disabled={updateVipGalleryPhotoSlideshowMetadata.isPending}
                                                                >
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                    Salvar dados
                                                                </Button>

                                                                {photo.is_approved ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-xl"
                                                                        onClick={() => handleDeactivatePhoto(photo)}
                                                                        disabled={updateVipGalleryPhotoApproval.isPending}
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Desativar foto
                                                                    </Button>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        <Badge variant="outline" className="border-destructive/30 text-destructive">
                                                                            Foto desativada manualmente
                                                                        </Badge>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700"
                                                                            onClick={() => handleActivatePhoto(photo)}
                                                                            disabled={updateVipGalleryPhotoApproval.isPending}
                                                                        >
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                            Ativar foto
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed bg-card/70 px-5 py-10 text-center">
                                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                                <p className="font-medium">Nao foi possivel carregar as fotos</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tente abrir os detalhes novamente em alguns instantes.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => handleClosePhotosModal(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteEvent} onOpenChange={handleCloseDeleteModal}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Excluir Cobertura VIP</DialogTitle>
                        <DialogDescription>
                            Esta acao apaga todas as fotos e banners definitivamente, remove o vinculo VIP do evento e nao pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteEvent && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-2xl border bg-muted/30 p-4">
                                <p className="font-medium">{deleteEvent.titulo}</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fotos a apagar</p>
                                        <p className="mt-1 text-xl font-bold text-destructive">{deleteEvent.vip_gallery_photos_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Banners a apagar</p>
                                        <p className="mt-1 text-xl font-bold text-destructive">{deleteEvent.vip_gallery_banners_count}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                O log administrativo vai registrar qual usuario removeu esta cobertura VIP e quantas fotos foram apagadas.
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => handleCloseDeleteModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDeleteCoverage}
                            disabled={deleteVipCoverage.isPending}
                        >
                            {deleteVipCoverage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apagar cobertura definitivamente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default VipCoverageDashboard;
