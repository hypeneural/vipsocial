import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { NewsItem } from "@/services/newsRadar.service";
import { useAiPromptComposer } from "@/features/ai-prompts/components/AiPromptComposerProvider";

interface AiGenerateMenuProps {
    item: NewsItem;
}

export function AiGenerateMenu({ item }: AiGenerateMenuProps) {
    const { user } = useAuth();
    const { openComposer } = useAiPromptComposer();
    const canUseAiPrompts =
        user?.role === "admin" || user?.permissions?.includes("ai_prompts.view");

    if (!canUseAiPrompts) {
        return null;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => openComposer(item)}
        >
            <Sparkles className="mr-1 h-3 w-3" />
            Gerar com I.A.
        </Button>
    );
}
