import { useEffect, useState } from "react";
import {
    AlertTriangle,
    ExternalLink,
    FileSearch,
    Globe,
    Image as ImageIcon,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ShimmerText } from "@/components/Shimmer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { NewsItem } from "@/services/newsRadar.service";
import type { UseQueryResult } from "@tanstack/react-query";
import {
    extractionLabels,
    enrichmentLabels,
    urgencyLabels,
    listingAiFactKeys,
    formatDateTime,
    getSummary,
    getAiFacts,
    getCaptureQualityLabel,
    getLatestFailedAiLog,
    formatAiStage,
    formatAiStrategy,
    formatAiCategory,
} from "./feed-utils";
import { AiGenerateMenu } from "./AiGenerateMenu";

interface FeedDetailDialogProps {
    selectedItemId: number | null;
    onClose: () => void;
    itemDetailQuery: UseQueryResult<NewsItem>;
    relatedItemsQuery: UseQueryResult<{ data: NewsItem[] }>;
    onSelectRelated: (id: number) => void;
}

function FeedDetailImage({ item }: { item: NewsItem }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [item.hero_image_url]);

    if (!item.hero_image_url || hasError) {
        const message = item.hero_image_url
            ? "A materia tem imagem cadastrada, mas a origem nao entregou a miniatura para o admin."
            : "Esta materia nao trouxe uma imagem utilizavel para exibicao no painel.";

        return (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10">
                <div className="flex flex-col items-center gap-3 text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="font-medium">Imagem indisponivel</p>
                        <p className="text-sm text-muted-foreground">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border/50">
            <img
                src={item.hero_image_url}
                alt={item.title}
                className="max-h-[340px] w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
            />
        </div>
    );
}

export function FeedDetailDialog({
    selectedItemId,
    onClose,
    itemDetailQuery,
    relatedItemsQuery,
    onSelectRelated,
}: FeedDetailDialogProps) {
    const selectedItem = itemDetailQuery.data;
    const selectedPrimaryFacts = getAiFacts(selectedItem, listingAiFactKeys);
    const selectedAllFacts = getAiFacts(selectedItem);
    const latestAiFailure = getLatestFailedAiLog(selectedItem);
    const recentAiLogs = selectedItem?.ai_logs?.slice(0, 5) ?? [];

    const getLogMetaValue = (log: NonNullable<NewsItem["ai_logs"]>[number], key: string) => {
        const value = log.meta_json?.[key];
        return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : null;
    };

    return (
        <Dialog
            open={Boolean(selectedItemId)}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {selectedItem?.title ?? "Detalhes da noticia"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedItem
                            ? `${selectedItem.source?.name ?? "Fonte"} • ${formatDateTime(
                                  selectedItem.published_at_utc,
                              )}`
                            : "Carregando item selecionado..."}
                    </DialogDescription>
                </DialogHeader>

                {itemDetailQuery.isLoading ? (
                    <div className="space-y-4">
                        <ShimmerText width="45%" />
                        <ShimmerText width="80%" />
                        <ShimmerText width="70%" />
                    </div>
                ) : selectedItem ? (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                                {extractionLabels[selectedItem.extraction_status] ??
                                    selectedItem.extraction_status}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                                {enrichmentLabels[selectedItem.enrichment_status] ??
                                    selectedItem.enrichment_status}
                            </Badge>
                            {selectedItem.ai_metadata?.urgency && (
                                <Badge className="rounded-full bg-warning/15 text-warning">
                                    {urgencyLabels[selectedItem.ai_metadata.urgency] ??
                                        selectedItem.ai_metadata.urgency}
                                </Badge>
                            )}
                            {selectedItem.is_duplicate_candidate && (
                                <Badge className="rounded-full bg-warning/15 text-warning">
                                    Possivel duplicado
                                </Badge>
                            )}
                        </div>

                        <FeedDetailImage item={selectedItem} />

                        {selectedPrimaryFacts.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                {selectedPrimaryFacts.map((fact) => (
                                    <div
                                        key={`selected-${fact.key}`}
                                        className="rounded-2xl border border-border/50 bg-background/70 p-4"
                                    >
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                            {fact.label}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold leading-6">
                                            {fact.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                            <div className="space-y-4">
                                {selectedItem.subtitle && (
                                    <p className="text-base text-muted-foreground">
                                        {selectedItem.subtitle}
                                    </p>
                                )}

                                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                    <h3 className="mb-2 font-semibold">Resumo</h3>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {getSummary(selectedItem)}
                                    </p>
                                </div>

                                {selectedItem.body_text && (
                                    <div className="rounded-2xl border border-border/50 bg-card p-4">
                                        <h3 className="mb-2 font-semibold">Texto limpo</h3>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                            {selectedItem.body_text.slice(0, 2400)}
                                            {selectedItem.body_text.length > 2400 ? "..." : ""}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-border/50 bg-card p-4">
                                    <h3 className="mb-3 font-semibold">Contexto</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Fonte</span>
                                            <span className="text-right font-medium">
                                                {selectedItem.source?.name ?? "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Publicada</span>
                                            <span className="text-right font-medium">
                                                {formatDateTime(selectedItem.published_at_utc)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Cidade</span>
                                            <span className="text-right font-medium">
                                                {selectedItem.ai_metadata?.city ?? "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Relevancia</span>
                                            <span className="text-right font-medium">
                                                {selectedItem.ai_metadata?.relevance_score != null
                                                    ? `${Math.round(
                                                          selectedItem.ai_metadata
                                                              .relevance_score * 100,
                                                      )}%`
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                Qualidade da captura
                                            </span>
                                            <div className="text-right">
                                                <div className="font-medium">
                                                    {selectedItem.extraction_completeness}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {getCaptureQualityLabel(
                                                        selectedItem.extraction_completeness,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            className="rounded-lg"
                                            onClick={() =>
                                                window.open(
                                                    selectedItem.url,
                                                    "_blank",
                                                    "noopener,noreferrer",
                                                )
                                            }
                                        >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            Abrir materia
                                        </Button>

                                        <AiGenerateMenu item={selectedItem} />

                                        {selectedItem.source?.homepage_url && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() =>
                                                    window.open(
                                                        selectedItem.source?.homepage_url || "",
                                                        "_blank",
                                                        "noopener,noreferrer",
                                                    )
                                                }
                                            >
                                                <Globe className="mr-1 h-3 w-3" />
                                                Abrir fonte
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-card p-4">
                                    <h3 className="mb-3 font-semibold">Leitura da IA</h3>

                                    {latestAiFailure && (
                                        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                                                <div className="min-w-0 space-y-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            Ultima falha da IA
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatAiStage(latestAiFailure.stage)} •{" "}
                                                            {latestAiFailure.model || "modelo nao informado"} •{" "}
                                                            {formatDateTime(latestAiFailure.created_at)}
                                                        </p>
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                        {latestAiFailure.error_message || "Falha sem mensagem."}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <span>
                                                            Estrategia:{" "}
                                                            {formatAiStrategy(
                                                                getLogMetaValue(latestAiFailure, "strategy"),
                                                            )}
                                                        </span>
                                                        <span>
                                                            Categoria:{" "}
                                                            {formatAiCategory(
                                                                getLogMetaValue(latestAiFailure, "category"),
                                                            )}
                                                        </span>
                                                        {getLogMetaValue(latestAiFailure, "provider_status") && (
                                                            <span>
                                                                HTTP {getLogMetaValue(latestAiFailure, "provider_status")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!!selectedAllFacts.length && (
                                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                            {selectedAllFacts.map((fact) => (
                                                <div
                                                    key={`fact-${fact.key}`}
                                                    className="rounded-xl border border-border/50 bg-background/70 p-3"
                                                >
                                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                        {fact.label}
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium leading-6">
                                                        {fact.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!!selectedItem.ai_metadata?.summary_bullets?.length && (
                                        <div className="mb-4 space-y-2">
                                            {selectedItem.ai_metadata.summary_bullets.map((bullet) => (
                                                <div
                                                    key={bullet}
                                                    className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground"
                                                >
                                                    {bullet}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {recentAiLogs.length > 0 && (
                                        <div className="space-y-2 border-t border-border/50 pt-4">
                                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                Log recente da IA
                                            </p>
                                            <div className="space-y-2">
                                                {recentAiLogs.map((log) => (
                                                    <div
                                                        key={log.id}
                                                        className="rounded-xl border border-border/50 bg-background/70 p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                                            <Badge variant="outline" className="rounded-full">
                                                                {formatAiStage(log.stage)}
                                                            </Badge>
                                                            <Badge variant="outline" className="rounded-full">
                                                                {log.status === "failed" ? "Falha" : "Sucesso"}
                                                            </Badge>
                                                            <span className="text-muted-foreground">
                                                                {log.model || "modelo nao informado"}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {formatDateTime(log.created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                            <span>
                                                                Estrategia: {formatAiStrategy(getLogMetaValue(log, "strategy"))}
                                                            </span>
                                                            <span>
                                                                Categoria: {formatAiCategory(getLogMetaValue(log, "category"))}
                                                            </span>
                                                            {getLogMetaValue(log, "attempt") && (
                                                                <span>Tentativa {getLogMetaValue(log, "attempt")}</span>
                                                            )}
                                                            {getLogMetaValue(log, "provider_status") && (
                                                                <span>HTTP {getLogMetaValue(log, "provider_status")}</span>
                                                            )}
                                                            {getLogMetaValue(log, "next_action") && (
                                                                <span>Proximo passo: {getLogMetaValue(log, "next_action")}</span>
                                                            )}
                                                        </div>
                                                        {log.error_message && (
                                                            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                                                {log.error_message}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!selectedItem.ai_metadata?.summary_bullets?.length &&
                                        !selectedAllFacts.length && (
                                            <p className="text-sm text-muted-foreground">
                                                A IA ainda nao gerou leitura detalhada para esta materia.
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-4">
                            <h3 className="mb-3 font-semibold">Relacionadas</h3>

                            {relatedItemsQuery.isLoading ? (
                                <div className="space-y-3">
                                    <ShimmerText width="65%" />
                                    <ShimmerText width="55%" />
                                </div>
                            ) : (relatedItemsQuery.data?.data?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma relacionada encontrada na mesma fonte.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {relatedItemsQuery.data?.data.map((related) => (
                                        <button
                                            key={related.id}
                                            type="button"
                                            className="w-full rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/40"
                                            onClick={() => onSelectRelated(related.id)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">{related.title}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {related.excerpt || "Sem resumo"}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatDateTime(related.published_at_utc)}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        icon={FileSearch}
                        title="Nao foi possivel carregar o item"
                        description="Tente atualizar o feed e abrir novamente os detalhes."
                        size="sm"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
