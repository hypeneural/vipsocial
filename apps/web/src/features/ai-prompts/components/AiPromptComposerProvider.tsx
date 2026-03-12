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

interface AiPromptComposerContextValue {
    openComposer: (newsItem: NewsItem) => void;
    closeComposer: () => void;
}

const AiPromptComposerContext = createContext<AiPromptComposerContextValue | undefined>(
    undefined,
);

export function AiPromptComposerProvider({ children }: { children: ReactNode }) {
    const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

    const openComposer = useCallback((newsItem: NewsItem) => {
        setSelectedNewsItem(newsItem);
    }, []);

    const closeComposer = useCallback(() => {
        setSelectedNewsItem(null);
    }, []);

    const value = useMemo(
        () => ({
            openComposer,
            closeComposer,
        }),
        [closeComposer, openComposer],
    );

    return (
        <AiPromptComposerContext.Provider value={value}>
            {children}
            <AiPromptComposerDialog
                open={Boolean(selectedNewsItem)}
                newsItem={selectedNewsItem}
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
