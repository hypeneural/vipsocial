<?php

namespace App\Modules\WhatsApp\Actions;

use App\Models\User;
use App\Modules\WhatsApp\Exceptions\WhatsAppRaffleException;
use App\Modules\WhatsApp\Models\WhatsAppRaffleDraw;
use App\Modules\WhatsApp\Models\WhatsAppRafflePhoneReveal;
use Illuminate\Support\Facades\DB;

class RevealWhatsAppRafflePhoneAction
{
    public function execute(
        WhatsAppRaffleDraw $draw,
        ?User $user = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): array {
        if (! (bool) config('whatsapp.raffle.allow_phone_reveal', true)) {
            throw new WhatsAppRaffleException(
                'Revelacao de telefone desabilitada',
                'WHATSAPP_RAFFLE_REVEAL_DISABLED',
                403
            );
        }

        return DB::transaction(function () use ($draw, $user, $ipAddress, $userAgent): array {
            $phone = (string) $draw->winner_phone_encrypted;
            $revealedAt = now();

            WhatsAppRafflePhoneReveal::query()->create([
                'draw_id' => $draw->id,
                'revealed_by' => $user?->id,
                'revealed_at' => $revealedAt,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);

            $draw->forceFill([
                'reveal_count' => $draw->reveal_count + 1,
                'last_revealed_at' => $revealedAt,
            ])->save();

            return [
                'draw_id' => $draw->id,
                'confirmation_code' => $draw->confirmation_code,
                'phone_full' => $phone,
                'phone_formatted' => $this->formatPhone($phone),
                'revealed_at' => $revealedAt->toJSON(),
            ];
        });
    }

    private function formatPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '55') && strlen($digits) === 13) {
            return sprintf(
                '+55 %s %s-%s',
                substr($digits, 2, 2),
                substr($digits, 4, 5),
                substr($digits, 9, 4)
            );
        }

        if (str_starts_with($digits, '55') && strlen($digits) === 12) {
            return sprintf(
                '+55 %s %s-%s',
                substr($digits, 2, 2),
                substr($digits, 4, 4),
                substr($digits, 8, 4)
            );
        }

        return $digits;
    }
}
