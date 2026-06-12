import { useMutation } from "@tanstack/react-query";
import whatsappRaffleService from "@/features/whatsapp-raffle/api/whatsappRaffle.service";

export function useRevealWhatsAppRafflePhone() {
    return useMutation({
        mutationFn: (drawId: string) => whatsappRaffleService.revealPhone(drawId),
    });
}
