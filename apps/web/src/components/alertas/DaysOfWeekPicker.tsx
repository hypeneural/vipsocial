import { cn } from "@/lib/utils";
import { DAY_NAMES } from "@/types/alertas";

interface DaysOfWeekPickerProps {
    value: string;                     // "0111110"
    onChange: (value: string) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
};

/**
 * Seletor de dias da semana
 * Valor em formato binário: "0111110" (Dom-Sáb)
 */
export const DaysOfWeekPicker = ({
    value,
    onChange,
    disabled = false,
    size = "md",
}: DaysOfWeekPickerProps) => {
    const toggleDay = (index: number) => {
        if (disabled) return;
        const chars = value.split('');
        chars[index] = chars[index] === '1' ? '0' : '1';
        onChange(chars.join(''));
    };

    const selectWeekdays = () => {
        onChange("0111110");
    };

    const selectWeekends = () => {
        onChange("1000001");
    };

    const selectAll = () => {
        onChange("1111111");
    };

    const clearAll = () => {
        onChange("0000000");
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                {DAY_NAMES.map((day, index) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(index)}
                        disabled={disabled}
                        className={cn(
                            "rounded-full font-medium transition-all",
                            "border-2 flex items-center justify-center",
                            sizeClasses[size],
                            value[index] === '1'
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {!disabled && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={selectWeekdays}
                        className="text-xs text-primary hover:underline"
                    >
                        Seg a Sex
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                        type="button"
                        onClick={selectWeekends}
                        className="text-xs text-primary hover:underline"
                    >
                        Fins de semana
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs text-primary hover:underline"
                    >
                        Todos
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-primary hover:underline"
                    >
                        Limpar
                    </button>
                </div>
            )}
        </div>
    );
};
