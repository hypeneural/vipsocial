import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppFeedTab } from "@/features/news-radar-whatsapp/components/WhatsAppFeedTab";

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
        latest_event_preview: "Release principal da PRF",
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

const event = {
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

const bundle = {
    id: 91,
    whatsapp_group_fk: "group-1",
    status: "open" as const,
    creation_mode: "manual_selection" as const,
    assigned_to: null,
    title: "Bundle PRF",
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
                        data: [event],
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
        render(<WhatsAppFeedTab />);

        expect(screen.getAllByText("PRF SC Imprensa")).toHaveLength(2);
        expect(screen.getAllByText("Release principal da PRF")).toHaveLength(2);
        expect(screen.getByText("Bundle PRF")).toBeInTheDocument();

        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[1]);

        expect(
            screen.getByText(/mensagem\(ns\) pronta\(s\) para agrupamento/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /criar bundle/i })).toBeInTheDocument();
    });
});
