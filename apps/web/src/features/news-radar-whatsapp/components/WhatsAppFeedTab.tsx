import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCheck,
    Filter,
    MessageCircleMore,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreateWhatsAppBundleDialog } from "@/features/news-radar-whatsapp/components/CreateWhatsAppBundleDialog";
import { WhatsAppBundleSheet } from "@/features/news-radar-whatsapp/components/WhatsAppBundleSheet";
import { WhatsAppBundlesPanel } from "@/features/news-radar-whatsapp/components/WhatsAppBundlesPanel";
import { WhatsAppGroupSidebar } from "@/features/news-radar-whatsapp/components/WhatsAppGroupSidebar";
import { WhatsAppGroupTimeline } from "@/features/news-radar-whatsapp/components/WhatsAppGroupTimeline";
import { WhatsAppSelectionBar } from "@/features/news-radar-whatsapp/components/WhatsAppSelectionBar";
import {
    useCreateWhatsAppNewsBundle,
    useIgnoreWhatsAppEvent,
    useInfiniteWhatsAppGroupTimeline,
    useMarkWhatsAppEventReviewed,
    useMarkWhatsAppGroupAsRead,
    useStarWhatsAppEvent,
    useUnignoreWhatsAppEvent,
    useUnstarWhatsAppEvent,
    useWhatsAppGroupSummary,
    useWhatsAppNewsBundles,
    useWhatsAppNewsGroups,
} from "@/features/news-radar-whatsapp/hooks/useNewsRadarWhatsApp";
import type { WhatsAppTimelineEvent } from "@/features/news-radar-whatsapp/types";
import {
    compareTimelineEventsAsc,
    formatWhatsAppDateTime,
} from "@/features/news-radar-whatsapp/utils/formatters";

const MESSAGE_KIND_OPTIONS = [
    { value: "all", label: "Todos os tipos" },
    { value: "text", label: "Texto" },
    { value: "image", label: "Imagem" },
    { value: "video", label: "Video" },
    { value: "document", label: "Documento" },
    { value: "audio", label: "Audio" },
];

export function WhatsAppFeedTab() {
    const [selectedGroupFk, setSelectedGroupFk] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [messageKind, setMessageKind] = useState("all");
    const [includeIgnored, setIncludeIgnored] = useState(false);
    const [createBundleOpen, setCreateBundleOpen] = useState(false);
    const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
    const [bundleSheetOpen, setBundleSheetOpen] = useState(false);
    const [selectedEventIdsByGroup, setSelectedEventIdsByGroup] = useState<
        Record<string, number[]>
    >({});

    const groupsQuery = useWhatsAppNewsGroups();
    const groupSummaryQuery = useWhatsAppGroupSummary(selectedGroupFk ?? undefined);
    const bundlesQuery = useWhatsAppNewsBundles(
        selectedGroupFk ? { group_fk: selectedGroupFk } : {},
        Boolean(selectedGroupFk),
    );
    const timelineQuery = useInfiniteWhatsAppGroupTimeline(
        selectedGroupFk ?? undefined,
        {
            search: search || undefined,
            message_kind: messageKind === "all" ? undefined : messageKind,
            include_ignored: includeIgnored,
            per_page: 30,
        },
        Boolean(selectedGroupFk),
    );

    const markAsReadMutation = useMarkWhatsAppGroupAsRead();
    const ignoreMutation = useIgnoreWhatsAppEvent();
    const unignoreMutation = useUnignoreWhatsAppEvent();
    const starMutation = useStarWhatsAppEvent();
    const unstarMutation = useUnstarWhatsAppEvent();
    const markReviewedMutation = useMarkWhatsAppEventReviewed();
    const createBundleMutation = useCreateWhatsAppNewsBundle();

    const groups = groupsQuery.data?.data ?? [];
    const bundles = bundlesQuery.data?.data ?? [];

    useEffect(() => {
        if (groups.length === 0) {
            setSelectedGroupFk(null);
            return;
        }

        if (!selectedGroupFk || !groups.some((group) => group.whatsapp_group_fk === selectedGroupFk)) {
            setSelectedGroupFk(groups[0].whatsapp_group_fk);
        }
    }, [groups, selectedGroupFk]);

    const timelinePages = timelineQuery.data?.pages ?? [];
    const timelineEvents = timelinePages
        .flatMap((page) => page.data)
        .slice()
        .sort(compareTimelineEventsAsc);

    const selectedEventIds = selectedGroupFk
        ? selectedEventIdsByGroup[selectedGroupFk] ?? []
        : [];

    const latestVisibleEvent = timelinePages
        .flatMap((page) => page.data)
        .slice()
        .sort((left, right) => compareTimelineEventsAsc(right, left))[0];

    const selectedGroup = groups.find((group) => group.whatsapp_group_fk === selectedGroupFk);
    const isRefreshing =
        groupsQuery.isFetching ||
        groupSummaryQuery.isFetching ||
        timelineQuery.isFetching ||
        bundlesQuery.isFetching;

    const refreshAll = () => {
        groupsQuery.refetch();

        if (selectedGroupFk) {
            groupSummaryQuery.refetch();
            timelineQuery.refetch();
            bundlesQuery.refetch();
        }
    };

    const setSelectedEventIds = (groupFk: string, updater: (current: number[]) => number[]) => {
        setSelectedEventIdsByGroup((current) => ({
            ...current,
            [groupFk]: updater(current[groupFk] ?? []),
        }));
    };

    const toggleSelect = (eventId: number, checked: boolean) => {
        if (!selectedGroupFk) {
            return;
        }

        setSelectedEventIds(selectedGroupFk, (current) => {
            const next = new Set(current);

            if (checked) {
                next.add(eventId);
            } else {
                next.delete(eventId);
            }

            return Array.from(next.values());
        });
    };

    const clearSelection = () => {
        if (!selectedGroupFk) {
            return;
        }

        setSelectedEventIds(selectedGroupFk, () => []);
    };

    const removeSelectedEventId = (eventId: number) => {
        if (!selectedGroupFk) {
            return;
        }

        setSelectedEventIds(selectedGroupFk, (current) =>
            current.filter((currentId) => currentId !== eventId),
        );
    };

    const handleCreateBundle = async (title: string) => {
        if (!selectedGroupFk || selectedEventIds.length === 0) {
            return;
        }

        const response = await createBundleMutation.mutateAsync({
            group_fk: selectedGroupFk,
            title: title || undefined,
            creation_mode: "manual_selection",
            event_ids: selectedEventIds,
        });

        clearSelection();
        setCreateBundleOpen(false);
        setSelectedBundleId(response.data.id);
        setBundleSheetOpen(true);
    };

    const applyEventMutation = (
        eventId: number,
        mutation: (payload: { groupFk: string; eventId: number }) => void,
    ) => {
        if (!selectedGroupFk) {
            return;
        }

        mutation({ groupFk: selectedGroupFk, eventId });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-success" />
                            <h2 className="text-xl font-bold md:text-2xl">
                                Timeline de grupos WhatsApp
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Grupo, timeline, selecao manual e bundle no mesmo fluxo editorial.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={refreshAll}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                        Atualizar timeline
                    </Button>
                </div>
            </motion.div>

            <div className="grid gap-4 xl:grid-cols-[300px,minmax(0,1fr),360px]">
                <div className="space-y-4">
                    <WhatsAppGroupSidebar
                        groups={groups}
                        selectedGroupFk={selectedGroupFk}
                        isLoading={groupsQuery.isLoading}
                        isRefreshing={groupsQuery.isFetching}
                        onRefresh={() => groupsQuery.refetch()}
                        onSelectGroup={setSelectedGroupFk}
                    />
                </div>

                <div className="min-w-0 space-y-4">
                    <Card className="rounded-3xl border-border/60">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-foreground">
                                            {groupSummaryQuery.data?.data.group?.label ||
                                                selectedGroup?.group?.default_label ||
                                                selectedGroup?.group?.name ||
                                                "Selecione um grupo"}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {groupSummaryQuery.data?.data.group?.description ||
                                                "A timeline cronologica do grupo aparece aqui com contexto e selecao manual."}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl"
                                            disabled={!selectedGroupFk || !latestVisibleEvent || markAsReadMutation.isPending}
                                            onClick={() => {
                                                if (!selectedGroupFk || !latestVisibleEvent) {
                                                    return;
                                                }

                                                markAsReadMutation.mutate({
                                                    groupFk: selectedGroupFk,
                                                    lastSeenEventId: latestVisibleEvent.id,
                                                });
                                            }}
                                        >
                                            <CheckCheck className="mr-2 h-4 w-4" />
                                            Marcar grupo como lido
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-4">
                                    <div className="rounded-2xl border border-border/50 bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">
                                            {groupSummaryQuery.data?.data.stats.total_events ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-success/30 bg-success/10 p-3">
                                        <p className="text-xs text-success">Nao lidas</p>
                                        <p className="mt-1 text-lg font-semibold text-success">
                                            {groupSummaryQuery.data?.data.stats.unread_count ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3">
                                        <p className="text-xs text-warning">Ignoradas</p>
                                        <p className="mt-1 text-lg font-semibold text-warning">
                                            {groupSummaryQuery.data?.data.stats.ignored_count ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-info/30 bg-info/10 p-3">
                                        <p className="text-xs text-info">Destacadas</p>
                                        <p className="mt-1 text-lg font-semibold text-info">
                                            {groupSummaryQuery.data?.data.stats.starred_count ?? 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px,180px]">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Buscar na timeline
                                        </label>
                                        <Input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            className="rounded-xl"
                                            placeholder="Texto, remetente, telefone ou link"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Tipo de mensagem
                                        </label>
                                        <Select value={messageKind} onValueChange={setMessageKind}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Todos os tipos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESSAGE_KIND_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end">
                                        <label className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
                                            <Checkbox
                                                checked={includeIgnored}
                                                onCheckedChange={(value) => setIncludeIgnored(value === true)}
                                            />
                                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                                <Filter className="h-4 w-4 text-muted-foreground" />
                                                Incluir ignoradas
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <WhatsAppGroupTimeline
                        events={timelineEvents}
                        isLoading={timelineQuery.isLoading}
                        isError={timelineQuery.isError}
                        errorMessage={timelineQuery.error?.message ?? null}
                        hasNextPage={Boolean(timelineQuery.hasNextPage)}
                        isFetchingNextPage={timelineQuery.isFetchingNextPage}
                        onFetchNextPage={() => timelineQuery.fetchNextPage()}
                        selectedEventIds={selectedEventIds}
                        onToggleSelect={toggleSelect}
                        onIgnore={(eventId) => {
                            removeSelectedEventId(eventId);
                            applyEventMutation(eventId, (payload) => ignoreMutation.mutate(payload));
                        }}
                        onUnignore={(eventId) =>
                            applyEventMutation(eventId, (payload) => unignoreMutation.mutate(payload))
                        }
                        onStar={(eventId) =>
                            applyEventMutation(eventId, (payload) => starMutation.mutate(payload))
                        }
                        onUnstar={(eventId) =>
                            applyEventMutation(eventId, (payload) => unstarMutation.mutate(payload))
                        }
                        onMarkReviewed={(eventId) =>
                            applyEventMutation(eventId, (payload) =>
                                markReviewedMutation.mutate(payload),
                            )
                        }
                    />
                </div>

                <div className="space-y-4">
                    <Card className="rounded-3xl border-border/60">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                                    <MessageCircleMore className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Estado operacional do grupo
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ultimo evento visivel em{" "}
                                        {formatWhatsAppDateTime(
                                            groupSummaryQuery.data?.data.stats.latest_event_at,
                                        )}
                                        .
                                    </p>
                                </div>
                            </div>

                            {groupSummaryQuery.data?.data.last_seen_event_at ? (
                                <p className="mt-4 rounded-2xl border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                                    Ultimo ponto visto em{" "}
                                    {formatWhatsAppDateTime(
                                        groupSummaryQuery.data.data.last_seen_event_at,
                                    )}
                                    .
                                </p>
                            ) : null}

                            {timelineEvents.some((event) => event.is_deleted) ? (
                                <p className="mt-3 inline-flex items-center gap-2 text-xs text-warning">
                                    <AlertTriangle className="h-4 w-4" />
                                    Ha mensagens removidas ou alteradas na origem nesta janela.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <WhatsAppBundlesPanel
                        bundles={bundles}
                        isLoading={bundlesQuery.isLoading}
                        onOpenBundle={(bundleId) => {
                            setSelectedBundleId(bundleId);
                            setBundleSheetOpen(true);
                        }}
                    />
                </div>
            </div>

            <WhatsAppSelectionBar
                selectedCount={selectedEventIds.length}
                isCreatingBundle={createBundleMutation.isPending}
                onClearSelection={clearSelection}
                onCreateBundle={() => setCreateBundleOpen(true)}
            />

            <CreateWhatsAppBundleDialog
                open={createBundleOpen}
                groupName={
                    groupSummaryQuery.data?.data.group?.label ||
                    selectedGroup?.group?.default_label ||
                    selectedGroup?.group?.name
                }
                selectedCount={selectedEventIds.length}
                isSubmitting={createBundleMutation.isPending}
                onOpenChange={setCreateBundleOpen}
                onSubmit={handleCreateBundle}
            />

            <WhatsAppBundleSheet
                open={bundleSheetOpen}
                bundleId={selectedBundleId}
                onOpenChange={setBundleSheetOpen}
            />
        </>
    );
}
