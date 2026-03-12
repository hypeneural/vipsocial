import { Archive, ArrowUpRight, FolderOpen, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getBundleStatusLabel,
    useArchiveWhatsAppBundle,
    usePromoteWhatsAppBundle,
    useReopenWhatsAppBundle,
    useSetWhatsAppBundleStar,
} from "@/features/news-radar-whatsapp/hooks/useNewsRadarWhatsApp";
import type { WhatsAppNewsBundle } from "@/features/news-radar-whatsapp/types";
import { formatWhatsAppDateTime } from "@/features/news-radar-whatsapp/utils/formatters";

interface WhatsAppBundlesPanelProps {
    bundles: WhatsAppNewsBundle[];
    isLoading: boolean;
    onOpenBundle: (bundleId: number) => void;
}

export function WhatsAppBundlesPanel({
    bundles,
    isLoading,
    onOpenBundle,
}: WhatsAppBundlesPanelProps) {
    const setStarMutation = useSetWhatsAppBundleStar();
    const archiveMutation = useArchiveWhatsAppBundle();
    const reopenMutation = useReopenWhatsAppBundle();
    const promoteMutation = usePromoteWhatsAppBundle();

    return (
        <Card className="rounded-3xl border-border/60">
            <CardHeader>
                <CardTitle className="text-base">Bundles do grupo</CardTitle>
                <p className="text-xs text-muted-foreground">
                    Rascunhos criados a partir da selecao manual da timeline.
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-28 rounded-2xl" />
                        <Skeleton className="h-28 rounded-2xl" />
                    </>
                ) : bundles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        Nenhum bundle criado para este grupo ainda.
                    </div>
                ) : (
                    bundles.map((bundle) => (
                        <div
                            key={bundle.id}
                            className="rounded-2xl border border-border/50 bg-card p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {bundle.title || `Bundle #${bundle.id}`}
                                        </p>
                                        <Badge variant="outline" className="rounded-full">
                                            {getBundleStatusLabel(bundle.status)}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {bundle.message_count} mensagem(ns) • Atualizado em{" "}
                                        {formatWhatsAppDateTime(bundle.updated_at)}
                                    </p>
                                </div>
                                {bundle.is_starred ? (
                                    <Star className="h-4 w-4 fill-warning text-warning" />
                                ) : null}
                            </div>

                            {bundle.summary ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {bundle.summary}
                                </p>
                            ) : null}

                            {bundle.has_updated_source_messages ? (
                                <p className="mt-3 text-xs text-warning">
                                    Mensagens de origem foram editadas depois da montagem.
                                </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => onOpenBundle(bundle.id)}
                                >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    Abrir bundle
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() =>
                                        setStarMutation.mutate({
                                            id: bundle.id,
                                            isStarred: !bundle.is_starred,
                                        })
                                    }
                                >
                                    <Star className="mr-2 h-4 w-4" />
                                    {bundle.is_starred ? "Remover estrela" : "Destacar"}
                                </Button>

                                {bundle.status === "archived" ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={() =>
                                            reopenMutation.mutate({
                                                id: bundle.id,
                                                lockVersion: bundle.lock_version,
                                            })
                                        }
                                    >
                                        Reabrir
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={() =>
                                            archiveMutation.mutate({
                                                id: bundle.id,
                                                lockVersion: bundle.lock_version,
                                            })
                                        }
                                    >
                                        <Archive className="mr-2 h-4 w-4" />
                                        Arquivar
                                    </Button>
                                )}

                                {bundle.status !== "promoted" && bundle.status !== "archived" ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={() =>
                                            promoteMutation.mutate({
                                                id: bundle.id,
                                                lockVersion: bundle.lock_version,
                                            })
                                        }
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Promover
                                    </Button>
                                ) : null}

                                {bundle.status === "promoted" ? (
                                    <Badge className="rounded-full border-success/30 bg-success/10 text-success">
                                        <ArrowUpRight className="mr-1 h-3 w-3" />
                                        Ja promovido
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
