const PUBLIC_NEWS_BASE_URL =
    import.meta.env.VITE_NEWS_PUBLIC_BASE_URL || window.location.origin;

/**
 * Gets the base URL for the API to ensure the crawler gets the absolute URL
 */
function getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL;
    // If it's a relative path like "/api/v1" or missing, make it absolute
    if (!envUrl || envUrl.startsWith('/')) {
        const suffix = envUrl || "/api/v1";
        return `${window.location.origin}${suffix}`;
    }
    return envUrl;
}

/**
 * Generates the URL for the raw or enriched markdown
 */
export function getMarkdownUrl(itemPublicToken: string, view: "raw" | "enriched" = "raw"): string {
    const baseUrl = getApiBaseUrl();
    const url = new URL(`${baseUrl}/public/news/${itemPublicToken}/markdown`);
    
    if (view === "enriched") {
        url.searchParams.set("view", "enriched");
    }
    
    return url.toString();
}

export function getRewritePrompt(mdUrl: string): string {
    return `Reescreva a notícia abaixo em português do Brasil, com estilo jornalístico profissional, claro e original.

Use como base o conteúdo deste arquivo:
${mdUrl}

Objetivo:
- criar uma versão original
- manter fidelidade factual
- preservar nomes, datas, locais, cargos e números
- evitar copiar frases literalmente
- evitar sensacionalismo
- manter tom informativo

Retorne em:
1. Título
2. Subtítulo
3. Lead
4. Corpo da matéria
5. 3 chamadas curtas para redes`;
}

export function getChatGptUrl(publicToken: string): string {
    const prompt = getRewritePrompt(getMarkdownUrl(publicToken));
    return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export function getClaudeUrl(publicToken: string): string {
    const prompt = getRewritePrompt(getMarkdownUrl(publicToken));
    return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}

export async function fetchMarkdownContent(publicToken: string): Promise<string> {
    const url = getMarkdownUrl(publicToken);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erro ao buscar markdown: ${response.status}`);
    }
    return response.text();
}
