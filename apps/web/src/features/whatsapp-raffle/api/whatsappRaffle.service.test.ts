import { describe, expect, it, vi } from "vitest";
import whatsappRaffleService from "@/features/whatsapp-raffle/api/whatsappRaffle.service";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
    api: {
        post: vi.fn(),
    },
}));

describe("whatsappRaffleService", () => {
    it("draws using the raffle endpoint", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { success: true, data: { draw_id: "draw-1" } },
        });

        await expect(whatsappRaffleService.draw()).resolves.toEqual({ draw_id: "draw-1" });

        expect(api.post).toHaveBeenCalledWith("/whatsapp/raffle/draw");
    });

    it("reveals phone using the draw id", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { success: true, data: { phone_full: "554791568144" } },
        });

        await expect(whatsappRaffleService.revealPhone("draw-1")).resolves.toEqual({
            phone_full: "554791568144",
        });

        expect(api.post).toHaveBeenCalledWith("/whatsapp/raffle/draws/draw-1/reveal-phone");
    });
});
