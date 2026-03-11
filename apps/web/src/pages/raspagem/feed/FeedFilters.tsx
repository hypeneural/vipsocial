import { startTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { FeedView } from "./feed-utils";
import type {
    NewsItemSortBy,
    NewsSortDirection,
    NewsSourceSummary,
} from "@/services/newsRadar.service";

interface FeedFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    city: string;
    onCityChange: (value: string) => void;
    sourceFilter: string;
    onSourceFilterChange: (value: string) => void;
    extractionFilter: string;
    onExtractionFilterChange: (value: string) => void;
    enrichmentFilter: string;
    onEnrichmentFilterChange: (value: string) => void;
    urgencyFilter: string;
    onUrgencyFilterChange: (value: string) => void;
    viewFilter: FeedView;
    onViewFilterChange: (value: FeedView) => void;
    sortBy: NewsItemSortBy;
    onSortByChange: (value: NewsItemSortBy) => void;
    sortDirection: NewsSortDirection;
    onSortDirectionChange: (value: NewsSortDirection) => void;
    sources: NewsSourceSummary[];
    onResetPage: () => void;
    onSetPage: (page: number) => void;
}

export function FeedFilters({
    search,
    onSearchChange,
    city,
    onCityChange,
    sourceFilter,
    onSourceFilterChange,
    extractionFilter,
    onExtractionFilterChange,
    enrichmentFilter,
    onEnrichmentFilterChange,
    urgencyFilter,
    onUrgencyFilterChange,
    viewFilter,
    onViewFilterChange,
    sortBy,
    onSortByChange,
    sortDirection,
    onSortDirectionChange,
    sources,
    onResetPage,
    onSetPage,
}: FeedFiltersProps) {
    return (
        <div className="mb-6 space-y-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="grid gap-3 lg:grid-cols-[2fr,1fr,1fr]">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => {
                            onSearchChange(event.target.value);
                            onResetPage();
                        }}
                        placeholder="Buscar por titulo ou resumo"
                        className="rounded-xl pl-10"
                    />
                </div>

                <Select
                    value={sourceFilter}
                    onValueChange={(value) => {
                        startTransition(() => {
                            onSourceFilterChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as fontes</SelectItem>
                        {sources.map((source) => (
                            <SelectItem key={source.id} value={String(source.id)}>
                                {source.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={viewFilter}
                    onValueChange={(value: FeedView) => onViewFilterChange(value)}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Visao" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tudo</SelectItem>
                        <SelectItem value="duplicates">Duplicados</SelectItem>
                        <SelectItem value="high">Alta relevancia</SelectItem>
                        <SelectItem value="recent">Ultimas 6h</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Select
                    value={sortBy}
                    onValueChange={(value: NewsItemSortBy) => {
                        startTransition(() => {
                            onSortByChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="published_at_utc">Data da noticia</SelectItem>
                        <SelectItem value="created_at">Data da captura</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={sortDirection}
                    onValueChange={(value: NewsSortDirection) => {
                        startTransition(() => {
                            onSortDirectionChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="desc">Mais recente</SelectItem>
                        <SelectItem value="asc">Mais antiga</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={extractionFilter}
                    onValueChange={(value) => {
                        startTransition(() => {
                            onExtractionFilterChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Extracao" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toda extracao</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="extracted">Extraida</SelectItem>
                        <SelectItem value="extraction_failed">Falhou</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={enrichmentFilter}
                    onValueChange={(value) => {
                        startTransition(() => {
                            onEnrichmentFilterChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="IA" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toda IA</SelectItem>
                        <SelectItem value="none">Sem IA</SelectItem>
                        <SelectItem value="enriched_l1">Enriquecida L1</SelectItem>
                        <SelectItem value="enriched_l2">Enriquecida L2</SelectItem>
                        <SelectItem value="enrichment_failed">IA falhou</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={urgencyFilter}
                    onValueChange={(value) => {
                        startTransition(() => {
                            onUrgencyFilterChange(value);
                            onSetPage(1);
                        });
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Urgencia" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Qualquer urgencia</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    value={city}
                    onChange={(event) => {
                        onCityChange(event.target.value);
                        onResetPage();
                    }}
                    placeholder="Cidade exata da IA"
                    className="rounded-xl"
                />
            </div>
        </div>
    );
}
