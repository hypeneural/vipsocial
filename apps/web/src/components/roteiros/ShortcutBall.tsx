import { cn } from "@/lib/utils";

interface ShortcutBallProps {
    shortcut: string;
    isHighlighted?: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
    className?: string;
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
};

/**
 * Badge circular para exibir atalho de teclado (F1, F2, etc.)
 */
export const ShortcutBall = ({
    shortcut,
    isHighlighted = false,
    size = "md",
    onClick,
    className,
}: ShortcutBallProps) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center rounded-full",
                "border-2 font-bold transition-all duration-300",
                "select-none cursor-default",
                sizeClasses[size],
                isHighlighted
                    ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg animate-pulse"
                    : "bg-white text-primary border-primary/70 hover:border-primary",
                onClick && "cursor-pointer hover:scale-105",
                className
            )}
        >
            {shortcut}
        </div>
    );
};
