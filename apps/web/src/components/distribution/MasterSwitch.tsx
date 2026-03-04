import { useState } from "react";
import { motion } from "framer-motion";
import { Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasterSwitchProps {
    enabled: boolean;
    message: string;
    onToggle: (enabled: boolean) => Promise<void>;
    loading?: boolean;
}

/**
 * Toggle global grande para ligar/desligar toda a distribuição
 */
export const MasterSwitch = ({
    enabled,
    message,
    onToggle,
    loading = false,
}: MasterSwitchProps) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        if (loading || isToggling) return;
        setIsToggling(true);
        try {
            await onToggle(!enabled);
        } finally {
            setIsToggling(false);
        }
    };

    const isLoading = loading || isToggling;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "rounded-3xl p-8 text-center transition-all duration-500",
                enabled
                    ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30"
                    : "bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30"
            )}
        >
            {/* Big Toggle Button */}
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={cn(
                    "relative w-32 h-32 rounded-full mx-auto mb-6 transition-all duration-300",
                    "flex items-center justify-center",
                    "shadow-2xl hover:scale-105 active:scale-95",
                    enabled
                        ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30"
                        : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30",
                    isLoading && "opacity-70 cursor-not-allowed"
                )}
            >
                {/* Glow effect */}
                <motion.div
                    animate={{
                        scale: enabled ? [1, 1.2, 1] : 1,
                        opacity: enabled ? [0.5, 0.8, 0.5] : 0.3,
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className={cn(
                        "absolute inset-0 rounded-full blur-xl",
                        enabled ? "bg-green-500" : "bg-red-500"
                    )}
                />

                {/* Icon */}
                <div className="relative z-10">
                    {isLoading ? (
                        <Loader2 className="w-16 h-16 text-white animate-spin" />
                    ) : (
                        <Power className="w-16 h-16 text-white" />
                    )}
                </div>
            </button>

            {/* Status Text */}
            <motion.div
                key={enabled ? 'on' : 'off'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className={cn(
                    "text-2xl font-bold mb-2",
                    enabled ? "text-green-500" : "text-red-500"
                )}>
                    {enabled ? "DISTRIBUIÇÃO ATIVA" : "DISTRIBUIÇÃO PAUSADA"}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {message}
                </p>
            </motion.div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground mt-4">
                Clique no botão para {enabled ? "pausar" : "ativar"} a distribuição automática
            </p>
        </motion.div>
    );
};
