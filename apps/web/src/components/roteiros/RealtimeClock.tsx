import { useRealtimeClock } from "@/hooks/useRealtimeClock";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeClockProps {
    cityName?: string;
    className?: string;
    showDate?: boolean;
}

/**
 * Relógio em tempo real com atualização a cada segundo
 */
export const RealtimeClock = ({
    cityName = "Tijucas",
    className,
    showDate = true,
}: RealtimeClockProps) => {
    const { time, date } = useRealtimeClock(cityName);

    return (
        <div className={cn("flex flex-col items-end", className)}>
            <div className="flex items-center gap-2 text-2xl font-bold tabular-nums text-primary">
                <Clock className="w-5 h-5" />
                {time}
            </div>
            {showDate && (
                <p className="text-xs text-muted-foreground">{date}</p>
            )}
        </div>
    );
};
