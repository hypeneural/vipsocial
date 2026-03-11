import { motion } from "framer-motion";
import { Monitor, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedHeaderProps {
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function FeedHeader({ isRefreshing, onRefresh }: FeedHeaderProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-3 w-3 rounded-full bg-success"
                        />
                        <h1 className="text-xl font-bold md:text-2xl">Feed ao vivo</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Itens reais do modulo NewsRadar com filtros operacionais e diagnostico.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => navigate("/raspagem/feed/streaming")}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        Ver em Streaming
                    </Button>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                        />
                        Atualizar
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
