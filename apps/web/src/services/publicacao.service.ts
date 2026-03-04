import api from "./api";

// ==========================================
// TYPES
// ==========================================

export type SocialPlatform =
    | "facebook"
    | "youtube"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "twitter";

export type PublicationStatus =
    | "pending"
    | "published"
    | "scheduled"
    | "failed"
    | "not_applicable";

export interface SocialPublication {
    platform: SocialPlatform;
    status: PublicationStatus;
    publishedAt?: string;
    postUrl?: string;
    scheduledAt?: string;
    verifiedAt?: string;
    verifiedBy?: "manual" | "api";
}

export interface NewsArticle {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    excerpt?: string;
    publishedAt: string;
    category: string;
    author: string;
    publications: SocialPublication[];
    observation?: string;
    updatedAt?: string;
}

export interface NewsFilters {
    search?: string;
    category?: string;
    platform?: SocialPlatform;
    status?: PublicationStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    per_page?: number;
}

export interface NewsStats {
    total: number;
    published: number;
    pending: number;
    byPlatform: Record<SocialPlatform, { published: number; pending: number }>;
}

// ==========================================
// PLATFORM CONFIG
// ==========================================

export const platformConfig: Record<SocialPlatform, {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}> = {
    facebook: {
        label: "Facebook",
        color: "text-blue-600",
        bgColor: "bg-blue-600",
        icon: "📘"
    },
    youtube: {
        label: "YouTube",
        color: "text-red-600",
        bgColor: "bg-red-600",
        icon: "▶️"
    },
    instagram: {
        label: "Instagram",
        color: "text-pink-600",
        bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
        icon: "📷"
    },
    linkedin: {
        label: "LinkedIn",
        color: "text-blue-700",
        bgColor: "bg-blue-700",
        icon: "💼"
    },
    tiktok: {
        label: "TikTok",
        color: "text-black dark:text-white",
        bgColor: "bg-black",
        icon: "🎵"
    },
    twitter: {
        label: "Twitter/X",
        color: "text-sky-500",
        bgColor: "bg-sky-500",
        icon: "🐦"
    },
};

export const statusConfig: Record<PublicationStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}> = {
    published: {
        label: "Publicado",
        color: "text-success",
        bgColor: "bg-success/15",
        icon: "✅"
    },
    pending: {
        label: "Pendente",
        color: "text-warning",
        bgColor: "bg-warning/15",
        icon: "⏳"
    },
    scheduled: {
        label: "Agendado",
        color: "text-info",
        bgColor: "bg-info/15",
        icon: "📅"
    },
    failed: {
        label: "Falhou",
        color: "text-destructive",
        bgColor: "bg-destructive/15",
        icon: "❌"
    },
    not_applicable: {
        label: "N/A",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        icon: "➖"
    },
};

// ==========================================
// MOCK DATA
// ==========================================

const categories = ["Política", "Economia", "Esportes", "Entretenimento", "Tecnologia", "Local"];

const generateMockPublications = (): SocialPublication[] => {
    const platforms: SocialPlatform[] = ["facebook", "youtube", "instagram", "linkedin", "tiktok", "twitter"];
    const statuses: PublicationStatus[] = ["published", "pending", "scheduled", "failed", "not_applicable"];

    return platforms.map(platform => ({
        platform,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        publishedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() : undefined,
        verifiedBy: "manual" as const,
    }));
};

const generateMockNews = (): NewsArticle[] => {
    const titles = [
        "Prefeitura anuncia novo pacote de obras para 2026",
        "Bolsa de Valores fecha em alta histórica",
        "Time local vence campeonato estadual",
        "Festival de música atrai 50 mil pessoas",
        "Startup local recebe investimento milionário",
        "Governo lança programa de habitação popular",
        "Eleições 2026: pesquisa mostra cenário apertado",
        "Chuvas intensas causam alagamentos na região",
        "Novo hospital será inaugurado no próximo mês",
        "Economia local cresce 5% no primeiro trimestre",
        "Artista local ganha prêmio internacional",
        "Universidade anuncia novos cursos gratuitos",
    ];

    return titles.map((title, index) => ({
        id: String(index + 1),
        title,
        url: `https://vipsocial.com.br/noticias/${index + 1}`,
        thumbnail: `https://picsum.photos/seed/${index + 1}/400/225`,
        excerpt: `Resumo da notícia sobre ${title.toLowerCase()}.`,
        publishedAt: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
        category: categories[Math.floor(Math.random() * categories.length)],
        author: ["Maria Santos", "Carlos Oliveira", "Ana Beatriz"][Math.floor(Math.random() * 3)],
        publications: generateMockPublications(),
        observation: Math.random() > 0.7 ? "Verificar horário de maior engajamento" : undefined,
        updatedAt: new Date().toISOString(),
    }));
};

let mockNewsData = generateMockNews();

// ==========================================
// API METHODS
// ==========================================

export const publicacaoService = {
    /**
     * Get all news articles with filters
     */
    getAll: async (filters?: NewsFilters): Promise<{ data: NewsArticle[]; total: number }> => {
        // In production: return api.get("/publicacoes", { params: filters });

        await new Promise(resolve => setTimeout(resolve, 500));

        let filtered = [...mockNewsData];

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(n => n.title.toLowerCase().includes(search));
        }

        if (filters?.category) {
            filtered = filtered.filter(n => n.category === filters.category);
        }

        if (filters?.platform && filters?.status) {
            filtered = filtered.filter(n =>
                n.publications.some(p =>
                    p.platform === filters.platform && p.status === filters.status
                )
            );
        }

        return { data: filtered, total: filtered.length };
    },

    /**
     * Get single news article
     */
    getById: async (id: string): Promise<NewsArticle> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const news = mockNewsData.find(n => n.id === id);
        if (!news) throw new Error("Notícia não encontrada");
        return news;
    },

    /**
     * Update publication status for a platform
     */
    updatePublicationStatus: async (
        newsId: string,
        platform: SocialPlatform,
        data: Partial<SocialPublication>
    ): Promise<NewsArticle> => {
        // In production: return api.patch(`/publicacoes/${newsId}/platforms/${platform}`, data);

        await new Promise(resolve => setTimeout(resolve, 400));

        const newsIndex = mockNewsData.findIndex(n => n.id === newsId);
        if (newsIndex === -1) throw new Error("Notícia não encontrada");

        const pubIndex = mockNewsData[newsIndex].publications.findIndex(p => p.platform === platform);
        if (pubIndex !== -1) {
            mockNewsData[newsIndex].publications[pubIndex] = {
                ...mockNewsData[newsIndex].publications[pubIndex],
                ...data,
                verifiedAt: new Date().toISOString(),
                verifiedBy: "manual",
            };
        }

        mockNewsData[newsIndex].updatedAt = new Date().toISOString();
        return mockNewsData[newsIndex];
    },

    /**
     * Update observation for a news article
     */
    updateObservation: async (newsId: string, observation: string): Promise<NewsArticle> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const newsIndex = mockNewsData.findIndex(n => n.id === newsId);
        if (newsIndex === -1) throw new Error("Notícia não encontrada");

        mockNewsData[newsIndex].observation = observation;
        mockNewsData[newsIndex].updatedAt = new Date().toISOString();
        return mockNewsData[newsIndex];
    },

    /**
     * Mark all platforms as published
     */
    markAllPublished: async (newsId: string): Promise<NewsArticle> => {
        await new Promise(resolve => setTimeout(resolve, 400));

        const newsIndex = mockNewsData.findIndex(n => n.id === newsId);
        if (newsIndex === -1) throw new Error("Notícia não encontrada");

        mockNewsData[newsIndex].publications = mockNewsData[newsIndex].publications.map(p => ({
            ...p,
            status: "published" as const,
            publishedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verifiedBy: "manual" as const,
        }));

        mockNewsData[newsIndex].updatedAt = new Date().toISOString();
        return mockNewsData[newsIndex];
    },

    /**
     * Get publication stats
     */
    getStats: async (): Promise<NewsStats> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const platforms: SocialPlatform[] = ["facebook", "youtube", "instagram", "linkedin", "tiktok", "twitter"];
        const byPlatform = {} as Record<SocialPlatform, { published: number; pending: number }>;

        platforms.forEach(platform => {
            const pubs = mockNewsData.flatMap(n => n.publications.filter(p => p.platform === platform));
            byPlatform[platform] = {
                published: pubs.filter(p => p.status === "published").length,
                pending: pubs.filter(p => p.status === "pending").length,
            };
        });

        const allPubs = mockNewsData.flatMap(n => n.publications);

        return {
            total: mockNewsData.length,
            published: allPubs.filter(p => p.status === "published").length,
            pending: allPubs.filter(p => p.status === "pending").length,
            byPlatform,
        };
    },

    /**
     * Get categories list
     */
    getCategories: async (): Promise<string[]> => {
        return categories;
    },
};

export default publicacaoService;
