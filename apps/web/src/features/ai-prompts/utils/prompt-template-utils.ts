import type { NewsItem, NewsUrgency } from "@/services/newsRadar.service";
import type {
    CompilePromptResult,
    PromptActionProvider,
    PromptCompileContext,
    PromptTemplate,
    PromptVariable,
} from "@/features/ai-prompts/types";
import type { WhatsAppNewsBundle } from "@/features/news-radar-whatsapp/types";

export const EDITORIAL_TIMEZONE = "America/Sao_Paulo";
export const PROMPT_DEEPLINK_MAX_URL_LENGTH = 1800;

const SAMPLE_PUBLIC_TOKEN = "2696202c-d1d9-4ffb-a479-41999c4c1b0f";
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
const URGENCY_LABELS: Record<NewsUrgency, string> = {
    baixa: "Baixa",
    media: "Media",
    alta: "Alta",
};

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

function normalizeVariableToken(rawToken: string): string {
    const match = rawToken.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/);
    if (!match) {
        return rawToken;
    }

    return `{{${match[1]}}}`;
}

function getNormalizedCategories(categories: string[] | null | undefined): string[] {
    return (categories ?? [])
        .map((category) => category?.trim() ?? "")
        .filter(Boolean);
}

function getFallbackExcerpt(newsItem: NewsItem): string {
    if (newsItem.excerpt?.trim()) {
        return newsItem.excerpt.trim();
    }

    if (newsItem.subtitle?.trim()) {
        return newsItem.subtitle.trim();
    }

    if (newsItem.body_text?.trim()) {
        return newsItem.body_text.trim().slice(0, 280);
    }

    return "";
}

function getBundleFallbackExcerpt(bundle: WhatsAppNewsBundle): string {
    const candidates = [
        bundle.summary,
        bundle.lead_draft,
        bundle.origin_summary,
        bundle.notes,
        bundle.editorial_notes,
        bundle.items
            ?.map((item) => item.event?.text_message?.trim() ?? "")
            .find(Boolean),
    ];

    return candidates.find((candidate) => candidate?.trim())?.trim() ?? "";
}

function formatEditorialDate(value?: string | null): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: EDITORIAL_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function getBundleTitle(bundle: WhatsAppNewsBundle): string {
    return (
        bundle.title?.trim() ??
        bundle.headline_draft?.trim() ??
        bundle.items
            ?.map((item) => item.event?.text_message?.trim() ?? "")
            .find(Boolean) ??
        ""
    );
}

function getBundleSource(bundle: WhatsAppNewsBundle): string {
    return bundle.group?.name?.trim() ?? "";
}

function getBundleOriginalUrl(bundle: WhatsAppNewsBundle): string {
    return (
        bundle.items
            ?.map((item) => item.event?.link_url?.trim() ?? "")
            .find(Boolean) ?? ""
    );
}

function getPromptValueMap(newsItem: NewsItem): Record<string, string> {
    const categories = getNormalizedCategories(newsItem.categories_raw);

    return {
        "{{md_url}}": buildMarkdownUrl(newsItem.public_token),
        "{{item_title}}": newsItem.title?.trim() ?? "",
        "{{item_source}}": newsItem.source?.name?.trim() ?? "",
        "{{item_date}}": formatEditorialDate(
            newsItem.published_at_utc ??
                newsItem.published_at_parsed ??
                newsItem.created_at ??
                null,
        ),
        "{{item_excerpt}}": getFallbackExcerpt(newsItem),
        "{{item_city}}": newsItem.ai_metadata?.city?.trim() ?? "",
        "{{item_urgency}}": newsItem.ai_metadata?.urgency
            ? URGENCY_LABELS[newsItem.ai_metadata.urgency]
            : "",
        "{{item_category}}": categories[0] ?? "",
        "{{item_categories}}": categories.join(", "),
        "{{item_original_url}}": newsItem.raw_url?.trim() || newsItem.url?.trim() || "",
    };
}

function getBundlePromptValueMap(
    bundle: WhatsAppNewsBundle,
    markdownUrl?: string | null,
): Record<string, string> {
    const categories = getNormalizedCategories(bundle.categories_json);

    return {
        "{{md_url}}": markdownUrl?.trim() ?? "",
        "{{item_title}}": getBundleTitle(bundle),
        "{{item_source}}": getBundleSource(bundle),
        "{{item_date}}": formatEditorialDate(bundle.first_message_at ?? bundle.created_at ?? null),
        "{{item_excerpt}}": getBundleFallbackExcerpt(bundle),
        "{{item_city}}": bundle.city?.trim() ?? "",
        "{{item_urgency}}": bundle.urgency?.trim() ?? "",
        "{{item_category}}": (bundle.category?.trim() || categories[0] || ""),
        "{{item_categories}}":
            categories.length > 0
                ? categories.join(", ")
                : bundle.category?.trim() ?? "",
        "{{item_original_url}}": getBundleOriginalUrl(bundle),
    };
}

function isCompileContext(value: NewsItem | PromptCompileContext): value is PromptCompileContext {
    return typeof value === "object" && value !== null && "kind" in value;
}

function getPromptValueMapFromContext(
    input: NewsItem | PromptCompileContext,
): Record<string, string> {
    if (!isCompileContext(input)) {
        return getPromptValueMap(input);
    }

    if (input.kind === "news-item") {
        return getPromptValueMap(input.newsItem);
    }

    return getBundlePromptValueMap(input.bundle, input.markdownUrl);
}

export function buildMarkdownUrl(
    publicToken: string,
    view: "raw" | "enriched" = "raw",
): string {
    const baseUrl = getPublicNewsBaseUrl();
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const url = new URL(`news/${publicToken}.md`, normalizedBaseUrl);

    if (view === "enriched") {
        url.searchParams.set("view", "enriched");
    }

    return url.toString();
}

export function buildProviderDeepLink(
    provider: PromptActionProvider,
    prompt: string,
): string {
    const encodedPrompt = encodeURIComponent(prompt);

    if (provider === "chatgpt") {
        return `https://chatgpt.com/?q=${encodedPrompt}`;
    }

    return `https://claude.ai/new?q=${encodedPrompt}`;
}

export function isDeepLinkSafe(
    url: string,
    maxLength = PROMPT_DEEPLINK_MAX_URL_LENGTH,
): boolean {
    return url.length <= maxLength;
}

export function fetchMarkdownContent(publicToken: string): Promise<string> {
    const url = buildMarkdownUrl(publicToken);

    return fetch(url).then((response) => {
        if (!response.ok) {
            throw new Error(`Erro ao buscar markdown: ${response.status}`);
        }

        return response.text();
    });
}

export function getAvailableVariables(): PromptVariable[] {
    return [
        {
            key: "{{md_url}}",
            label: "Link do Markdown publico",
            description: "URL publica da noticia em markdown.",
            example: buildMarkdownUrl(SAMPLE_PUBLIC_TOKEN),
            required_recommended: true,
        },
        {
            key: "{{item_title}}",
            label: "Titulo da noticia",
            description: "Titulo original da materia.",
            example: "Camara aprova projeto em sessao extraordinaria",
            required_recommended: false,
        },
        {
            key: "{{item_source}}",
            label: "Fonte",
            description: "Nome do provedor ou portal de origem.",
            example: "UOL",
            required_recommended: false,
        },
        {
            key: "{{item_date}}",
            label: "Data editorial",
            description: "Data formatada na timezone editorial fixa.",
            example: "12/03/2026, 12:30",
            required_recommended: false,
        },
        {
            key: "{{item_excerpt}}",
            label: "Resumo",
            description: "Resumo ou lead sintetico da noticia.",
            example: "Projeto avanca apos acordo entre liderancas.",
            required_recommended: false,
        },
        {
            key: "{{item_city}}",
            label: "Cidade",
            description: "Cidade vinda de ai_metadata.city.",
            example: "Florianopolis",
            required_recommended: false,
        },
        {
            key: "{{item_urgency}}",
            label: "Urgencia",
            description: "Urgencia editorial da materia.",
            example: "Alta",
            required_recommended: false,
        },
        {
            key: "{{item_category}}",
            label: "Categoria principal",
            description: "Primeira categoria valida de categories_raw.",
            example: "Politica",
            required_recommended: false,
        },
        {
            key: "{{item_categories}}",
            label: "Categorias",
            description: "Categorias unidas por virgula.",
            example: "Politica, Brasil, Congresso",
            required_recommended: false,
        },
        {
            key: "{{item_original_url}}",
            label: "Link original",
            description: "URL bruta da materia na origem nativa.",
            example: "https://portal.exemplo.com.br/noticia/123",
            required_recommended: false,
        },
    ];
}

export function extractUnknownVariables(text: string): string[] {
    const knownVariables = new Set(getAvailableVariables().map((variable) => variable.key));
    const matches = text.match(VARIABLE_PATTERN) ?? [];
    const unknownVariables = matches
        .map((match) => normalizeVariableToken(match))
        .filter((token) => !knownVariables.has(token));

    return Array.from(new Set(unknownVariables));
}

export function hasRecommendedMdUrl(text: string): boolean {
    return /{{\s*md_url\s*}}/.test(text);
}

export function compilePrompt(
    template: string,
    input: NewsItem | PromptCompileContext,
): CompilePromptResult {
    const promptValueMap = getPromptValueMapFromContext(input);
    const usedVariables = new Set<string>();

    const compiledText = template.replace(VARIABLE_PATTERN, (match, variableKey: string) => {
        const normalizedToken = `{{${variableKey}}}`;
        const replacement = promptValueMap[normalizedToken];

        if (replacement === undefined) {
            return match;
        }

        usedVariables.add(normalizedToken);

        return replacement;
    });

    const hasMdUrl = usedVariables.has("{{md_url}}") || hasRecommendedMdUrl(template);
    const unknownVariables = extractUnknownVariables(compiledText);
    const missingRecommendedVariables = hasMdUrl ? [] : ["{{md_url}}"];
    const isPossiblyTooLongForDeepLink = !isDeepLinkSafe(
        buildProviderDeepLink("chatgpt", compiledText),
    );

    return {
        compiledText,
        unknownVariables,
        missingRecommendedVariables,
        usedVariables: Array.from(usedVariables),
        hasMdUrl,
        isPossiblyTooLongForDeepLink,
    };
}

export function sortPromptTemplates(templates: PromptTemplate[]): PromptTemplate[] {
    return [...templates].sort((left, right) => {
        if (left.is_favorite !== right.is_favorite) {
            return left.is_favorite ? -1 : 1;
        }

        if (left.sort_order !== right.sort_order) {
            return left.sort_order - right.sort_order;
        }

        return left.name.localeCompare(right.name, "pt-BR");
    });
}

export function getDefaultPromptTemplate(
    templates: PromptTemplate[],
): PromptTemplate | null {
    return sortPromptTemplates(templates)[0] ?? null;
}

export function createPromptPreviewNewsItem(): NewsItem {
    return {
        id: 0,
        news_source_id: 0,
        public_token: SAMPLE_PUBLIC_TOKEN,
        url: "https://portal.exemplo.com.br/noticias/camara-aprova-projeto",
        raw_url: "https://portal.exemplo.com.br/noticias/camara-aprova-projeto?utm_source=rss",
        title: "Camara aprova projeto em sessao extraordinaria",
        subtitle: "Votacao teve apoio da base e de parte da oposicao.",
        excerpt:
            "Projeto avancou apos acordo entre liderancas e segue para analise final.",
        body_text:
            "Projeto avancou apos acordo entre liderancas e segue para analise final.",
        categories_raw: ["Politica", "Brasil", "Congresso"],
        published_at_utc: "2026-03-12T15:30:00Z",
        created_at: "2026-03-12T15:45:00Z",
        extraction_completeness: 100,
        extraction_status: "extracted",
        enrichment_status: "enriched_l1",
        is_duplicate_candidate: false,
        source: {
            id: 0,
            name: "Portal Exemplo",
            homepage_url: "https://portal.exemplo.com.br",
            source_type: "portal",
        },
        ai_metadata: {
            city: "Florianopolis",
            urgency: "alta",
        },
    };
}

export function createPromptPreviewWhatsAppBundle(markdownUrl = "https://adm.tvvip.social/api/v1/public/news-radar/whatsapp/markdown-exports/example-token"): WhatsAppNewsBundle {
    return {
        id: 9,
        whatsapp_group_fk: "group-1",
        status: "open",
        creation_mode: "manual_selection",
        assigned_to: null,
        title: "Release da PRF sobre acidente na BR-101",
        headline_draft: "PRF divulga detalhes de acidente na BR-101",
        subheadline_draft: null,
        lead_draft: "Ocorrencia foi registrada durante a madrugada e mobilizou equipes de resgate.",
        summary: "Bundle formado a partir de texto, imagem e link enviados pela assessoria da PRF.",
        origin_summary: "Material enviado pela assessoria da PRF SC.",
        notes: "Checar atualizacao sobre estado das vitimas.",
        editorial_notes: null,
        promotion_notes: null,
        city: "Palhoca",
        urgency: "Alta",
        category: "Transito",
        categories_json: ["Transito", "Seguranca"],
        is_starred: true,
        cover_media_id: null,
        lock_version: 3,
        message_count: 3,
        media_count: 1,
        primary_sender_name: "Assessoria PRF",
        has_updated_source_messages: false,
        first_message_at: "2026-03-12T15:30:00Z",
        last_message_at: "2026-03-12T15:35:00Z",
        review_started_at: null,
        promoted_at: null,
        archived_at: null,
        created_at: "2026-03-12T15:35:30Z",
        updated_at: "2026-03-12T15:40:00Z",
        group: {
            id: "group-1",
            name: "PRF SC Imprensa",
            group_id: "554888120076-1374521846",
        },
        items: [
            {
                id: 1,
                sort_order: 1,
                is_cover: false,
                event: {
                    id: 1,
                    message_id: "message-1",
                    message_kind: "text",
                    text_message:
                        "Atendimento a sinistro de transito na BR-101, em Palhoca, com faixa interditada.",
                    link_url: null,
                    sender_name: "Assessoria PRF",
                    sent_at: "2026-03-12T15:30:00Z",
                    has_media: false,
                },
            },
            {
                id: 2,
                sort_order: 2,
                is_cover: false,
                event: {
                    id: 2,
                    message_id: "message-2",
                    message_kind: "image",
                    text_message: "Foto da ocorrencia enviada pela equipe da PRF.",
                    link_url: "https://prf.gov.br/ocorrencia/br-101-palhoca",
                    sender_name: "Assessoria PRF",
                    sent_at: "2026-03-12T15:32:00Z",
                    has_media: true,
                },
            },
        ],
    };
}
