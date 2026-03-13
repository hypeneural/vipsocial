import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppFeedTab } from "@/features/news-radar-whatsapp/components/WhatsAppFeedTab";

vi.mock("@/features/news-radar-whatsapp/api/newsRadarWhatsApp.service", () => ({
    default: {
        starEvent: vi.fn().mockResolvedValue({ success: true }),
        ignoreEvent: vi.fn().mockResolvedValue({ success: true }),
        markEventReviewed: vi.fn().mockResolvedValue({ success: true }),
    },
}));

vi.mock("@/features/news-radar-whatsapp/hooks/useNewsRadarWhatsApp", () => ({
    useWhatsAppNewsGroups: vi.fn(),
    useWhatsAppGroupSummary: vi.fn(),
    useWhatsAppNewsBundles: vi.fn(),
    useInfiniteWhatsAppGroupTimeline: vi.fn(),
    useMarkWhatsAppGroupAsRead: vi.fn(),
    useIgnoreWhatsAppEvent: vi.fn(),
    useUnignoreWhatsAppEvent: vi.fn(),
    useStarWhatsAppEvent: vi.fn(),
    useUnstarWhatsAppEvent: vi.fn(),
    useMarkWhatsAppEventReviewed: vi.fn(),
    useCreateWhatsAppNewsBundle: vi.fn(),
    useWhatsAppNewsBundle: vi.fn(),
    usePreviewWhatsAppBundleMarkdown: vi.fn(),
    useUpdateWhatsAppNewsBundle: vi.fn(),
    useRemoveWhatsAppNewsBundleItem: vi.fn(),
    useDuplicateWhatsAppBundle: vi.fn(),
    useExportWhatsAppBundleMarkdown: vi.fn(),
    useSetWhatsAppBundleStar: vi.fn(),
    useArchiveWhatsAppBundle: vi.fn(),
    useReopenWhatsAppBundle: vi.fn(),
    usePromoteWhatsAppBundle: vi.fn(),
    getBundleStatusLabel: (status: string) => status,
}));

vi.mock("@/features/ai-prompts/components/AiPromptComposerProvider", () => ({
    useAiPromptComposer: () => ({
        openComposer: vi.fn(),
        openBundleComposer: vi.fn(),
        closeComposer: vi.fn(),
    }),
}));

import {
    useArchiveWhatsAppBundle,
    useCreateWhatsAppNewsBundle,
    useDuplicateWhatsAppBundle,
    useExportWhatsAppBundleMarkdown,
    useIgnoreWhatsAppEvent,
    useInfiniteWhatsAppGroupTimeline,
    useMarkWhatsAppEventReviewed,
    useMarkWhatsAppGroupAsRead,
    usePromoteWhatsAppBundle,
    usePreviewWhatsAppBundleMarkdown,
    useReopenWhatsAppBundle,
    useRemoveWhatsAppNewsBundleItem,
    useSetWhatsAppBundleStar,
    useStarWhatsAppEvent,
    useUnignoreWhatsAppEvent,
    useUpdateWhatsAppNewsBundle,
    useWhatsAppNewsBundle,
    useUnstarWhatsAppEvent,
    useWhatsAppGroupSummary,
    useWhatsAppNewsBundles,
    useWhatsAppNewsGroups,
} from "@/features/news-radar-whatsapp/hooks/useNewsRadarWhatsApp";

const group = {
    id: 1,
    whatsapp_group_fk: "group-1",
    is_active: true,
    sort_order: 1,
    label_override: null,
    notification_mode: null,
    last_seen_event_id: null,
    last_seen_event_at: null,
    group: {
        id: "group-1",
        group_id: "554888120076-1374521846",
        provider: "zapi",
        provider_group_id: "554888120076-1374521846",
        name: "PRF SC Imprensa",
        default_label: "PRF SC Imprensa",
        news_ingest_enabled: true,
        allow_media_download: true,
    },
    stats: {
        unread_count: 3,
        latest_event_at: "2026-03-12T18:00:00Z",
        latest_event_preview: "Preview lateral da PRF",
    },
};

const summary = {
    whatsapp_group_fk: "group-1",
    last_seen_event_id: null,
    last_seen_event_at: null,
    group: {
        id: "group-1",
        group_id: "554888120076-1374521846",
        name: "PRF SC Imprensa",
        label: "PRF SC Imprensa",
        description: "Fluxo de imprensa da PRF SC",
    },
    stats: {
        total_events: 1,
        unread_count: 3,
        ignored_count: 0,
        starred_count: 0,
        latest_event_at: "2026-03-12T18:00:00Z",
    },
};

const olderEvent = {
    id: 101,
    provider: "zapi",
    instance_id: "instance-1",
    message_id: "message-1",
    group_id_raw: "554888120076-1374521846",
    chat_name: "PRF SC Imprensa",
    message_kind: "text",
    processing_status: "ready",
    ignored_reason: null,
    download_status: "skipped",
    participant_phone: "5548999999999",
    participant_lid: null,
    sender_name: "Assessoria PRF",
    sender_photo: null,
    reference_message_id: null,
    reply_to_message_id: null,
    text_message: "Release principal da PRF",
    text_title: null,
    text_description: null,
    link_url: null,
    has_media: false,
    has_caption: false,
    is_deleted: false,
    is_forwarded: false,
    sent_at: "2026-03-12T18:00:00Z",
    received_at: "2026-03-12T18:00:01Z",
    edited_at: null,
    editorial_state: "new" as const,
    user_state: {
        is_ignored: false,
        is_starred: false,
        reviewed_at: null,
        last_seen_at: null,
    },
    media: [],
};

const newerEvent = {
    ...olderEvent,
    id: 102,
    message_id: "message-2",
    text_message: "Atualizacao mais recente da PRF",
    sent_at: "2026-03-12T18:05:00Z",
    received_at: "2026-03-12T18:05:01Z",
};

const bundle = {
    id: 91,
    whatsapp_group_fk: "group-1",
    status: "open" as const,
    creation_mode: "manual_selection" as const,
    assigned_to: null,
    title: "Agrupamento PRF",
    headline_draft: null,
    subheadline_draft: null,
    lead_draft: null,
    summary: null,
    origin_summary: null,
    notes: null,
    editorial_notes: null,
    promotion_notes: null,
    city: null,
    urgency: null,
    category: null,
    categories_json: null,
    is_starred: false,
    cover_media_id: null,
    lock_version: 1,
    message_count: 1,
    media_count: 0,
    primary_sender_name: "Assessoria PRF",
    has_updated_source_messages: false,
    first_message_at: "2026-03-12T18:00:00Z",
    last_message_at: "2026-03-12T18:00:00Z",
    review_started_at: null,
    promoted_at: null,
    archived_at: null,
    created_at: "2026-03-12T18:00:00Z",
    updated_at: "2026-03-12T18:00:00Z",
};

describe("WhatsAppFeedTab", () => {
    const renderWithClient = () => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        return render(
            <QueryClientProvider client={client}>
                <WhatsAppFeedTab />
            </QueryClientProvider>,
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useWhatsAppNewsGroups).mockReturnValue({
            data: { data: [group] },
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
        } as ReturnType<typeof useWhatsAppNewsGroups>);

        vi.mocked(useWhatsAppGroupSummary).mockReturnValue({
            data: { data: summary },
            isFetching: false,
            refetch: vi.fn(),
        } as ReturnType<typeof useWhatsAppGroupSummary>);

        vi.mocked(useWhatsAppNewsBundles).mockReturnValue({
            data: { data: [bundle] },
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
        } as ReturnType<typeof useWhatsAppNewsBundles>);

        vi.mocked(useInfiniteWhatsAppGroupTimeline).mockReturnValue({
            data: {
                pages: [
                    {
                        data: [olderEvent, newerEvent],
                        meta: {
                            per_page: 30,
                            next_cursor: null,
                            prev_cursor: null,
                            has_more_pages: false,
                        },
                    },
                ],
            },
            isLoading: false,
            isError: false,
            error: null,
            isFetching: false,
            isFetchingNextPage: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
        } as ReturnType<typeof useInfiniteWhatsAppGroupTimeline>);

        vi.mocked(useMarkWhatsAppGroupAsRead).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useMarkWhatsAppGroupAsRead>);

        vi.mocked(useIgnoreWhatsAppEvent).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useIgnoreWhatsAppEvent>);

        vi.mocked(useUnignoreWhatsAppEvent).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useUnignoreWhatsAppEvent>);

        vi.mocked(useStarWhatsAppEvent).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useStarWhatsAppEvent>);

        vi.mocked(useUnstarWhatsAppEvent).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useUnstarWhatsAppEvent>);

        vi.mocked(useMarkWhatsAppEventReviewed).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useMarkWhatsAppEventReviewed>);

        vi.mocked(useCreateWhatsAppNewsBundle).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useCreateWhatsAppNewsBundle>);

        vi.mocked(useWhatsAppNewsBundle).mockReturnValue({
            data: { data: bundle },
            isLoading: false,
        } as ReturnType<typeof useWhatsAppNewsBundle>);

        vi.mocked(usePreviewWhatsAppBundleMarkdown).mockReturnValue({
            data: {
                data: {
                    bundle_id: bundle.id,
                    lock_version: bundle.lock_version,
                    markdown_text: "# Preview",
                    markdown_hash: "hash",
                },
            },
            isLoading: false,
        } as ReturnType<typeof usePreviewWhatsAppBundleMarkdown>);

        vi.mocked(useUpdateWhatsAppNewsBundle).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useUpdateWhatsAppNewsBundle>);

        vi.mocked(useRemoveWhatsAppNewsBundleItem).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useRemoveWhatsAppNewsBundleItem>);

        vi.mocked(useDuplicateWhatsAppBundle).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useDuplicateWhatsAppBundle>);

        vi.mocked(useExportWhatsAppBundleMarkdown).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useExportWhatsAppBundleMarkdown>);

        vi.mocked(useSetWhatsAppBundleStar).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useSetWhatsAppBundleStar>);

        vi.mocked(useArchiveWhatsAppBundle).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useArchiveWhatsAppBundle>);

        vi.mocked(useReopenWhatsAppBundle).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof useReopenWhatsAppBundle>);

        vi.mocked(usePromoteWhatsAppBundle).mockReturnValue({
            mutate: vi.fn(),
        } as ReturnType<typeof usePromoteWhatsAppBundle>);
    });

    it("renders the selected group timeline and exposes bundle selection flow", async () => {
        renderWithClient();

        expect(screen.getAllByText("PRF SC Imprensa")).toHaveLength(2);
        expect(screen.getByText("Release principal da PRF")).toBeInTheDocument();
        expect(screen.getByText("Atualizacao mais recente da PRF")).toBeInTheDocument();
        expect(screen.getByText("Agrupamento PRF")).toBeInTheDocument();

        const timelineTexts = screen
            .getAllByText(/Release principal da PRF|Atualizacao mais recente da PRF/)
            .filter((node) => node.className.includes("text-sm"));
        expect(timelineTexts[0]).toHaveTextContent("Atualizacao mais recente da PRF");
        expect(timelineTexts[1]).toHaveTextContent("Release principal da PRF");

        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[1]);

        expect(screen.getByText(/mensagem\(ns\) selecionada\(s\)/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /criar agrupamento/i })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Destacar$/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: /^Ignorar$/i }).length).toBeGreaterThan(0);
        expect(
            screen.getByRole("button", { name: /Marcar como revisadas/i }),
        ).toBeInTheDocument();
    });

    it("shows an error state instead of an empty state when the timeline query fails", () => {
        vi.mocked(useInfiniteWhatsAppGroupTimeline).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error("Nao foi possivel carregar a timeline do grupo."),
            isFetching: false,
            isFetchingNextPage: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
        } as ReturnType<typeof useInfiniteWhatsAppGroupTimeline>);

        renderWithClient();

        expect(
            screen.getByText("Nao foi possivel carregar a timeline"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Nao foi possivel carregar a timeline do grupo."),
        ).toBeInTheDocument();
    });
});
