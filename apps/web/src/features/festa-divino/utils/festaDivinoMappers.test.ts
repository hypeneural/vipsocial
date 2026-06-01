import { describe, expect, it } from "vitest";

import {
    mapFestaDivinoEvento,
    mapFestaDivinoFaqCategory,
    mapFestaDivinoPaginatedResponse,
    mapFestaDivinoVideo,
} from "./festaDivinoMappers";

describe("festaDivinoMappers", () => {
    it("normalizes legacy flags, tags and nested event relations", () => {
        const evento = mapFestaDivinoEvento({
            id: "10",
            edicao_id: "2",
            titulo: "Missa festiva",
            local_id: "4",
            categoria_id: "7",
            evento_pago: "0",
            destaque: 1,
            ativo: "true",
            tags: "missa, cortejo",
            local: { id: "4", nome: "Igreja Matriz" },
            categoria: { id: "7", nome: "Religioso" },
            atracoes: [{ id: "9", nome: "Banda", ordem_apresentacao: "2" }],
        });

        expect(evento.evento_pago).toBe(false);
        expect(evento.destaque).toBe(true);
        expect(evento.ativo).toBe(true);
        expect(evento.tags).toEqual(["missa", "cortejo"]);
        expect(evento.local?.id).toBe(4);
        expect(evento.categoria?.id).toBe(7);
        expect(evento.atracoes?.[0]?.ordem_apresentacao).toBe(2);
    });

    it("keeps faq categories predictable when booleans arrive as numbers", () => {
        expect(mapFestaDivinoFaqCategory({ id: "3", nome: "Geral", ordem: "5", ativo: 0 })).toMatchObject({
            id: 3,
            nome: "Geral",
            ordem: 5,
            ativo: false,
        });
    });

    it("maps paginated responses without leaking raw API shapes to the UI", () => {
        const response = mapFestaDivinoPaginatedResponse(
            {
                success: true,
                data: [{ id: "abc123", titulo: "Video", watch_url: "https://youtu.be/abc123" }],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 25,
                    total: 1,
                    from: 1,
                    to: 1,
                },
            },
            mapFestaDivinoVideo
        );

        expect(response.data[0]).toEqual({
            id: "abc123",
            titulo: "Video",
            descricao: null,
            thumb_url: null,
            watch_url: "https://youtu.be/abc123",
            embed_url: "",
            created_at: null,
            updated_at: null,
        });
    });
});
