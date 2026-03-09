export type SlideshowMediaType = "image" | "video";

export type MediaOrientation = "vertical" | "horizontal" | "squareish";

export type SlideAssetStatus = "ready" | "loading" | "error" | "stale";

export type PlayerVisualStatus = "booting" | "idle" | "playing" | "expired" | "error";

export type SlideshowRenderableLayout = "polaroid" | "fullscreen" | "split" | "cinematic";

export type SlideshowLayout = "auto" | SlideshowRenderableLayout;

export type SlideshowConnectionStatus =
    | "idle"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "error";

export interface SlideshowEventSummary {
    id: number;
    title: string;
    slug?: string | null;
    slideshow_code: string;
    status: string;
    public_url?: string | null;
}

export interface SlideMedia {
    id: string;
    url: string;
    type: SlideshowMediaType;
    sender_name?: string | null;
    texto_curto?: string | null;
    highlight_score: number;
    created_at?: string | null;
}

export interface SlideSettings {
    intervalo: number;
    limite: number;
    layout: SlideshowLayout;
    background?: string | null;
    partnerLogo?: string | null;
    showNeon: boolean;
    neonText?: string | null;
    instructionsText?: string | null;
}

export interface SlideshowBootData {
    event: SlideshowEventSummary;
    files: SlideMedia[];
    settings: SlideSettings;
}

export interface SlideMediaUpdatedPayload {
    id: string;
    url?: string;
    type?: SlideshowMediaType;
    sender_name?: string | null;
    texto_curto?: string | null;
    highlight_score?: number;
    created_at?: string | null;
}

export interface SlideMediaDeletedPayload {
    id: string;
}

export interface SlideshowExpiredPayload {
    reason?: string;
    expired_at?: string | null;
}

export interface SlideRuntimeItem extends SlideMedia {
    assetStatus: SlideAssetStatus;
    orientation?: MediaOrientation | null;
    width?: number | null;
    height?: number | null;
    cachedAt?: string | null;
    lastError?: string | null;
    playedAt?: string | null;
}

export interface PersistedSlideshowState {
    code: string;
    status: PlayerVisualStatus;
    event: SlideshowEventSummary | null;
    settings: SlideSettings | null;
    items: SlideRuntimeItem[];
    currentIndex: number;
    updatedAt: string;
}

export interface SlideshowPlayerState extends PersistedSlideshowState {
    storage?: {
        persisted: boolean;
        quota?: number | null;
        usage?: number | null;
    };
}
