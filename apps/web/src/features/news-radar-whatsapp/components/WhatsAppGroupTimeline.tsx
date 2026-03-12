import { Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WhatsAppTimelineEvent } from "@/features/news-radar-whatsapp/types";
import { WhatsAppTimelineMessageRow } from "@/features/news-radar-whatsapp/components/WhatsAppTimelineMessageRow";

interface WhatsAppGroupTimelineProps {
    events: WhatsAppTimelineEvent[];
    isLoading: boolean;
    isError?: boolean;
    errorMessage?: string | null;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onFetchNextPage: () => void;
    selectedEventIds: number[];
    onToggleSelect: (eventId: number, checked: boolean) => void;
    onIgnore: (eventId: number) => void;
    onUnignore: (eventId: number) => void;
    onStar: (eventId: number) => void;
    onUnstar: (eventId: number) => void;
    onMarkReviewed: (eventId: number) => void;
}

export function WhatsAppGroupTimeline({
    events,
    isLoading,
    isError = false,
    errorMessage,
    hasNextPage,
    isFetchingNextPage,
    onFetchNextPage,
    selectedEventIds,
    onToggleSelect,
    onIgnore,
    onUnignore,
    onStar,
    onUnstar,
    onMarkReviewed,
}: WhatsAppGroupTimelineProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-warning/40 bg-warning/5 p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-warning/10 text-warning">
                    <Inbox className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                    Nao foi possivel carregar a timeline
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {errorMessage || "Atualize a timeline e tente novamente."}
                </p>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                    <Inbox className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Nenhuma mensagem nesta faixa</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Ajuste a busca, troque o filtro ou aguarde novas mensagens chegarem ao grupo monitorado.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {hasNextPage ? (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onFetchNextPage}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Carregando anteriores...
                            </>
                        ) : (
                            "Carregar mensagens anteriores"
                        )}
                    </Button>
                </div>
            ) : null}

            {events.map((event) => (
                <WhatsAppTimelineMessageRow
                    key={event.id}
                    event={event}
                    checked={selectedEventIds.includes(event.id)}
                    onToggleSelect={onToggleSelect}
                    onIgnore={onIgnore}
                    onUnignore={onUnignore}
                    onStar={onStar}
                    onUnstar={onUnstar}
                    onMarkReviewed={onMarkReviewed}
                />
            ))}
        </div>
    );
}
