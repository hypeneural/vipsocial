<?php

namespace App\Modules\Externas\Support;

use App\Models\User;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\Externas\Models\ExternalEventWhatsAppNotification;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ExternalEventWhatsAppMessageBuilder
{
    public function collaboratorMessage(ExternalEvent $event, User $collaborator, string $triggerType): string
    {
        $firstName = $this->firstName($collaborator->name);
        $headline = match ($triggerType) {
            ExternalEventWhatsAppNotification::TRIGGER_DATE_CHANGED => "🔄 {$firstName}, a data da sua externa foi alterada.",
            ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE => "⏰ {$firstName}, lembrete da sua externa.",
            default => "📅 {$firstName}, voce foi escalado para uma externa.",
        };
        $startLabel = $triggerType === ExternalEventWhatsAppNotification::TRIGGER_DATE_CHANGED
            ? 'Novo inicio'
            : 'Inicio';

        $lines = [
            $headline,
            '',
            "🎬 *Evento:* {$event->titulo}",
            "🗓️ *{$startLabel}:* {$this->formatEventStart($event)}",
            "📍 *Local:* {$event->local}",
        ];

        if ($triggerType === ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE) {
            array_splice($lines, 3, 0, ['⏳ *Comeca em:* 2 horas']);
        }

        $this->appendOptionalEventLines($lines, $event);

        return implode("\n", $lines);
    }

    public function defaultTargetMessage(ExternalEvent $event, string $triggerType): string
    {
        $headline = match ($triggerType) {
            ExternalEventWhatsAppNotification::TRIGGER_DATE_CHANGED => '🔄 *Data de externa alterada*',
            ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE => '⏰ *Lembrete de externa*',
            default => '📅 *Nova externa agendada*',
        };
        $startLabel = $triggerType === ExternalEventWhatsAppNotification::TRIGGER_DATE_CHANGED
            ? 'Novo inicio'
            : 'Inicio';

        $lines = [
            $headline,
            '',
            "🎬 *Evento:* {$event->titulo}",
            "🗓️ *{$startLabel}:* {$this->formatEventStart($event)}",
            "📍 *Local:* {$event->local}",
        ];

        if ($triggerType === ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE) {
            array_splice($lines, 3, 0, ['⏳ *Comeca em:* 2 horas']);
        }

        $collaborators = $this->collaboratorsList($event->collaborators);
        if ($collaborators !== '') {
            $lines[] = "👥 *Colaboradores:* {$collaborators}";
        }

        $this->appendOptionalEventLines($lines, $event, includeBriefing: false);

        return implode("\n", $lines);
    }

    public function firstName(?string $name): string
    {
        $normalized = trim((string) $name);

        if ($normalized === '') {
            return 'Ola';
        }

        return Str::of($normalized)->squish()->before(' ')->toString();
    }

    public function collaboratorRole(User $collaborator): string
    {
        $pivotRole = trim((string) ($collaborator->pivot?->funcao ?? ''));
        if ($pivotRole !== '') {
            return $pivotRole;
        }

        $role = trim((string) ($collaborator->role ?? ''));
        if ($role !== '') {
            return $role;
        }

        return trim((string) ($collaborator->department ?? ''));
    }

    public function formatEventDate(CarbonInterface|string|null $value): string
    {
        $date = ExternalEventDateTime::toUtcCarbon($value);

        if ($date === null) {
            return 'Data nao informada';
        }

        $timezone = (string) config('externas.timezone', ExternalEventDateTime::LOCAL_TIMEZONE);

        return $date->setTimezone($timezone)->format('d/m/Y H:i');
    }

    private function formatEventStart(ExternalEvent $event): string
    {
        $raw = $event->getRawOriginal('data_hora');

        if (is_string($raw) && trim($raw) !== '') {
            return $this->formatEventDate(CarbonImmutable::parse($raw, 'UTC'));
        }

        return $this->formatEventDate($event->data_hora);
    }

    private function collaboratorsList(Collection $collaborators): string
    {
        return $collaborators
            ->map(fn (User $user) => trim($user->name))
            ->filter()
            ->values()
            ->implode(', ');
    }

    private function appendOptionalEventLines(array &$lines, ExternalEvent $event, bool $includeBriefing = true): void
    {
        $address = trim((string) ($event->endereco_completo ?? ''));
        if ($address !== '') {
            $lines[] = "📌 *Endereco:* {$address}";
        }

        $contactName = trim((string) ($event->contato_nome ?? ''));
        $contactWhatsApp = trim((string) ($event->contato_whatsapp ?? ''));
        if ($contactName !== '' || $contactWhatsApp !== '') {
            $contact = trim(implode(' - ', array_filter([$contactName, $contactWhatsApp])));
            $lines[] = "☎️ *Contato:* {$contact}";
        }

        $briefing = $includeBriefing ? trim((string) ($event->briefing ?? '')) : '';
        if ($briefing !== '') {
            $lines[] = '📝 *Briefing:* '.Str::limit(Str::squish($briefing), 240);
        }
    }
}
