import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    EyeOff,
    FileText,
    Forward,
    Image as ImageIcon,
    Link2,
    MessageSquareQuote,
    Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { WhatsAppTimelineEvent } from "@/features/news-radar-whatsapp/types";
import {
    formatWhatsAppDateTime,
    formatWhatsAppTime,
    getInitials,
} from "@/features/news-radar-whatsapp/utils/formatters";
import { cn } from "@/lib/utils";

interface WhatsAppTimelineMessageRowProps {
    event: WhatsAppTimelineEvent;
    checked: boolean;
    onToggleSelect: (eventId: number, checked: boolean) => void;
    onIgnore: (eventId: number) => void;
    onUnignore: (eventId: number) => void;
    onStar: (eventId: number) => void;
    onUnstar: (eventId: number) => void;
    onMarkReviewed: (eventId: number) => void;
}

function renderMediaKindLabel(kind: string) {
    switch (kind) {
        case "image":
            return "Imagem";
        case "video":
            return "Video";
        case "document":
            return "Documento";
        case "audio":
            return "Audio";
        case "thumbnail":
            return "Thumbnail";
        default:
            return kind;
    }
}

export function WhatsAppTimelineMessageRow({
    event,
    checked,
    onToggleSelect,
    onIgnore,
    onUnignore,
    onStar,
    onUnstar,
    onMarkReviewed,
}: WhatsAppTimelineMessageRowProps) {
    const isIgnored = event.user_state.is_ignored;
    const isStarred = event.user_state.is_starred;
    const isReviewed = Boolean(event.user_state.reviewed_at);
    const unavailableMedia = event.media.some((media) => media.download_status === "failed");

    return (
        <Card
            className={cn(
                "rounded-3xl border-border/60 transition-all",
                checked && "border-success/40 bg-success/5 shadow-sm",
                isIgnored && "border-warning/30 bg-warning/5",
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => onToggleSelect(event.id, value === true)}
                        className="mt-1"
                    />

                    <Avatar className="h-12 w-12 rounded-2xl">
                        <AvatarImage
                            src={event.sender_photo ?? undefined}
                            alt={event.sender_name ?? "Remetente"}
                        />
                        <AvatarFallback className="rounded-2xl text-xs font-semibold">
                            {getInitials(event.sender_name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {event.sender_name || "Remetente nao identificado"}
                                    </p>
                                    {event.participant_phone ? (
                                        <Badge variant="outline" className="rounded-full text-[11px]">
                                            {event.participant_phone}
                                        </Badge>
                                    ) : null}
                                    <Badge variant="secondary" className="rounded-full text-[11px]">
                                        {renderMediaKindLabel(event.message_kind)}
                                    </Badge>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatWhatsAppDateTime(event.sent_at)}</span>
                                    <span>•</span>
                                    <span>{formatWhatsAppTime(event.sent_at)}</span>
                                    {event.reference_message_id ? (
                                        <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1">
                                                <MessageSquareQuote className="h-3.5 w-3.5" />
                                                Resposta encadeada
                                            </span>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {event.is_deleted ? (
                                    <Badge className="rounded-full border-rose-500/30 bg-rose-500/10 text-rose-700">
                                        Removida na origem
                                    </Badge>
                                ) : null}
                                {unavailableMedia ? (
                                    <Badge className="rounded-full border-warning/30 bg-warning/10 text-warning">
                                        Anexo indisponivel
                                    </Badge>
                                ) : null}
                                {event.bundle_usage_state ? (
                                    <Badge variant="outline" className="rounded-full text-[11px]">
                                        {event.bundle_usage_state}
                                    </Badge>
                                ) : null}
                                {isReviewed ? (
                                    <Badge className="rounded-full border-info/30 bg-info/10 text-info">
                                        Revisada
                                    </Badge>
                                ) : null}
                                {isIgnored ? (
                                    <Badge className="rounded-full border-warning/30 bg-warning/10 text-warning">
                                        Ignorada
                                    </Badge>
                                ) : null}
                                {event.is_forwarded ? (
                                    <Badge variant="outline" className="rounded-full text-[11px]">
                                        <Forward className="mr-1 h-3 w-3" />
                                        Encaminhada
                                    </Badge>
                                ) : null}
                            </div>
                        </div>

                        {event.text_message ? (
                            <div className="mt-4 rounded-2xl border border-border/40 bg-muted/30 p-3 text-sm leading-6 text-foreground">
                                {event.text_message}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                                Mensagem sem corpo textual.
                            </div>
                        )}

                        {event.link_url ? (
                            <a
                                href={event.link_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-sm text-info hover:underline"
                            >
                                <Link2 className="h-4 w-4" />
                                Abrir link detectado
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        ) : null}

                        {event.media.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {event.media.map((media) => {
                                    const previewUrl =
                                        media.thumbnail_source_url || media.source_url || undefined;

                                    return (
                                        <div
                                            key={media.id}
                                            className="overflow-hidden rounded-2xl border border-border/40 bg-card"
                                        >
                                            {media.kind === "image" && previewUrl ? (
                                                <a
                                                    href={media.source_url ?? previewUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block"
                                                >
                                                    <img
                                                        src={previewUrl}
                                                        alt={media.file_name ?? "Preview da imagem"}
                                                        className="h-32 w-full object-cover"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="flex h-32 items-center justify-center bg-muted/30 text-muted-foreground">
                                                    {media.kind === "document" ? (
                                                        <FileText className="h-8 w-8" />
                                                    ) : (
                                                        <ImageIcon className="h-8 w-8" />
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {renderMediaKindLabel(media.kind)}
                                                    </p>
                                                    <Badge variant="outline" className="rounded-full text-[10px]">
                                                        {media.download_status}
                                                    </Badge>
                                                </div>

                                                {media.file_name ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {media.file_name}
                                                    </p>
                                                ) : null}

                                                {media.source_url || previewUrl ? (
                                                    <a
                                                        href={media.source_url ?? previewUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                                                    >
                                                        Abrir anexo
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-xs text-warning">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        Sem URL de preview
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant={isStarred ? "default" : "outline"}
                                size="sm"
                                className="rounded-xl"
                                onClick={() => (isStarred ? onUnstar(event.id) : onStar(event.id))}
                            >
                                <Star className="mr-2 h-4 w-4" />
                                {isStarred ? "Remover estrela" : "Destacar"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => (isIgnored ? onUnignore(event.id) : onIgnore(event.id))}
                            >
                                <EyeOff className="mr-2 h-4 w-4" />
                                {isIgnored ? "Reexibir" : "Ignorar"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => onMarkReviewed(event.id)}
                                disabled={isReviewed}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {isReviewed ? "Ja revisada" : "Marcar revisada"}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
