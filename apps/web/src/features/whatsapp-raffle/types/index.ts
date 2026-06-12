export interface ApiEnvelope<TData, TMeta = unknown> {
    success: boolean;
    data: TData;
    message?: string;
    meta?: TMeta;
}

export type RaffleUiState =
    | "idle"
    | "requesting"
    | "preparing"
    | "shuffling"
    | "slowing-down"
    | "revealing-winner"
    | "success"
    | "revealing-phone"
    | "phone-revealed"
    | "error"
    | "empty";

export interface WhatsAppRaffleResult {
    draw_id: string;
    confirmation_code: string;
    group_id: string;
    group_name: string | null;
    campaign_name: string | null;
    campaign_key: string;
    phone_masked: string;
    phone_last_digits: string;
    photo_url: string | null;
    eligible_participants_count: number;
    can_reveal_phone: boolean;
    drawn_at: string;
}

export interface WhatsAppRaffleRevealPhoneResult {
    draw_id: string;
    confirmation_code: string;
    phone_full: string;
    phone_formatted: string;
    revealed_at: string;
}

export interface WhatsAppRaffleErrorPayload {
    success?: boolean;
    message?: string;
    code?: string;
    errors?: Record<string, string[]>;
}
