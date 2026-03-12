import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PromptTemplate } from "@/features/ai-prompts/types";
import { AiPromptComposerDialog } from "@/features/ai-prompts/components/AiPromptComposerDialog";
import {
    createPromptPreviewNewsItem,
    getAvailableVariables,
} from "@/features/ai-prompts/utils/prompt-template-utils";

const { toastMock } = vi.hoisted(() => ({
    toastMock: {
        warning: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        promise: vi.fn(),
    },
}));

vi.mock("@/lib/toast", () => ({
    default: toastMock,
}));

vi.mock("@/features/ai-prompts/hooks/useAiPrompts", () => ({
    useAiPromptTemplates: vi.fn(),
    useAiPromptVariables: vi.fn(),
    useCreateStarterAiPromptTemplate: vi.fn(),
    useTrackAiPromptTemplateUse: vi.fn(),
}));

import {
    useAiPromptTemplates,
    useAiPromptVariables,
    useCreateStarterAiPromptTemplate,
    useTrackAiPromptTemplateUse,
} from "@/features/ai-prompts/hooks/useAiPrompts";

const template: PromptTemplate = {
    id: 101,
    name: "Reescrita Padrao",
    description: "Template de teste",
    content: "Titulo: {{item_title}}\nLink: {{md_url}}",
    provider_target: "chatgpt",
    is_favorite: true,
    sort_order: 1,
    usage_count: 0,
    last_used_at: null,
    created_at: "2026-03-12T12:00:00Z",
    updated_at: "2026-03-12T12:00:00Z",
};

describe("AiPromptComposerDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAiPromptTemplates).mockReturnValue({
            data: { data: [template] },
            isLoading: false,
        } as ReturnType<typeof useAiPromptTemplates>);

        vi.mocked(useAiPromptVariables).mockReturnValue({
            data: { data: getAvailableVariables() },
        } as ReturnType<typeof useAiPromptVariables>);

        vi.mocked(useCreateStarterAiPromptTemplate).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as ReturnType<typeof useCreateStarterAiPromptTemplate>);

        vi.mocked(useTrackAiPromptTemplateUse).mockReturnValue({
            mutateAsync: vi.fn(),
        } as ReturnType<typeof useTrackAiPromptTemplateUse>);
    });

    it("does not open providers or show warnings during render", async () => {
        const openSpy = vi.spyOn(window, "open").mockReturnValue(null);

        render(
            <MemoryRouter>
                <AiPromptComposerDialog
                    open
                    context={{
                        kind: "news-item",
                        newsItem: createPromptPreviewNewsItem(),
                    }}
                    onOpenChange={vi.fn()}
                />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText("Prompt compilado")).toBeInTheDocument();
        });

        expect(openSpy).not.toHaveBeenCalled();
        expect(toastMock.warning).not.toHaveBeenCalled();
    });
});
