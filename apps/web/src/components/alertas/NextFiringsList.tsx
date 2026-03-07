import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { NextFiring } from "@/types/alertas";
import { cn } from "@/lib/utils";

interface NextFiringsListProps {
    firings: NextFiring[];
    className?: string;
    maxItems?: number;
}

/**
 * Lista de próximos disparos de alertas
 */
export const NextFiringsList = ({
    firings,
    className,
    maxItems = 5,
}: NextFiringsListProps) => {
    const displayFirings = firings.slice(0, maxItems);

    if (displayFirings.length === 0) {
        return (
            <div className={cn("bg-muted/50 rounded-xl p-6 text-center", className)}>
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum disparo programado</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {displayFirings.map((firing, index) => (
                <motion.div
                    key={`${firing.alert_id}-${firing.scheduled_time}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                    {/* Time */}
                    <div className="flex items-center gap-2 w-16 flex-shrink-0">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-mono font-medium">{firing.scheduled_time}</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-border" />

                    {/* Alert Info */}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{firing.alert_title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{firing.destination_count} destino(s)</span>
                        </div>
                    </div>

                    {/* Time Until */}
                    <div className={cn(
                        "max-w-[12rem] text-right text-sm font-medium px-3 py-1 rounded-full flex-shrink-0",
                        firing.time_until_ms < 15 * 60 * 1000
                            ? "bg-warning/20 text-warning"
                            : "bg-primary/10 text-primary"
                    )}>
                        {firing.time_until}
                    </div>
                </motion.div>
            ))}

            {firings.length > maxItems && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    +{firings.length - maxItems} mais programados
                </p>
            )}
        </div>
    );
};
