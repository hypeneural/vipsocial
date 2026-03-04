import { MessageCircle, Send, Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { ChannelType, CHANNEL_CONFIG } from "@/types/distribution";
import { cn } from "@/lib/utils";

interface ChannelBadgeProps {
    channel: ChannelType;
    name?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

const iconMap = {
    whatsapp: MessageCircle,
    telegram: Send,
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    email: Mail,
};

/**
 * Badge com ícone e cor do canal
 */
export const ChannelBadge = ({
    channel,
    name,
    size = "md",
    showLabel = true,
}: ChannelBadgeProps) => {
    const config = CHANNEL_CONFIG[channel];
    const Icon = iconMap[channel];

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5 gap-1",
        md: "text-sm px-3 py-1 gap-1.5",
        lg: "text-base px-4 py-1.5 gap-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium",
                config.bgColor,
                sizeClasses[size]
            )}
            style={{ color: config.color }}
        >
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{name || config.label}</span>}
        </span>
    );
};
