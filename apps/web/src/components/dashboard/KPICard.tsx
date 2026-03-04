import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  delay?: number;
}

const variantStyles = {
  default: "bg-card text-card-foreground border border-border/50",
  primary: "bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-foreground border-none",
  success: "bg-gradient-to-br from-success to-emerald-600 text-success-foreground border-none",
  warning: "bg-gradient-to-br from-warning to-amber-500 text-warning-foreground border-none",
  danger: "bg-gradient-to-br from-destructive to-red-600 text-destructive-foreground border-none",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-white/20 text-white",
  success: "bg-white/20 text-white",
  warning: "bg-black/10 text-black/70",
  danger: "bg-white/20 text-white",
};

const shadowStyles = {
  default: "",
  primary: "shadow-xl shadow-primary/25",
  success: "shadow-xl shadow-success/25",
  warning: "shadow-xl shadow-warning/25",
  danger: "shadow-xl shadow-destructive/25",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  delay = 0,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-2xl p-4 md:p-5 transition-all duration-300 cursor-pointer",
        variantStyles[variant],
        shadowStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              "text-xs md:text-sm font-medium mb-1",
              variant === "default" ? "text-muted-foreground" : "opacity-80"
            )}
          >
            {title}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p
              className={cn(
                "text-xs md:text-sm mt-1",
                variant === "default" ? "text-muted-foreground" : "opacity-70"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className="flex items-center gap-1 mt-2"
            >
              <span
                className={cn(
                  "text-xs md:text-sm font-semibold flex items-center gap-0.5",
                  variant === "default"
                    ? trend.isPositive
                      ? "text-success"
                      : "text-destructive"
                    : "text-white/90"
                )}
              >
                <span className="text-base">{trend.isPositive ? "↑" : "↓"}</span>
                {Math.abs(trend.value)}%
              </span>
              <span
                className={cn(
                  "text-[10px] md:text-xs",
                  variant === "default" ? "text-muted-foreground" : "opacity-60"
                )}
              >
                vs ontem
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.1, type: "spring", stiffness: 200 }}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </motion.div>
      </div>
    </motion.div>
  );
}
