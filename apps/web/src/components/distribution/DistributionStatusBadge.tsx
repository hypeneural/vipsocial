import { MessageStatus, STATUS_CONFIG } from "@/types/distribution";
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DistributionStatusBadgeProps {
    status: MessageStatus;
    size?: "sm" | "md";
}

const iconMap = {
    pending: Clock,
    sent: CheckCircle,
    failed: XCircle,
    deleted: Trash2,
};

/**
 * Badge de status de envio
 */
export const DistributionStatusBadge = ({
    status,
    size = "md",
}: DistributionStatusBadgeProps) => {
    const config = STATUS_CONFIG[status];
    const Icon = iconMap[status];

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5 gap-1",
        md: "text-sm px-2.5 py-1 gap-1.5",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-3.5 h-3.5",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium",
                config.bgColor,
                config.color,
                sizeClasses[size]
            )}
        >
            <Icon className={iconSizes[size]} />
            <span>{config.label}</span>
        </span>
    );
};
