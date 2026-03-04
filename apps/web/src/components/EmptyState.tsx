import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    size?: "sm" | "md" | "lg";
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    size = "md",
}: EmptyStateProps) {
    const sizes = {
        sm: {
            container: "py-8",
            iconWrapper: "w-16 h-16",
            icon: "w-8 h-8",
            title: "text-base",
            description: "text-sm",
        },
        md: {
            container: "py-12",
            iconWrapper: "w-24 h-24",
            icon: "w-12 h-12",
            title: "text-lg",
            description: "text-sm",
        },
        lg: {
            container: "py-16",
            iconWrapper: "w-32 h-32",
            icon: "w-16 h-16",
            title: "text-xl",
            description: "text-base",
        },
    };

    const s = sizes[size];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col items-center ${s.container}`}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className={`${s.iconWrapper} bg-muted/50 rounded-full flex items-center justify-center mb-4`}
            >
                <Icon className={`${s.icon} text-muted-foreground/50`} />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`${s.title} font-semibold text-foreground mb-1`}
            >
                {title}
            </motion.h3>

            {description && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className={`${s.description} text-muted-foreground text-center max-w-sm px-4`}
                >
                    {description}
                </motion.p>
            )}

            {actionLabel && onAction && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                >
                    <Button onClick={onAction} className="rounded-xl">
                        {actionLabel}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

export default EmptyState;
