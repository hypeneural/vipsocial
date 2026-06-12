import { api } from "@/services/api";
import type {
    ApiEnvelope,
    WhatsAppRaffleResult,
    WhatsAppRaffleRevealPhoneResult,
} from "@/features/whatsapp-raffle/types";

const DRAW_ENDPOINT = "/whatsapp/raffle/draw";
const REVEAL_ENDPOINT = (drawId: string) => `/whatsapp/raffle/draws/${drawId}/reveal-phone`;

export const whatsappRaffleService = {
    async draw(): Promise<WhatsAppRaffleResult> {
        const { data } = await api.post<ApiEnvelope<WhatsAppRaffleResult>>(DRAW_ENDPOINT);

        return data.data;
    },

    async revealPhone(drawId: string): Promise<WhatsAppRaffleRevealPhoneResult> {
        const { data } = await api.post<ApiEnvelope<WhatsAppRaffleRevealPhoneResult>>(REVEAL_ENDPOINT(drawId));

        return data.data;
    },
};

export default whatsappRaffleService;
