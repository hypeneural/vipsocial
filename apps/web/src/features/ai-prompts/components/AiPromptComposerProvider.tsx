import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { NewsItem } from "@/services/newsRadar.service";
import { AiPromptComposerDialog } from "@/features/ai-prompts/components/AiPromptComposerDialog";
import type { PromptCompileContext } from "@/features/ai-prompts/types";
import type { WhatsAppNewsBundle } from "@/features/news-radar-whatsapp/types";

interface AiPromptComposerContextValue {
    openComposer: (newsItem: NewsItem) => void;
    openBundleComposer: (bundle: WhatsAppNewsBundle) => void;
    closeComposer: () => void;
}

const AiPromptComposerContext = createContext<AiPromptComposerContextValue | undefined>(
    undefined,
);

export function AiPromptComposerProvider({ children }: { children: ReactNode }) {
    const [selectedContext, setSelectedContext] = useState<PromptCompileContext | null>(null);

    const openComposer = useCallback((newsItem: NewsItem) => {
        setSelectedContext({
            kind: "news-item",
            newsItem,
        });
    }, []);

    const openBundleComposer = useCallback((bundle: WhatsAppNewsBundle) => {
        setSelectedContext({
            kind: "whatsapp-bundle",
            bundle,
        });
    }, []);

    const closeComposer = useCallback(() => {
        setSelectedContext(null);
    }, []);

    const value = useMemo(
        () => ({
            openComposer,
            openBundleComposer,
            closeComposer,
        }),
        [closeComposer, openBundleComposer, openComposer],
    );

    return (
        <AiPromptComposerContext.Provider value={value}>
            {children}
            <AiPromptComposerDialog
                open={Boolean(selectedContext)}
                context={selectedContext}
                onOpenChange={(open) => {
                    if (!open) {
                        closeComposer();
                    }
                }}
            />
        </AiPromptComposerContext.Provider>
    );
}

export function useAiPromptComposer() {
    const context = useContext(AiPromptComposerContext);

    if (!context) {
        throw new Error(
            "useAiPromptComposer must be used within an AiPromptComposerProvider",
        );
    }

    return context;
}
