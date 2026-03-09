import { describe, expect, it } from "vitest";
import { createEmptyPlayerState } from "./selectors";
import { slideshowEngineReducer } from "./reducer";
import type { SlideMedia, SlideRuntimeItem, SlideshowBootData } from "../types";

function makeReadyItem(overrides: Partial<SlideRuntimeItem> = {}): SlideRuntimeItem {
    const id = overrides.id ?? "photo-1";
    const senderName = overrides.sender_name ?? "Anderson";

    return {
        id,
        url: overrides.url ?? `https://adm.tvvip.social/storage/vip-gallery/events/1/processed/${id}.jpg`,
        type: "image",
        sender_name: senderName,
        sender_key: overrides.sender_key ?? `sender:${senderName.toLocaleLowerCase("pt-BR")}`,
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

function makeMedia(overrides: Partial<SlideMedia> = {}): SlideMedia {
    const id = overrides.id ?? "photo-new";
    const senderName = overrides.sender_name ?? "Bruna";

    return {
        id,
        url: overrides.url ?? `https://adm.tvvip.social/storage/vip-gallery/events/1/processed/${id}.jpg`,
        type: "image",
        sender_name: senderName,
        sender_key: overrides.sender_key ?? `sender:${senderName.toLocaleLowerCase("pt-BR")}`,
        texto_curto: overrides.texto_curto ?? null,
        highlight_score: overrides.highlight_score ?? 0,
        created_at: overrides.created_at ?? "2026-03-09T10:05:00-03:00",
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
            showSenderCredit: false,
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
                makeReadyItem({ id: "photo-2", sender_name: "Bruna", sender_key: "sender:bruna" }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, {
            type: "new-media",
            media: makeMedia({
                id: "photo-3",
                sender_name: "Carlos",
                sender_key: "sender:carlos",
                texto_curto: "Mesa do bolo",
                highlight_score: 80,
            }),
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
                makeReadyItem({ id: "photo-2", sender_name: "Bruna", sender_key: "sender:bruna" }),
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
                makeMedia({
                    id: "photo-1",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    texto_curto: "Mesa principal",
                    highlight_score: 70,
                    created_at: "2026-03-09T10:00:00-03:00",
                }),
                makeMedia({
                    id: "photo-2",
                    sender_name: "Bruna",
                    sender_key: "sender:bruna",
                    created_at: "2026-03-09T10:16:00-03:00",
                }),
            ]),
        });

        expect(next.status).toBe("playing");
        expect(next.settings?.showSenderCredit).toBe(false);
        expect(next.items[0]?.assetStatus).toBe("ready");
        expect(next.items[0]?.cachedAt).toBe("2026-03-09T10:15:00-03:00");
        expect(next.items[0]?.sender_key).toBe("sender:anderson");
        expect(next.items[1]?.assetStatus).toBe("loading");
        expect(next.currentIndex).toBe(0);
    });

    it("prioriza a primeira novidade de outro remetente antes do backlog do remetente atual", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            event: {
                id: 1,
                title: "Casamento VIP",
                slideshow_code: "M6NS6M",
                status: "active" as const,
            },
            items: [
                makeReadyItem({
                    id: "a1",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    created_at: "2026-03-09T10:00:00-03:00",
                    playedAt: "2026-03-09T10:00:30-03:00",
                }),
                makeReadyItem({
                    id: "a2",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    created_at: "2026-03-09T10:01:00-03:00",
                }),
                makeReadyItem({
                    id: "b1",
                    sender_name: "Bruna",
                    sender_key: "sender:bruna",
                    created_at: "2026-03-09T10:02:00-03:00",
                }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, { type: "advance" });

        expect(next.currentIndex).toBe(2);
        expect(next.items[2]?.playedAt).not.toBeNull();
    });

    it("faz round-robin entre remetentes quando todos ja tiveram a primeira foto exibida", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            event: {
                id: 1,
                title: "Casamento VIP",
                slideshow_code: "M6NS6M",
                status: "active" as const,
            },
            items: [
                makeReadyItem({
                    id: "a1",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    playedAt: "2026-03-09T10:00:30-03:00",
                }),
                makeReadyItem({
                    id: "a2",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    created_at: "2026-03-09T10:01:00-03:00",
                }),
                makeReadyItem({
                    id: "b1",
                    sender_name: "Bruna",
                    sender_key: "sender:bruna",
                    created_at: "2026-03-09T10:00:20-03:00",
                    playedAt: "2026-03-09T10:00:10-03:00",
                }),
                makeReadyItem({
                    id: "b2",
                    sender_name: "Bruna",
                    sender_key: "sender:bruna",
                    created_at: "2026-03-09T10:02:00-03:00",
                }),
            ],
            currentIndex: 0,
        };

        const next = slideshowEngineReducer(current, { type: "advance" });

        expect(next.currentIndex).toBe(3);
        expect(next.items[3]?.sender_key).toBe("sender:bruna");
    });

    it("preemptivamente pausa o player e impede o advance ate voltar para active", () => {
        const current = {
            ...createEmptyPlayerState("M6NS6M"),
            status: "playing" as const,
            event: {
                id: 1,
                title: "Casamento VIP",
                slideshow_code: "M6NS6M",
                status: "active" as const,
            },
            items: [
                makeReadyItem({
                    id: "a1",
                    sender_name: "Anderson",
                    sender_key: "sender:anderson",
                    playedAt: "2026-03-09T10:00:30-03:00",
                }),
                makeReadyItem({
                    id: "b1",
                    sender_name: "Bruna",
                    sender_key: "sender:bruna",
                }),
            ],
            currentIndex: 0,
        };

        const paused = slideshowEngineReducer(current, {
            type: "status-changed",
            payload: {
                status: "paused",
                reason: "manual_pause",
                updated_at: "2026-03-09T10:01:00-03:00",
            },
        });

        const whilePaused = slideshowEngineReducer(paused, { type: "advance" });

        expect(paused.status).toBe("paused");
        expect(paused.currentIndex).toBe(0);
        expect(whilePaused.currentIndex).toBe(0);

        const resumed = slideshowEngineReducer(paused, {
            type: "status-changed",
            payload: {
                status: "active",
                reason: "resume",
                updated_at: "2026-03-09T10:02:00-03:00",
            },
        });

        const afterResume = slideshowEngineReducer(resumed, { type: "advance" });

        expect(resumed.status).toBe("playing");
        expect(afterResume.currentIndex).toBe(1);
    });
});
