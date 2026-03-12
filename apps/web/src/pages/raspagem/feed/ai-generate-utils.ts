function getPublicNewsBaseUrl(): string {
    const envUrl = import.meta.env.VITE_NEWS_PUBLIC_BASE_URL?.trim();
    if (envUrl) {
        return envUrl;
    }

    const apiUrl = import.meta.env.VITE_API_URL?.trim();
    if (apiUrl && !apiUrl.startsWith("/")) {
        return new URL(apiUrl).origin;
    }

    return window.location.origin;
}

export function getMarkdownUrl(itemPublicToken: string, view: "raw" | "enriched" = "raw"): string {
    const baseUrl = getPublicNewsBaseUrl();
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const url = new URL(`news/${itemPublicToken}.md`, normalizedBaseUrl);

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
