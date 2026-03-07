import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Destination, formatPhoneNumber } from "@/types/alertas";
import { cn } from "@/lib/utils";

interface DestinationSelectorProps {
    destinations: Destination[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
}

/**
 * Multi-select de destinos com filtro por tags
 */
export const DestinationSelector = ({
    destinations,
    selectedIds,
    onChange,
    disabled = false,
}: DestinationSelectorProps) => {
    const [search, setSearch] = useState("");
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    // Coleta todas as tags únicas
    const allTags = Array.from(
        new Set(destinations.flatMap(d => d.tags))
    ).sort();

    // Filtra destinos
    const filteredDestinations = destinations.filter(dest => {
        if (!dest.active && !selectedIds.includes(dest.destination_id)) return false;
        if (search && !dest.name.toLowerCase().includes(search.toLowerCase()) &&
            !dest.phone_number.includes(search)) return false;
        if (tagFilter && !dest.tags.includes(tagFilter)) return false;
        return true;
    });

    const toggleDestination = (id: number) => {
        if (disabled) return;
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        const allIds = filteredDestinations.map(d => d.destination_id);
        onChange(allIds);
    };

    const clearAll = () => {
        onChange([]);
    };

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar destino..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        disabled={disabled}
                    />
                </div>
                <select
                    value={tagFilter || ""}
                    onChange={(e) => setTagFilter(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg bg-background text-sm"
                    disabled={disabled}
                >
                    <option value="">Todas as tags</option>
                    {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={disabled}
                >
                    Selecionar Todos ({filteredDestinations.length})
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={disabled || selectedIds.length === 0}
                >
                    Limpar Seleção
                </Button>
                <span className="text-sm text-muted-foreground ml-2 py-1">
                    {selectedIds.length} selecionado(s)
                </span>
            </div>

            {/* Destination List */}
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {filteredDestinations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        Nenhum destino encontrado
                    </div>
                ) : (
                    filteredDestinations.map(dest => (
                        <label
                            key={dest.destination_id}
                            className={cn(
                                "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                                "hover:bg-muted/50",
                                selectedIds.includes(dest.destination_id) && "bg-primary/5",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                    selectedIds.includes(dest.destination_id)
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground"
                                )}
                            >
                                {selectedIds.includes(dest.destination_id) && (
                                    <Check className="w-3 h-3" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{dest.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatPhoneNumber(dest.phone_number)}
                                </p>
                            </div>

                            {dest.tags.length > 0 && (
                                <div className="flex gap-1 flex-shrink-0">
                                    {dest.tags.slice(0, 2).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {dest.tags.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{dest.tags.length - 2}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            <input
                                type="checkbox"
                                checked={selectedIds.includes(dest.destination_id)}
                                onChange={() => toggleDestination(dest.destination_id)}
                                className="sr-only"
                                disabled={disabled}
                            />
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};
