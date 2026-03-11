import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StreamingHeaderProps {
    newCount: number;
    lastUpdatedAt: Date | null;
    isOffline: boolean;
}

export function StreamingHeader({ newCount, lastUpdatedAt, isOffline }: StreamingHeaderProps) {
    const navigate = useNavigate();

    const formattedTime = lastUpdatedAt
        ? lastUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "--:--";

    return (
        <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/30 bg-background/95 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isOffline ? "bg-destructive" : "bg-success",
                    )}
                />
                <span className="text-sm font-semibold">NewsRadar</span>
                <Badge
                    variant="outline"
                    className="rounded-full text-xs"
                >
                    {isOffline ? "Offline" : "Ao vivo"}
                </Badge>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                    Atualizado às {formattedTime}
                </span>

                {newCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Badge className="rounded-full bg-success/15 text-success">
                            {newCount} {newCount === 1 ? "nova" : "novas"}
                        </Badge>
                    </motion.div>
                )}

                {isOffline && (
                    <Badge className="rounded-full bg-destructive/15 text-destructive">
                        Sem conexão — tentando reconectar
                    </Badge>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => navigate("/raspagem/feed")}
                    aria-label="Fechar modo streaming"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
