import { motion } from "framer-motion";
import { FileText, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateTimeRemaining, PROGRAM_DURATION_DISPLAY } from "@/types/roteiros";

interface StatisticsCardsProps {
    totalItems: number;
    totalDuration: string;
    className?: string;
}

/**
 * Cards de estatísticas do roteiro
 * Exibe: Total de matérias, Duração total, Tempo restante
 */
export const StatisticsCards = ({
    totalItems,
    totalDuration,
    className,
}: StatisticsCardsProps) => {
    const timeRemaining = calculateTimeRemaining(totalDuration);

    return (
        <div className={cn("grid grid-cols-3 gap-4", className)}>
            {/* Total de Matérias */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border/50 p-4 text-center"
            >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                    <FileText className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total de Matérias</p>
            </motion.div>

            {/* Duração Total */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border/50 p-4 text-center"
            >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-info/10 mb-3">
                    <Clock className="w-6 h-6 text-info" />
                </div>
                <p className="text-3xl font-bold tabular-nums text-foreground">{totalDuration}</p>
                <p className="text-sm text-muted-foreground">
                    Duração Total <span className="text-xs">(de {PROGRAM_DURATION_DISPLAY})</span>
                </p>
            </motion.div>

            {/* Tempo Restante */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                    "rounded-2xl border p-4 text-center",
                    timeRemaining.isOver
                        ? "bg-destructive/10 border-destructive/30"
                        : "bg-success/10 border-success/30"
                )}
            >
                <div
                    className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3",
                        timeRemaining.isOver ? "bg-destructive/20" : "bg-success/20"
                    )}
                >
                    <Timer
                        className={cn(
                            "w-6 h-6",
                            timeRemaining.isOver ? "text-destructive" : "text-success"
                        )}
                    />
                </div>
                <p
                    className={cn(
                        "text-3xl font-bold tabular-nums",
                        timeRemaining.isOver ? "text-destructive" : "text-success"
                    )}
                >
                    {timeRemaining.display}
                </p>
                <p className="text-sm text-muted-foreground">
                    {timeRemaining.isOver ? "Tempo Excedido" : "Tempo Restante"}
                </p>
            </motion.div>
        </div>
    );
};
