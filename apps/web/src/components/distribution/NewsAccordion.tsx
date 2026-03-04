import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, Trash2, RotateCcw, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsGrouped, getConsolidatedStatus, formatRelativeTime } from "@/types/distribution";
import { ChannelBadge } from "./ChannelBadge";
import { DistributionStatusBadge } from "./DistributionStatusBadge";
import { cn } from "@/lib/utils";

interface NewsAccordionProps {
    news: NewsGrouped;
    onDeleteAll?: (newsId: number) => void;
    onDeleteChannel?: (newsId: number, messageId: number) => void;
    onRetry?: (newsId: number) => void;
}

/**
 * Accordion de notícia distribuída com detalhes por canal
 */
export const NewsAccordion = ({
    news,
    onDeleteAll,
    onDeleteChannel,
    onRetry,
}: NewsAccordionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const consolidatedStatus = getConsolidatedStatus(news.messages);
    const hasFailures = news.messages.some(m => m.status === 'failed');

    const sentCount = news.messages.filter(m => m.status === 'sent').length;
    const totalCount = news.messages.length;

    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    {news.urlImage ? (
                        <img
                            src={news.urlImage}
                            alt={news.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Title & Meta */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {news.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(news.created_at)}</span>
                        <span>•</span>
                        <span>{totalCount} canai(s)</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn(
                        "text-sm font-medium",
                        sentCount === totalCount ? "text-green-500" :
                            sentCount === 0 ? "text-red-500" : "text-yellow-500"
                    )}>
                        {sentCount}/{totalCount}
                    </span>
                    <DistributionStatusBadge status={consolidatedStatus} size="sm" />
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0">
                            {/* Link */}
                            <a
                                href={news.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-4"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {news.link}
                            </a>

                            {/* Messages Table */}
                            <div className="bg-muted/30 rounded-xl overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left p-3 font-medium text-muted-foreground">Canal</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Destino</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Horário</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {news.messages.map((message) => (
                                            <tr
                                                key={message.id}
                                                className="border-b border-border/30 last:border-0"
                                            >
                                                <td className="p-3">
                                                    <ChannelBadge channel={message.channel} size="sm" />
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {message.destination_name}
                                                </td>
                                                <td className="p-3">
                                                    <DistributionStatusBadge status={message.status} size="sm" />
                                                </td>
                                                <td className="p-3 text-muted-foreground text-xs">
                                                    {message.sent_at ? formatRelativeTime(message.sent_at) : '-'}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {message.status !== 'deleted' && onDeleteChannel && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onDeleteChannel(news.id, message.id)}
                                                            className="h-7 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {hasFailures && onRetry && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRetry(news.id)}
                                        className="rounded-lg"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        Reenviar Falhos
                                    </Button>
                                )}
                                {consolidatedStatus !== 'deleted' && onDeleteAll && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDeleteAll(news.id)}
                                        className="rounded-lg text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Deletar de Todos
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
