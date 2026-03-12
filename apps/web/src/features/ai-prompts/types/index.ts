import type { NewsItem } from "@/services/newsRadar.service";
import type { WhatsAppNewsBundle } from "@/features/news-radar-whatsapp/types";

export type PromptProviderTarget = "generic" | "chatgpt" | "claude";
export type PromptActionProvider = Exclude<PromptProviderTarget, "generic">;

export interface PromptTemplate {
    id: number;
    name: string;
    description: string | null;
    content: string;
    provider_target: PromptProviderTarget;
    is_favorite: boolean;
    sort_order: number;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PromptVariable {
    key: string;
    label: string;
    description: string;
    example: string;
    required_recommended: boolean;
}

export interface CompilePromptResult {
    compiledText: string;
    unknownVariables: string[];
    missingRecommendedVariables: string[];
    usedVariables: string[];
    hasMdUrl: boolean;
    isPossiblyTooLongForDeepLink: boolean;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        from?: number | null;
        to?: number | null;
        [key: string]: unknown;
    };
}

export interface PromptTemplatePayload {
    name: string;
    description?: string | null;
    content: string;
    provider_target: PromptProviderTarget;
}

export interface PromptTrackUseResponse {
    id: number;
    usage_count: number;
    last_used_at: string | null;
}

export interface PromptTemplateListResponse extends ApiEnvelope<PromptTemplate[]> {}

export type PromptCompileContext =
    | { kind: "news-item"; newsItem: NewsItem }
    | {
          kind: "whatsapp-bundle";
          bundle: WhatsAppNewsBundle;
          markdownUrl?: string | null;
      };
