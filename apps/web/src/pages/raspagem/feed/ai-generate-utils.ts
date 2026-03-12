const PUBLIC_NEWS_BASE_URL =
    import.meta.env.VITE_NEWS_PUBLIC_BASE_URL || window.location.origin;

export function getMarkdownUrl(
    publicToken: string,
    view: "raw" | "enriched" = "raw",
): string {
    const base = `${PUBLIC_NEWS_BASE_URL}/news/${publicToken}.md`;
    return view === "enriched" ? `${base}?view=enriched` : base;
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
