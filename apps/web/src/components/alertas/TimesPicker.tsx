import { useState } from "react";
import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimesPickerProps {
    value: string[];                   // ["10:00", "14:00"]
    onChange: (value: string[]) => void;
    disabled?: boolean;
    max?: number;
}

/**
 * Seletor de múltiplos horários
 */
export const TimesPicker = ({
    value,
    onChange,
    disabled = false,
    max = 10,
}: TimesPickerProps) => {
    const [newTime, setNewTime] = useState("12:00");

    const addTime = () => {
        if (disabled || value.length >= max) return;
        if (value.includes(newTime)) return;

        const newTimes = [...value, newTime].sort();
        onChange(newTimes);
    };

    const removeTime = (timeToRemove: string) => {
        if (disabled) return;
        onChange(value.filter(t => t !== timeToRemove));
    };

    const formatTimeDisplay = (time: string): string => {
        const [hours, minutes] = time.split(':');
        return `${hours}h${minutes}`;
    };

    return (
        <div className="space-y-3">
            {/* Time Tags */}
            <div className="flex flex-wrap gap-2">
                {value.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                        Nenhum horário definido
                    </span>
                ) : (
                    value.map((time) => (
                        <div
                            key={time}
                            className={cn(
                                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full",
                                "bg-primary/10 text-primary text-sm font-medium"
                            )}
                        >
                            <Clock className="w-3 h-3" />
                            {formatTimeDisplay(time)}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeTime(time)}
                                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Time Input */}
            {!disabled && value.length < max && (
                <div className="flex gap-2">
                    <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-32"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTime}
                        disabled={value.includes(newTime)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                    </Button>
                </div>
            )}

            {value.length >= max && (
                <p className="text-xs text-muted-foreground">
                    Limite máximo de {max} horários atingido
                </p>
            )}
        </div>
    );
};
