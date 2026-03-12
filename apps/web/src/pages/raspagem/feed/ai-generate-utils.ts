import {
    buildMarkdownUrl,
    buildProviderDeepLink,
    fetchMarkdownContent,
} from "@/features/ai-prompts/utils/prompt-template-utils";

export function getMarkdownUrl(
    itemPublicToken: string,
    view: "raw" | "enriched" = "raw",
): string {
    return buildMarkdownUrl(itemPublicToken, view);
}

export function getRewritePrompt(mdUrl: string): string {
    return `Reescreva a noticia abaixo em portugues do Brasil, com estilo jornalistico profissional, claro e original.

Use como base o conteudo deste arquivo:
${mdUrl}

Objetivo:
- criar uma versao original
- manter fidelidade factual
- preservar nomes, datas, locais, cargos e numeros
- evitar copiar frases literalmente
- evitar sensacionalismo
- manter tom informativo

Retorne em:
1. Titulo
2. Subtitulo
3. Lead
4. Corpo da materia
5. 3 chamadas curtas para redes`;
}

export function getChatGptUrl(publicToken: string): string {
    return buildProviderDeepLink("chatgpt", getRewritePrompt(getMarkdownUrl(publicToken)));
}

export function getClaudeUrl(publicToken: string): string {
    return buildProviderDeepLink("claude", getRewritePrompt(getMarkdownUrl(publicToken)));
}

export { fetchMarkdownContent };
