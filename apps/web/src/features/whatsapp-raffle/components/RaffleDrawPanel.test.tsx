import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RaffleDrawPanel } from "@/features/whatsapp-raffle/components/RaffleDrawPanel";
import whatsappRaffleService from "@/features/whatsapp-raffle/api/whatsappRaffle.service";

vi.mock("@/features/whatsapp-raffle/utils/raffleTiming", () => ({
    RAFFLE_TIMING: {
        preparingAtMs: 1,
        shufflingAtMs: 2,
        slowingDownAtMs: 3,
        revealAtMs: 4,
        revealWinnerMs: 1,
        minTotalMs: 1,
    },
}));

vi.mock("@/features/whatsapp-raffle/api/whatsappRaffle.service", () => ({
    default: {
        draw: vi.fn(),
        revealPhone: vi.fn(),
    },
}));

function renderPanel() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={client}>
            <RaffleDrawPanel />
        </QueryClientProvider>,
    );
}

describe("RaffleDrawPanel", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("draws and reveals a winner phone", async () => {
        vi.mocked(whatsappRaffleService.draw).mockResolvedValueOnce({
            draw_id: "draw-1",
            confirmation_code: "BR-1234",
            group_id: "120363407637460643-group",
            group_name: "SORTEIO VIP | Camisa do Brasil",
            campaign_name: "SORTEIO VIP",
            campaign_key: "vip-test",
            phone_masked: "****68144",
            phone_last_digits: "68144",
            photo_url: null,
            eligible_participants_count: 267,
            can_reveal_phone: true,
            drawn_at: "2026-06-12T12:00:00Z",
        });
        vi.mocked(whatsappRaffleService.revealPhone).mockResolvedValueOnce({
            draw_id: "draw-1",
            confirmation_code: "BR-1234",
            phone_full: "554791568144",
            phone_formatted: "+55 47 9156-8144",
            revealed_at: "2026-06-12T12:01:00Z",
        });

        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: /sortear/i }));

        await waitFor(() => expect(whatsappRaffleService.draw).toHaveBeenCalledTimes(1));

        expect(await screen.findByText("****68144")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /revelar telefone completo/i }));

        expect(await screen.findByText("+55 47 9156-8144")).toBeInTheDocument();
        expect(whatsappRaffleService.revealPhone).toHaveBeenCalledWith("draw-1");
    });

    it("shows empty state for no eligible participants", async () => {
        vi.mocked(whatsappRaffleService.draw).mockRejectedValueOnce({
            response: {
                data: {
                    code: "WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS",
                    message: "Nenhum participante elegivel encontrado.",
                },
            },
        });

        renderPanel();
        fireEvent.click(screen.getByRole("button", { name: /sortear/i }));

        expect(await screen.findByText(/nenhum participante elegivel/i)).toBeInTheDocument();
    });
});
