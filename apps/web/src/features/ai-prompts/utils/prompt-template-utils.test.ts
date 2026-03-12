import { afterEach, describe, expect, it, vi } from "vitest";
import {
    buildMarkdownUrl,
    buildProviderDeepLink,
    compilePrompt,
    createPromptPreviewNewsItem,
    extractUnknownVariables,
    hasRecommendedMdUrl,
    isDeepLinkSafe,
    PROMPT_DEEPLINK_MAX_URL_LENGTH,
} from "@/features/ai-prompts/utils/prompt-template-utils";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("prompt-template-utils", () => {
    it("builds markdown url from api origin when explicit public base url is absent", () => {
        vi.stubEnv("VITE_API_URL", "http://api.vip.test/api/v1");

        expect(buildMarkdownUrl("2696202c-d1d9-4ffb-a479-41999c4c1b0f")).toBe(
            "http://api.vip.test/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md",
        );
    });

    it("builds markdown url from explicit public base url when configured", () => {
        vi.stubEnv("VITE_NEWS_PUBLIC_BASE_URL", "https://adm.tvvip.social");

        expect(buildMarkdownUrl("2696202c-d1d9-4ffb-a479-41999c4c1b0f", "enriched")).toBe(
            "https://adm.tvvip.social/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md?view=enriched",
        );
    });

    it("compiles known variables and tracks used placeholders", () => {
        const item = createPromptPreviewNewsItem();
        const result = compilePrompt(
            "Titulo: {{item_title}}\nLink: {{md_url}}\nFonte: {{item_source}}",
            item,
        );

        expect(result.compiledText).toContain(item.title);
        expect(result.compiledText).toContain("Portal Exemplo");
        expect(result.compiledText).toContain(".md");
        expect(result.usedVariables).toEqual(
            expect.arrayContaining(["{{item_title}}", "{{md_url}}", "{{item_source}}"]),
        );
        expect(result.hasMdUrl).toBe(true);
        expect(result.missingRecommendedVariables).toEqual([]);
    });

    it("degrades null or undefined values to empty string", () => {
        const item = {
            ...createPromptPreviewNewsItem(),
            excerpt: null,
            subtitle: null,
            body_text: null,
            ai_metadata: {
                city: null,
                urgency: null,
            },
            categories_raw: null,
        };

        const result = compilePrompt(
            "Resumo: {{item_excerpt}} | Cidade: {{item_city}} | Urgencia: {{item_urgency}} | Categoria: {{item_category}}",
            item,
        );

        expect(result.compiledText).toBe("Resumo:  | Cidade:  | Urgencia:  | Categoria: ");
    });

    it("preserves unknown variables and reports them after compilation", () => {
        const item = createPromptPreviewNewsItem();
        const result = compilePrompt("Link {{md_url}} {{teste_invalido}}", item);

        expect(result.compiledText).toContain("{{teste_invalido}}");
        expect(result.unknownVariables).toEqual(["{{teste_invalido}}"]);
    });

    it("uses the first normalized category for item_category and joins item_categories", () => {
        const item = {
            ...createPromptPreviewNewsItem(),
            categories_raw: ["  Politica  ", "", "Brasil", "Congresso"],
        };

        const result = compilePrompt(
            "{{item_category}} / {{item_categories}}",
            item,
        );

        expect(result.compiledText).toBe("Politica / Politica, Brasil, Congresso");
    });

    it("formats item_date in the editorial timezone", () => {
        const item = {
            ...createPromptPreviewNewsItem(),
            published_at_utc: "2026-03-12T15:30:00Z",
        };

        const result = compilePrompt("Data: {{item_date}}", item);

        expect(result.compiledText).toBe("Data: 12/03/2026, 12:30");
    });

    it("reads item_city and item_urgency from ai_metadata", () => {
        const item = {
            ...createPromptPreviewNewsItem(),
            ai_metadata: {
                city: "Blumenau",
                urgency: "media" as const,
            },
        };

        const result = compilePrompt("{{item_city}} / {{item_urgency}}", item);

        expect(result.compiledText).toBe("Blumenau / Media");
    });

    it("flags missing md_url without blocking compilation", () => {
        const result = compilePrompt("Titulo: {{item_title}}", createPromptPreviewNewsItem());

        expect(result.hasMdUrl).toBe(false);
        expect(result.missingRecommendedVariables).toEqual(["{{md_url}}"]);
    });

    it("detects deeplinks that exceed the conservative url length threshold", () => {
        const longPrompt = "a".repeat(PROMPT_DEEPLINK_MAX_URL_LENGTH * 2);
        const url = buildProviderDeepLink("chatgpt", longPrompt);

        expect(isDeepLinkSafe(url)).toBe(false);
        expect(
            compilePrompt(longPrompt, createPromptPreviewNewsItem()).isPossiblyTooLongForDeepLink,
        ).toBe(true);
    });

    it("extracts unknown variables and detects md_url placeholder", () => {
        expect(extractUnknownVariables("{{foo}} {{md_url}} {{bar}}")).toEqual([
            "{{foo}}",
            "{{bar}}",
        ]);
        expect(hasRecommendedMdUrl("Prompt {{ md_url }} pronto")).toBe(true);
    });
});
