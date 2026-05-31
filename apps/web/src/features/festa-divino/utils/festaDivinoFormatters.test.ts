import { describe, expect, it } from "vitest";
import {
    buildFestaDivinoParams,
    countActive,
    formatFestaDivinoCurrency,
    formatFestaDivinoTimeRange,
    normalizeFestaDivinoAssetUrl,
} from "./festaDivinoFormatters";

describe("festaDivinoFormatters", () => {
    it("builds Laravel Query Builder params with filters, include and sort", () => {
        expect(
            buildFestaDivinoParams({
                page: 2,
                perPage: 50,
                search: " missa ",
                sort: "-data_evento",
                include: ["local", "categoria"],
                filters: {
                    ativo: true,
                    id_categoria: 3,
                    ignored: null,
                },
            })
        ).toEqual({
            page: 2,
            per_page: 50,
            "filter[search]": "missa",
            sort: "-data_evento",
            include: "local,categoria",
            "filter[ativo]": "1",
            "filter[id_categoria]": "3",
        });
    });

    it("formats money and time ranges for manager tables", () => {
        expect(formatFestaDivinoCurrency("12.5").replace(/\s/u, " ")).toBe("R$ 12,50");
        expect(formatFestaDivinoTimeRange("19:00:00", "20:30:00")).toBe("19:00 - 20:30");
        expect(formatFestaDivinoTimeRange(null, null)).toBe("Horario nao informado");
    });

    it("counts active rows when inactive rows are present", () => {
        expect(countActive([{ ativo: true }, { ativo: false }, {}])).toBe(2);
    });

    it("normalizes legacy relative media URLs to the public site", () => {
        expect(normalizeFestaDivinoAssetUrl("/assets/img.jpg")).toBe("https://festadodivinovip.com.br/assets/img.jpg");
        expect(normalizeFestaDivinoAssetUrl("https://cdn.example/img.jpg")).toBe("https://cdn.example/img.jpg");
    });
});
