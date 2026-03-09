import { describe, expect, it } from "vitest";
import { createEmptyPlayerState } from "./selectors";
import { slideshowEngineReducer } from "./reducer";
import type { SlideRuntimeItem, SlideshowBootData } from "../types";

function makeReadyItem(overrides: Partial<SlideRuntimeItem> = {}): SlideRuntimeItem {
    return {
        id: "photo-1",
        url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-1.jpg",
        type: "image",
        sender_name: "Anderson",
        texto_curto: null,
        highlight_score: 0,
        created_at: "2026-03-09T10:00:00-03:00",
        assetStatus: "ready",
        orientation: "vertical",
        width: 720,
        height: 1280,
        cachedAt: "2026-03-09T10:00:05-03:00",
        lastError: null,
        playedAt: null,
        ...overrides,
    };
}

function makeSnapshot(files: SlideshowBootData["files"]): SlideshowBootData {
    return {
        event: {
            id: 1,
            title: "Casamento VIP",
            slug: "casamento-vip",
            slideshow_code: "M6NS6M",
            status: "active",
            public_url: "https://adm.tvvip.social/slideshow/M6NS6M",
        },
        files,
        settings: {
            intervalo: 10000,
            limite: 100,
            layout: "auto",
            background: null,
            partnerLogo: null,
            showNeon: true,
            neonText: "Casamento VIP",
            instructionsText: "Envio interno pelo grupo do evento.",
        },
    };
}

describe("slideshowEngineReducer", () => {
    it("insere nova midia no topo sem interromper o slide atual", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            items: [
                makeReadyItem({ id: "photo-1" }),
                makeReadyItem({ id: "photo-2", url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-2.jpg" }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, {
            type: "new-media",
            media: {
                id: "photo-3",
                url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-3.jpg",
                type: "image",
                sender_name: "Bruna",
                texto_curto: "Mesa do bolo",
                highlight_score: 80,
                created_at: "2026-03-09T10:05:00-03:00",
            },
        });

        expect(next.items[0]?.id).toBe("photo-3");
        expect(next.currentIndex).toBe(1);
        expect(next.items[0]?.assetStatus).toBe("loading");
    });

    it("atualiza a mesma midia por id sem duplicar quando chega nova url", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            items: [
                makeReadyItem({
                    id: "photo-1",
                    url: "https://adm.tvvip.social/storage/vip-gallery/events/1/originals/photo-1.jpg",
                }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, {
            type: "media-ready",
            candidate: makeReadyItem({
                id: "photo-1",
                url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-1.jpg",
                highlight_score: 92,
                texto_curto: "Entrada dos noivos",
            }),
            metadata: {
                width: 720,
                height: 1280,
                orientation: "vertical",
                cachedAt: "2026-03-09T10:10:00-03:00",
            },
            matchByIdOnly: true,
        });

        expect(next.items).toHaveLength(1);
        expect(next.items[0]?.url).toContain("/processed/photo-1.jpg");
        expect(next.items[0]?.highlight_score).toBe(92);
        expect(next.items[0]?.assetStatus).toBe("ready");
    });

    it("remove a midia atual e avanca corretamente para a proxima pronta", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            items: [
                makeReadyItem({ id: "photo-1" }),
                makeReadyItem({ id: "photo-2", url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-2.jpg" }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, {
            type: "media-deleted",
            id: "photo-1",
        });

        expect(next.items).toHaveLength(1);
        expect(next.items[0]?.id).toBe("photo-2");
        expect(next.currentIndex).toBe(0);
        expect(next.status).toBe("playing");
    });

    it("ressincroniza o snapshot preservando cache local da midia ja pronta", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            items: [
                makeReadyItem({
                    id: "photo-1",
                    cachedAt: "2026-03-09T10:15:00-03:00",
                    playedAt: "2026-03-09T10:15:05-03:00",
                }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, {
            type: "apply-snapshot",
            snapshot: makeSnapshot([
                {
                    id: "photo-1",
                    url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-1.jpg",
                    type: "image",
                    sender_name: "Anderson",
                    texto_curto: "Mesa principal",
                    highlight_score: 70,
                    created_at: "2026-03-09T10:00:00-03:00",
                },
                {
                    id: "photo-2",
                    url: "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/photo-2.jpg",
                    type: "image",
                    sender_name: "Bruna",
                    texto_curto: null,
                    highlight_score: 0,
                    created_at: "2026-03-09T10:16:00-03:00",
                },
            ]),
        });

        expect(next.status).toBe("playing");
        expect(next.items[0]?.assetStatus).toBe("ready");
        expect(next.items[0]?.cachedAt).toBe("2026-03-09T10:15:00-03:00");
        expect(next.items[1]?.assetStatus).toBe("loading");
        expect(next.currentIndex).toBe(0);
    });
});
