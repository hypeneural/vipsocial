import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FeedImage } from "../feed/FeedImage";
import type { NewsItem } from "@/services/newsRadar.service";
import { formatRelativeTime, urgencyLabels } from "../feed/feed-utils";
import { AiGenerateMenu } from "../feed/AiGenerateMenu";

interface StreamingCardProps {
    item: NewsItem;
    isNew?: boolean;
}

export function StreamingCard({ item, isNew }: StreamingCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <motion.button
                initial={isNew ? { opacity: 0, y: -20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                type="button"
                className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-all hover:shadow-md hover:border-border/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => setDialogOpen(true)}
            >
                <FeedImage
                    src={item.hero_image_url}
                    alt={item.title}
                    aspectRatio="video"
                />

                <div className="space-y-2 p-3">
                    {item.ai_metadata?.urgency && item.ai_metadata.urgency !== "baixa" && (
                        <Badge className="rounded-full bg-warning/15 text-warning text-[11px]">
                            {urgencyLabels[item.ai_metadata.urgency] ?? item.ai_metadata.urgency}
                        </Badge>
                    )}

                    <h3 className="line-clamp-3 text-sm font-semibold leading-snug">
                        {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {item.source?.name ?? "Fonte"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(item.created_at)}
                        </span>
                    </div>

                    {item.ai_metadata?.city && (
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                            {item.ai_metadata.city}
                        </Badge>
                    )}

                    {!!item.categories_raw?.length && (
                        <div className="flex flex-wrap gap-1">
                            {item.categories_raw.slice(0, 3).map((cat) => (
                                <Badge
                                    key={cat}
                                    variant="secondary"
                                    className="rounded-full text-[10px]"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </motion.button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base">{item.title}</DialogTitle>
                    </DialogHeader>

                    <FeedImage
                        src={item.hero_image_url}
                        alt={item.title}
                        aspectRatio="video"
                    />

                    {item.excerpt && (
                        <p className="text-sm text-muted-foreground">{item.excerpt}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source?.name ?? "Fonte"}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.created_at)}</span>
                        {item.ai_metadata?.city && (
                            <>
                                <span>•</span>
                                <span>{item.ai_metadata.city}</span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="rounded-xl"
                            onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                        >
                            Abrir matéria
                        </Button>

                        <AiGenerateMenu item={item} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
