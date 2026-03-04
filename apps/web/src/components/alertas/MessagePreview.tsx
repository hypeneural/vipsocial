import { formatWhatsAppMessage } from "@/types/alertas";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
    message: string;
    className?: string;
}

/**
 * Preview de mensagem estilo WhatsApp
 * Suporta *bold*, _italic_, ~strikethrough~, \n
 */
export const MessagePreview = ({ message, className }: MessagePreviewProps) => {
    const formattedMessage = formatWhatsAppMessage(message);
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={cn("max-w-sm", className)}>
            {/* WhatsApp-style container */}
            <div className="bg-[#0b141a] rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">VIP</span>
                    </div>
                    <div>
                        <p className="text-white font-medium text-sm">VIP Social</p>
                        <p className="text-gray-400 text-xs">online agora</p>
                    </div>
                </div>

                {/* Message Bubble */}
                <div className="relative">
                    <div className="bg-[#005c4b] rounded-lg rounded-tl-none p-3 max-w-[85%]">
                        {/* Message Content */}
                        <div
                            className="text-white text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formattedMessage }}
                        />

                        {/* Time & Check */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-gray-300">{timeString}</span>
                            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 16 15" fill="currentColor">
                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.033l-.378.323a.32.32 0 0 0 .027.468l1.36 1.232c.148.134.378.134.526 0l6.045-5.485a.365.365 0 0 0 .063-.51l-.378-.373a.365.365 0 0 0-.51-.063L9.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.033l-.378.323" />
                            </svg>
                        </div>
                    </div>

                    {/* Tail */}
                    <div className="absolute -left-2 top-0">
                        <svg width="8" height="13" viewBox="0 0 8 13" fill="#005c4b">
                            <path d="M5.188 0H0v13L8 1.875C6.5.75 5.188 0 5.188 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <p className="text-xs text-muted-foreground mt-2 text-center">
                Preview da mensagem no WhatsApp
            </p>
        </div>
    );
};
