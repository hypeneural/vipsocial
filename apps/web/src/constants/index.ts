// ==========================================
// ROUTES
// ==========================================
export const ROUTES = {
    // Dashboard
    HOME: "/",

    // Auth
    LOGIN: "/auth/login",
    FORGOT_PASSWORD: "/auth/recuperar-senha",

    // Roteiros
    ROTEIROS: "/roteiros",
    ROTEIROS_CREATE: "/roteiros/criar",
    ROTEIROS_EDIT: "/roteiros/editar",
    GAVETAS: "/roteiros/gavetas",
    GAVETAS_CREATE: "/roteiros/gavetas/criar",
    GAVETAS_EDIT: (id: string | number) => `/roteiros/gavetas/${id}/editar`,

    // Alertas
    ALERTAS: "/alertas",
    ALERTAS_LIST: "/alertas/lista",
    ALERTAS_CREATE: "/alertas/novo",
    ALERTAS_EDIT: (id: string | number) => `/alertas/${id}/editar`,
    DESTINOS: "/alertas/destinos",
    DESTINOS_CREATE: "/alertas/destinos/novo",
    DESTINOS_EDIT: (id: string | number) => `/alertas/destinos/${id}/editar`,
    ALERTAS_LOGS: "/alertas/logs",

    // Distribuição
    DISTRIBUTION: "/distribuicao",
    DISTRIBUTION_NEWS: "/distribuicao/noticias",

    // Engajamento
    ENQUETES: "/engajamento/enquetes",
    ENQUETES_CREATE: "/engajamento/enquetes/nova",
    ENQUETES_EDIT: (id: string | number) => `/engajamento/enquetes/${id}/editar`,
    ENQUETES_RESULTS: (id: string | number) => `/engajamento/enquetes/${id}/resultados`,

    // Automação
    AUTOMACAO_GRUPOS: "/automacao/grupos",
    AUTOMACAO_TEMPLATES: "/automacao/templates",
    AUTOMACAO_CAMPANHAS: "/automacao/campanhas",
    AUTOMACAO_STATUS: "/automacao/status",

    // Raspagem
    RASPAGEM_FEED: "/raspagem/feed",
    RASPAGEM_FONTES: "/raspagem/fontes",
    RASPAGEM_FILTROS: "/raspagem/filtros",

    // Pessoas
    PESSOAS_COLABORADORES: "/pessoas/colaboradores",
    PESSOAS_PERMISSOES: "/pessoas/permissoes",
    PESSOAS_ANIVERSARIOS: "/pessoas/aniversarios",

    // Profile
    PROFILE: "/perfil",
    PROFILE_EDIT: "/perfil/editar",
    PREFERENCES: "/perfil/preferencias",

    // Users
    USERS: "/usuarios",
    USERS_CREATE: "/usuarios/novo",
    USERS_EDIT: (id: string | number) => `/usuarios/${id}/editar`,
} as const;

// ==========================================
// BREAKPOINTS
// ==========================================
export const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    wide: 1536,
} as const;

// ==========================================
// STATUS
// ==========================================
export const STATUS = {
    DRAFT: "draft",
    REVIEW: "review",
    APPROVED: "approved",
    PUBLISHED: "published",
    ARCHIVED: "archived",
} as const;

export const STATUS_LABELS: Record<string, string> = {
    draft: "Rascunho",
    review: "Em Revisão",
    approved: "Aprovado",
    published: "Publicado",
    archived: "Arquivado",
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    success: "Sucesso",
    failed: "Falhou",
    scheduled: "Agendado",
    ended: "Encerrado",
};

export const STATUS_COLORS: Record<string, string> = {
    draft: "bg-warning/15 text-warning border-warning/30",
    review: "bg-info/15 text-info border-info/30",
    approved: "bg-success/15 text-success border-success/30",
    published: "bg-success text-success-foreground",
    archived: "bg-muted text-muted-foreground",
    active: "bg-success/15 text-success border-success/30",
    inactive: "bg-muted text-muted-foreground",
    pending: "bg-warning/15 text-warning border-warning/30",
    success: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    scheduled: "bg-info/15 text-info border-info/30",
    ended: "bg-muted text-muted-foreground",
};

// ==========================================
// USER ROLES
// ==========================================
export const USER_ROLES = {
    ADMIN: "admin",
    EDITOR: "editor",
    VIEWER: "viewer",
} as const;

export const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    editor: "Editor",
    viewer: "Visualizador",
};

export const ROLE_COLORS: Record<string, string> = {
    admin: "bg-primary/15 text-primary border-primary/30",
    editor: "bg-info/15 text-info border-info/30",
    viewer: "bg-muted text-muted-foreground border-muted",
};

// ==========================================
// DISTRIBUTION CHANNELS
// ==========================================
export const CHANNELS = {
    WHATSAPP: "whatsapp",
    TELEGRAM: "telegram",
    PORTAL: "portal",
    APP: "app",
    EMAIL: "email",
} as const;

export const CHANNEL_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    portal: "Portal",
    app: "App",
    email: "E-mail",
};

export const CHANNEL_COLORS: Record<string, string> = {
    whatsapp: "bg-green-500/15 text-green-600 border-green-500/30",
    telegram: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    portal: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    app: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    email: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

// ==========================================
// PAGINATION
// ==========================================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 10,
    PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const;

// ==========================================
// STORAGE KEYS
// ==========================================
export const STORAGE_KEYS = {
    AUTH_TOKEN: "auth_token",
    REFRESH_TOKEN: "refresh_token",
    THEME: "theme",
    SIDEBAR_COLLAPSED: "sidebar_collapsed",
    LANGUAGE: "language",
} as const;

// ==========================================
// API
// ==========================================
export const API = {
    BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    TIMEOUT: 30000,
} as const;
