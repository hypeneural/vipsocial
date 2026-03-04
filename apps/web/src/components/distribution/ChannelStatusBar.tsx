import { motion } from "framer-motion";
import { MessageCircle, Send, Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Channel, ChannelType, CHANNEL_CONFIG } from "@/types/distribution";
import { cn } from "@/lib/utils";

interface ChannelStatusBarProps {
    channel: Channel;
    onToggle?: (channelId: number, enabled: boolean) => void;
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
 * Barra de status do canal com progresso e toggle
 */
export const ChannelStatusBar = ({
    channel,
    onToggle,
}: ChannelStatusBarProps) => {
    const config = CHANNEL_CONFIG[channel.type];
    const Icon = iconMap[channel.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                channel.enabled
                    ? "bg-card border-border/50"
                    : "bg-muted/30 border-dashed opacity-70"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    config.bgColor
                )}
                style={{ color: config.color }}
            >
                <Icon className="w-5 h-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                        ({channel.destinations_count} destinos)
                    </span>
                </div>

                {/* Progress Bar */}
                {channel.enabled ? (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${channel.success_rate}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: config.color }}
                            />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-12">
                            {channel.success_rate}%
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">Pausado</span>
                )}
            </div>

            {/* Messages Count */}
            {channel.enabled && (
                <div className="text-right">
                    <p className="text-sm font-medium">{channel.messages_today}</p>
                    <p className="text-xs text-muted-foreground">msgs hoje</p>
                </div>
            )}

            {/* Toggle */}
            {onToggle && (
                <Switch
                    checked={channel.enabled}
                    onCheckedChange={(checked) => onToggle(channel.channel_id, checked)}
                />
            )}
        </motion.div>
    );
};
