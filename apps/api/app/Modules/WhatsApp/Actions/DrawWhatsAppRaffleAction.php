<?php

namespace App\Modules\WhatsApp\Actions;

use App\Models\User;
use App\Modules\WhatsApp\Exceptions\WhatsAppRaffleException;
use App\Modules\WhatsApp\Models\WhatsAppRaffleDraw;
use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

class DrawWhatsAppRaffleAction
{
    public function __construct(private readonly WhatsAppService $whatsAppService)
    {
    }

    public function execute(?User $user = null, array $overrides = []): array
    {
        $groupId = trim((string) ($overrides['group_id'] ?? config('whatsapp.raffle.group_id', '')));
        $campaignName = trim((string) ($overrides['campaign_name'] ?? config('whatsapp.raffle.campaign_name', '')));
        $campaignKey = Str::slug((string) ($overrides['campaign_key'] ?? config('whatsapp.raffle.campaign_key', 'default')));
        $campaignKey = $campaignKey !== '' ? $campaignKey : 'default';

        if ($groupId === '') {
            throw new WhatsAppRaffleException(
                'Grupo do sorteio nao configurado.',
                'WHATSAPP_RAFFLE_GROUP_NOT_CONFIGURED',
                422
            );
        }

        $lock = Cache::lock(
            "whatsapp-raffle:draw:{$groupId}:{$campaignKey}",
            max(5, (int) config('whatsapp.raffle.lock_ttl_seconds', 10))
        );

        if (! $lock->get()) {
            throw new WhatsAppRaffleException(
                'Ja existe um sorteio em andamento.',
                'WHATSAPP_RAFFLE_LOCKED',
                409
            );
        }

        try {
            return $this->draw($groupId, $campaignName, $campaignKey, $user);
        } finally {
            $lock->release();
        }
    }

    private function draw(string $groupId, string $campaignName, string $campaignKey, ?User $user): array
    {
        $metadata = $this->whatsAppService->lightGroupMetadata($groupId);
        $eligible = $this->eligibleParticipants($metadata);

        if ($eligible === []) {
            throw new WhatsAppRaffleException(
                'Nenhum participante elegivel encontrado.',
                'WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS',
                422
            );
        }

        $winnerPhone = $eligible[random_int(0, count($eligible) - 1)];
        $photoUrl = $this->winnerPhotoUrl($winnerPhone);
        $phoneLastDigits = $this->lastDigits($winnerPhone);
        $confirmationCode = $this->confirmationCode();

        $draw = WhatsAppRaffleDraw::query()->create([
            'confirmation_code' => $confirmationCode,
            'group_id' => (string) ($metadata['phone'] ?? $groupId),
            'group_subject' => $this->stringOrNull($metadata['subject'] ?? $metadata['name'] ?? null),
            'campaign_name' => $campaignName !== '' ? $campaignName : null,
            'campaign_key' => $campaignKey,
            'eligible_participants_count' => count($eligible),
            'winner_phone_hash' => $this->phoneHash($winnerPhone),
            'winner_phone_encrypted' => $winnerPhone,
            'phone_last_digits' => $phoneLastDigits,
            'winner_had_photo' => $photoUrl !== null,
            'photo_url' => $photoUrl,
            'drawn_by' => $user?->id,
            'drawn_at' => now(),
            'provider' => 'zapi',
            'provider_payload_hash' => hash('sha256', json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: ''),
        ]);

        return $this->serializeDraw($draw);
    }

    private function eligibleParticipants(array $metadata): array
    {
        $participants = is_array($metadata['participants'] ?? null) ? $metadata['participants'] : [];
        $owner = $this->digits($metadata['owner'] ?? null);
        $excludedPhones = $this->excludedPhones();
        $excludeAdmins = (bool) config('whatsapp.raffle.exclude_admins', true);
        $eligible = [];

        foreach ($participants as $participant) {
            if (! is_array($participant)) {
                continue;
            }

            if ($excludeAdmins && ((bool) ($participant['isAdmin'] ?? false) || (bool) ($participant['isSuperAdmin'] ?? false))) {
                continue;
            }

            $phone = $this->digits($participant['phone'] ?? null);

            if (! preg_match('/^\d{12,15}$/', $phone)) {
                continue;
            }

            if ($owner !== '' && $phone === $owner) {
                continue;
            }

            if (in_array($phone, $excludedPhones, true)) {
                continue;
            }

            $eligible[$phone] = $phone;
        }

        return array_values($eligible);
    }

    private function winnerPhotoUrl(string $phone): ?string
    {
        try {
            $payload = $this->whatsAppService->profilePicture($phone);
        } catch (Throwable $e) {
            report($e);

            return null;
        }

        $link = $this->stringOrNull($payload['link'] ?? null);

        if ($link === null || $link === 'null') {
            return null;
        }

        return $link;
    }

    private function excludedPhones(): array
    {
        $configured = config('whatsapp.raffle.excluded_phones', []);

        if (is_string($configured)) {
            $configured = explode(',', $configured);
        }

        if (! is_array($configured)) {
            return [];
        }

        return array_values(array_filter(array_map(
            fn(mixed $phone): string => $this->digits($phone),
            $configured
        )));
    }

    private function serializeDraw(WhatsAppRaffleDraw $draw): array
    {
        return [
            'draw_id' => $draw->id,
            'confirmation_code' => $draw->confirmation_code,
            'group_id' => $draw->group_id,
            'group_name' => $draw->group_subject,
            'campaign_name' => $draw->campaign_name,
            'campaign_key' => $draw->campaign_key,
            'phone_masked' => '****' . $draw->phone_last_digits,
            'phone_last_digits' => $draw->phone_last_digits,
            'photo_url' => $draw->photo_url,
            'eligible_participants_count' => $draw->eligible_participants_count,
            'can_reveal_phone' => (bool) config('whatsapp.raffle.allow_phone_reveal', true),
            'drawn_at' => $draw->drawn_at?->toJSON(),
        ];
    }

    private function lastDigits(string $phone): string
    {
        $length = max(4, (int) config('whatsapp.raffle.phone_last_digits', 5));

        return substr($phone, -$length);
    }

    private function confirmationCode(): string
    {
        return 'BR-' . strtoupper(bin2hex(random_bytes(2)));
    }

    private function phoneHash(string $phone): string
    {
        return hash_hmac('sha256', $phone, (string) config('app.key'));
    }

    private function digits(mixed $value): string
    {
        return preg_replace('/\D+/', '', trim((string) $value)) ?? '';
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
