import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusMateria, MateriaStatus, MATERIA_STATUS_CONFIG } from "@/types/roteiros";
import { cn } from "@/lib/utils";
import { StatusIcon, type StatusIconName } from "./StatusIcon";

interface StatusSelectProps {
    value: MateriaStatus;
    onChange: (status: MateriaStatus) => void;
    statusList?: StatusMateria[];
    className?: string;
}

/**
 * Dropdown para seleção de status da matéria com ícones Lucide
 */
export const StatusSelect = ({ value, onChange, statusList, className }: StatusSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Build display config: prefer API data, fallback to hardcoded
    const getConfig = (slug: string) => {
        if (statusList && statusList.length > 0) {
            const found = statusList.find((s) => s.slug === slug);
            if (found) return { label: found.nome, icon: found.icone, color: found.cor || "text-zinc-400" };
        }
        return MATERIA_STATUS_CONFIG[slug] || { label: slug, icon: "circle", color: "text-zinc-400" };
    };

    // Build ordered list
    const orderedStatuses: { slug: string; label: string; icon: string }[] =
        statusList && statusList.length > 0
            ? statusList.map((s) => ({ slug: s.slug, label: s.nome, icon: s.icone }))
            : Object.entries(MATERIA_STATUS_CONFIG).map(([slug, config]) => ({
                slug,
                label: config.label,
                icon: config.icon,
            }));

    const currentConfig = getConfig(value);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 gap-1.5 px-2 font-normal hover:bg-muted/50",
                        className
                    )}
                >
                    <StatusIcon name={currentConfig.icon as StatusIconName} className={cn("w-4 h-4", currentConfig.color)} />
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[160px]">
                {orderedStatuses.map((status) => {
                    const cfg = getConfig(status.slug);
                    return (
                        <DropdownMenuItem
                            key={status.slug}
                            onClick={() => {
                                onChange(status.slug);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                value === status.slug && "bg-muted"
                            )}
                        >
                            <StatusIcon name={status.icon as StatusIconName} className={cn("w-4 h-4", cfg.color)} />
                            <span>{status.label}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
