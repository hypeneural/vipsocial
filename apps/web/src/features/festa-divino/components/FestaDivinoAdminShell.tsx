import { Link } from "react-router-dom";
import type { ElementType, ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PaginatedResponse } from "@/services/types";
import type { FestaDivinoSection } from "../types";

export type FestaDivinoListQuery<T> = {
    data?: PaginatedResponse<T>;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
};

export type FestaDivinoSectionItem = {
    id: FestaDivinoSection;
    label: string;
    path: string;
    icon: ElementType;
};

export function StatusBadge({ active }: { active: boolean }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600"
            )}
        >
            {active ? "Ativo" : "Inativo"}
        </Badge>
    );
}

export function LoadingRows({ columns }: { columns: number }) {
    return (
        <>
            {[0, 1, 2].map((row) => (
                <TableRow key={row}>
                    {Array.from({ length: columns }).map((_, column) => (
                        <TableCell key={column}>
                            <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-muted" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export function EmptyRows({ columns, label }: { columns: number; label: string }) {
    return (
        <TableRow>
            <TableCell colSpan={columns} className="py-8 text-center text-sm text-muted-foreground">
                {label}
            </TableCell>
        </TableRow>
    );
}

export function DataPanel<T>({
    title,
    description,
    headerAction,
    query,
    columns,
    renderRow,
    emptyLabel = "Nenhum registro encontrado.",
    emptyState,
    rowsOverride,
}: {
    title: string;
    description?: string;
    headerAction?: ReactNode;
    query: FestaDivinoListQuery<T>;
    columns: Array<{ label: string; className?: string }>;
    renderRow: (row: T) => ReactNode;
    emptyLabel?: string;
    emptyState?: ReactNode;
    rowsOverride?: T[];
}) {
    const rows = rowsOverride ?? query.data?.data ?? [];
    const total = rowsOverride ? rows.length : query.data?.meta?.total ?? rows.length;

    return (
        <section className="rounded-lg border border-border/60 bg-card">
            <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold">{title}</h2>
                        <Badge variant="secondary">{total}</Badge>
                    </div>
                    {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                    {headerAction}
                    <Button variant="ghost" size="sm" onClick={() => query.refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar
                    </Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.label} className={column.className}>
                                {column.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {query.isLoading ? <LoadingRows columns={columns.length} /> : null}
                    {!query.isLoading && query.isError ? (
                        <EmptyRows columns={columns.length} label="Falha ao carregar dados." />
                    ) : null}
                    {!query.isLoading && !query.isError && rows.length === 0 && emptyState ? emptyState : null}
                    {!query.isLoading && !query.isError && rows.length === 0 && !emptyState ? (
                        <EmptyRows columns={columns.length} label={emptyLabel} />
                    ) : null}
                    {!query.isLoading && !query.isError ? rows.map(renderRow) : null}
                </TableBody>
            </Table>
        </section>
    );
}

export function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: ElementType }) {
    return (
        <div className="rounded-lg border border-border/60 bg-card p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

export function SectionNav({
    sections,
    activeSection,
}: {
    sections: FestaDivinoSectionItem[];
    activeSection: FestaDivinoSection;
}) {
    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {sections.map((section) => (
                <Link
                    key={section.id}
                    to={section.path}
                    className={cn(
                        "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                        activeSection === section.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                    )}
                >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                </Link>
            ))}
        </div>
    );
}

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Buscar registros"
                className="pl-9"
            />
        </div>
    );
}
