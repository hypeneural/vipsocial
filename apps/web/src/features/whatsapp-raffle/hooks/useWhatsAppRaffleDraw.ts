import { useMutation } from "@tanstack/react-query";
import whatsappRaffleService from "@/features/whatsapp-raffle/api/whatsappRaffle.service";

export function useWhatsAppRaffleDraw() {
    return useMutation({
        mutationFn: () => whatsappRaffleService.draw(),
    });
}
