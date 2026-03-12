import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("getMarkdownUrl", () => {
    it("uses the api origin when no explicit public base url is configured", async () => {
        vi.stubEnv("VITE_API_URL", "http://api.vip.test/api/v1");

        const { getMarkdownUrl } = await import("./ai-generate-utils");

        expect(getMarkdownUrl("2696202c-d1d9-4ffb-a479-41999c4c1b0f")).toBe(
            "http://api.vip.test/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md",
        );
    });

    it("uses the explicit public base url when configured", async () => {
        vi.stubEnv("VITE_NEWS_PUBLIC_BASE_URL", "https://adm.tvvip.social");

        const { getMarkdownUrl } = await import("./ai-generate-utils");

        expect(getMarkdownUrl("2696202c-d1d9-4ffb-a479-41999c4c1b0f", "enriched")).toBe(
            "https://adm.tvvip.social/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md?view=enriched",
        );
    });

    it("falls back to the current origin when the api url is relative", async () => {
        vi.stubEnv("VITE_API_URL", "/api/v1");

        const { getMarkdownUrl } = await import("./ai-generate-utils");

        expect(getMarkdownUrl("2696202c-d1d9-4ffb-a479-41999c4c1b0f")).toBe(
            `${window.location.origin}/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md`,
        );
    });
});
