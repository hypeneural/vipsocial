import { describe, expect, it } from "vitest";
import { getFestaDivinoApiMessage, getFestaDivinoFieldErrors } from "./festaDivinoApiErrors";

describe("festaDivinoApiErrors", () => {
    it("extrai erros por campo do envelope Laravel", () => {
        const error = {
            response: {
                data: {
                    message: "Erro de validacao",
                    errors: {
                        titulo: ["Informe o titulo."],
                        data_evento: ["Data fora do periodo.", "Outra mensagem."],
                    },
                },
            },
        };

        expect(getFestaDivinoFieldErrors(error)).toEqual({
            titulo: "Informe o titulo.",
            data_evento: "Data fora do periodo.",
        });
    });

    it("prioriza a primeira mensagem de validacao para toast", () => {
        const error = {
            response: {
                data: {
                    message: "Erro de validacao",
                    errors: {
                        nome: ["Informe o nome."],
                    },
                },
            },
        };

        expect(getFestaDivinoApiMessage(error)).toBe("Informe o nome.");
    });

    it("usa mensagem geral ou fallback quando nao houver erros de campo", () => {
        expect(getFestaDivinoApiMessage({ response: { data: { message: "Bloqueado." } } })).toBe("Bloqueado.");
        expect(getFestaDivinoApiMessage({})).toBe("Nao foi possivel salvar.");
    });
});
