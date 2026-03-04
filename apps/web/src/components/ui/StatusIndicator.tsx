import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "loading";
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    color: "bg-success",
    label: "Online",
    pulse: true,
  },
  offline: {
    color: "bg-destructive",
    label: "Offline",
    pulse: false,
  },
  warning: {
    color: "bg-warning",
    label: "Atenção",
    pulse: true,
  },
  loading: {
    color: "bg-info",
    label: "Carregando",
    pulse: true,
  },
};

const sizeConfig = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export function StatusIndicator({
  status,
  label,
  size = "md",
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            "rounded-full",
            sizeConfig[size],
            config.color
          )}
        />
        {config.pulse && (
          <motion.span
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute rounded-full",
              sizeConfig[size],
              config.color,
              "opacity-50"
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {label || config.label}
        </span>
      )}
    </div>
  );
}
