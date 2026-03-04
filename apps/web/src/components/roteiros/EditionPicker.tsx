import { useState } from "react";
import { Calendar, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { formatEdition } from "@/types/roteiros";
import { cn } from "@/lib/utils";

interface EditionPickerProps {
    currentDate: string;
    onVisualize: (date: string) => void;
    className?: string;
}

/**
 * Seletor de Edição (Data)
 * Exibe "EDIÇÃO DD/MM/AA" e permite escolher data para visualizar
 */
export const EditionPicker = ({
    currentDate,
    onVisualize,
    className,
}: EditionPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(currentDate);

    const handleVisualize = () => {
        onVisualize(selectedDate);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl",
                        "bg-primary text-primary-foreground font-bold text-lg",
                        "hover:bg-primary-dark transition-colors cursor-pointer",
                        "shadow-md hover:shadow-lg",
                        className
                    )}
                >
                    <Calendar className="w-5 h-5" />
                    {formatEdition(currentDate)}
                    <ChevronDown className="w-4 h-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione a Data</label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <Button
                        className="w-full rounded-lg bg-primary hover:bg-primary-dark"
                        onClick={handleVisualize}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Ir para data
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
