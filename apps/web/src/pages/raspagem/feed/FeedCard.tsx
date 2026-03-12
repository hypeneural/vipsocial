import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    Brain,
    CalendarClock,
    CircleHelp,
    Clock,
    ExternalLink,
    FileSearch,
    FileText,
    Globe,
    Image as ImageIcon,
    MapPin,
    Sparkles,
    Timer,
    UserRound,
    Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NewsItem } from "@/services/newsRadar.service";
import { cn } from "@/lib/utils";
import {
    HIGH_RELEVANCE_SCORE,
    extractionLabels,
    enrichmentLabels,
    formatDateTime,
    formatRelativeTime,
    getAiFacts,
    getCaptureBadgeLabel,
    getHostname,
    getSummary,
    isRecentItem,
    urgencyLabels,
} from "./feed-utils";
import type { AiFactKey } from "./feed-utils";
import { AiGenerateMenu } from "./AiGenerateMenu";

interface FeedCardProps {
    item: NewsItem;
    index: number;
    onSelect: (id: number) => void;
}

const listAiFactKeys: AiFactKey[] = ["who", "where", "when", "what", "why", "how"];

const aiFactVisuals: Record<
    AiFactKey,
    { icon: LucideIcon; tone: string }
> = {
    who: {
        icon: UserRound,
        tone: "border-primary/20 bg-primary/5 text-primary",
    },
    where: {
        icon: MapPin,
        tone: "border-info/20 bg-info/5 text-info",
    },
    when: {
        icon: CalendarClock,
        tone: "border-success/20 bg-success/5 text-success",
    },
    what: {
        icon: FileText,
        tone: "border-warning/20 bg-warning/5 text-warning",
    },
    why: {
        icon: CircleHelp,
        tone: "border-border/60 bg-background/80 text-foreground/80",
    },
    how: {
        icon: Wrench,
        tone: "border-border/60 bg-background/80 text-foreground/80",
    },
};

function FeedCardImage({ item }: { item: NewsItem }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [item.hero_image_url]);

    if (!item.hero_image_url || hasError) {
        return (
            <div className="hidden w-28 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/40 px-3 py-4 sm:flex md:w-36">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-center text-[11px] leading-tight text-muted-foreground">
                    Imagem indisponivel
                </span>
            </div>
        );
    }

    return (
        <div className="hidden w-28 flex-shrink-0 overflow-hidden rounded-xl sm:block md:w-36">
            <img
                src={item.hero_image_url}
                alt={item.title}
                className="h-20 w-full object-cover md:h-24"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
            />
        </div>
    );
}

export function FeedCard({ item, index, onSelect }: FeedCardProps) {
    const highRelevance = (item.ai_metadata?.relevance_score ?? 0) >= HIGH_RELEVANCE_SCORE;
    const allFacts = getAiFacts(item, listAiFactKeys);

    return (
        <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
                "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
                item.is_duplicate_candidate && "border-warning/40 bg-warning/5",
                !item.is_duplicate_candidate && highRelevance && "border-primary/40 bg-primary/5",
                !item.is_duplicate_candidate && !highRelevance && "border-border/50",
            )}
        >
            <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {isRecentItem(item) && (
                        <Badge className="rounded-full bg-success/15 text-success">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Novo
                        </Badge>
                    )}

                    {item.is_duplicate_candidate && (
                        <Badge className="rounded-full bg-warning/15 text-warning">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Duplicado
                        </Badge>
                    )}

                    {highRelevance && (
                        <Badge className="rounded-full bg-primary/15 text-primary">
                            <Brain className="mr-1 h-3 w-3" />
                            Alta relevancia
                        </Badge>
                    )}

                    <Badge variant="outline" className="rounded-full">
                        {extractionLabels[item.extraction_status] ?? item.extraction_status}
                    </Badge>

                    <Badge variant="outline" className="rounded-full">
                        {enrichmentLabels[item.enrichment_status] ?? item.enrichment_status}
                    </Badge>
                </div>

                <div className="flex gap-4">
                    <FeedCardImage item={item} />

                    <div className="min-w-0 flex-1">
                        <h3 className="mb-2 text-sm font-semibold md:text-base">{item.title}</h3>

                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span className="font-medium text-foreground/80">
                                    {item.source?.name ?? "Fonte desconhecida"}
                                </span>
                            </span>
                            <span>/</span>
                            <span>{getHostname(item.url)}</span>
                            <span>/</span>
                            <span
                                className="flex items-center gap-1"
                                title="Data da noticia publicada"
                            >
                                <Clock className="h-3 w-3" />
                                Publicada {formatDateTime(item.published_at_utc)}
                            </span>
                            <span>/</span>
                            <span
                                className="flex items-center gap-1"
                                title="Data da captura pelo radar"
                            >
                                <Timer className="h-3 w-3" />
                                Capturada {formatRelativeTime(item.created_at)}
                            </span>
                        </div>

                        <p className="line-clamp-3 text-sm text-muted-foreground">
                            {getSummary(item)}
                        </p>

                        {allFacts.length > 0 && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                {allFacts.map((fact) => {
                                    const visual = aiFactVisuals[fact.key];
                                    const FactIcon = visual.icon;

                                    return (
                                        <div
                                            key={`${item.id}-${fact.key}`}
                                            className={`min-w-0 rounded-xl border p-2.5 ${visual.tone}`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <FactIcon className="h-3.5 w-3.5" />
                                                <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
                                                    {fact.label}
                                                </p>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-foreground/90">
                                                {fact.value}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {item.ai_metadata?.summary_bullets &&
                            item.ai_metadata.summary_bullets.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {item.ai_metadata.summary_bullets.slice(0, 3).map((bullet) => (
                                        <div
                                            key={bullet}
                                            className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground"
                                        >
                                            {bullet}
                                        </div>
                                    ))}
                                </div>
                            )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            {item.ai_metadata?.city && (
                                <Badge variant="secondary" className="rounded-full">
                                    {item.ai_metadata.city}
                                </Badge>
                            )}
                            {item.ai_metadata?.urgency && (
                                <Badge variant="secondary" className="rounded-full">
                                    {urgencyLabels[item.ai_metadata.urgency] ??
                                        item.ai_metadata.urgency}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="rounded-full">
                                {getCaptureBadgeLabel(item.extraction_completeness)}
                            </Badge>
                            {!!item.categories_raw?.length &&
                                item.categories_raw.slice(0, 3).map((category) => (
                                    <Badge
                                        key={`${item.id}-${category}`}
                                        variant="secondary"
                                        className="rounded-full"
                                    >
                                        {category}
                                    </Badge>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                    <Button className="rounded-lg" size="sm" onClick={() => onSelect(item.id)}>
                        <FileSearch className="mr-1 h-3 w-3" />
                        Detalhes
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                    >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir origem
                    </Button>

                    <AiGenerateMenu item={item} />

                    <div className="ml-auto flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Data da noticia publicada">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(item.published_at_utc)}
                        </span>
                        <span
                            className="flex items-center gap-1 text-[10px]"
                            title="Data da captura pelo radar"
                        >
                            <Timer className="h-3 w-3" />
                            {formatDateTime(item.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
