<?php

namespace App\Modules\Alertas\Services;

use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertDispatchRun;
use App\Modules\Alertas\Support\NextFiringResolver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AlertMonitoringService
{
    public function __construct(private readonly NextFiringResolver $nextFiringResolver)
    {
    }

    public function evaluate(Alert $alert, ?CarbonImmutable $now = null): array
    {
        return $this->evaluateMany(collect([$alert]), $now)->get($alert->id, $this->defaultState());
    }

    /**
     * @param  Collection<int, Alert>  $alerts
     * @return Collection<int, array>
     */
    public function evaluateMany(Collection $alerts, ?CarbonImmutable $now = null): Collection
    {
        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $now ??= CarbonImmutable::now($timezone)->startOfMinute();
        $graceMinutes = max(1, (int) config('alertas.monitoring.overdue_grace_minutes', 2));

        return $alerts->mapWithKeys(function (Alert $alert) use ($now, $graceMinutes): array {
            $alert->loadMissing([
                'scheduleRules',
                'destinations',
                'latestScheduledRun',
            ]);

            $activeRules = $alert->scheduleRules->where('active', true)->values();
            $activeDestinations = $alert->destinations->where('active', true)->values();
            $effectiveStart = $alert->updated_at?->copy()->setTimezone($now->getTimezone())->startOfMinute()
                ?? $alert->created_at?->copy()->setTimezone($now->getTimezone())->startOfMinute()
                ?? $now;

            if ($activeRules->isEmpty()) {
                return [$alert->id => $this->state(
                    state: 'no_schedule',
                    label: 'Sem agendamento',
                    nextFireAt: null,
                    scheduledFor: null,
                )];
            }

            if ($activeDestinations->isEmpty()) {
                return [$alert->id => $this->state(
                    state: 'no_active_destinations',
                    label: 'Sem destinos ativos',
                    nextFireAt: $this->resolveNextFireAt($activeRules, $now),
                    scheduledFor: null,
                )];
            }

            $nextFireAt = $this->resolveNextFireAt($activeRules, $now);
            $lastDueAt = $this->resolveLastDueAt($activeRules, $now);
            if ($lastDueAt !== null && $lastDueAt->lessThan($effectiveStart)) {
                $lastDueAt = null;
            }
            $latestScheduledRun = $alert->latestScheduledRun;

            if ($lastDueAt === null) {
                return [$alert->id => $this->state(
                    state: 'upcoming',
                    label: 'No horario',
                    nextFireAt: $nextFireAt,
                    scheduledFor: null,
                )];
            }

            $delayMinutes = max(0, $lastDueAt->diffInMinutes($now));
            $runForDue = $latestScheduledRun !== null
                && $latestScheduledRun->scheduled_for !== null
                && $latestScheduledRun->scheduled_for->copy()->setTimezone($now->getTimezone())->startOfMinute()->equalTo($lastDueAt)
                ? $latestScheduledRun
                : null;

            if ($runForDue === null) {
                if ($delayMinutes > $graceMinutes) {
                    return [$alert->id => $this->state(
                        state: 'missed',
                        label: 'Disparo atrasado',
                        nextFireAt: $nextFireAt,
                        scheduledFor: $lastDueAt,
                        delayMinutes: $delayMinutes,
                    )];
                }

                return [$alert->id => $this->state(
                    state: 'pending',
                    label: 'Aguardando scheduler',
                    nextFireAt: $nextFireAt,
                    scheduledFor: $lastDueAt,
                    delayMinutes: $delayMinutes,
                )];
            }

            return [$alert->id => $this->stateFromRun(
                $runForDue,
                $nextFireAt,
                $lastDueAt,
                $now,
                $graceMinutes
            )];
        });
    }

    private function stateFromRun(
        AlertDispatchRun $run,
        ?CarbonImmutable $nextFireAt,
        CarbonImmutable $scheduledFor,
        CarbonImmutable $now,
        int $graceMinutes
    ): array {
        $delayMinutes = max(0, $scheduledFor->diffInMinutes($now));
        $deliveryDelayMinutes = $run->finished_at !== null
            ? max(0, $scheduledFor->diffInMinutes($run->finished_at->copy()->setTimezone($scheduledFor->getTimezone())))
            : $delayMinutes;

        return match ($run->status) {
            AlertDispatchRun::STATUS_SUCCESS => $deliveryDelayMinutes > $graceMinutes
                ? $this->state(
                    state: 'sent_late',
                    label: sprintf('Enviado com %d min de atraso', $deliveryDelayMinutes),
                    nextFireAt: $nextFireAt,
                    scheduledFor: $scheduledFor,
                    delayMinutes: $deliveryDelayMinutes,
                    run: $run
                )
                : $this->state(
                    state: 'success',
                    label: 'Envio em dia',
                    nextFireAt: $nextFireAt,
                    scheduledFor: $scheduledFor,
                    delayMinutes: $deliveryDelayMinutes,
                    run: $run
                ),
            AlertDispatchRun::STATUS_PENDING, AlertDispatchRun::STATUS_PROCESSING => $delayMinutes > $graceMinutes
                ? $this->state(
                    state: 'delayed',
                    label: 'Fila atrasada',
                    nextFireAt: $nextFireAt,
                    scheduledFor: $scheduledFor,
                    delayMinutes: $delayMinutes,
                    run: $run
                )
                : $this->state(
                    state: 'pending',
                    label: 'Na fila',
                    nextFireAt: $nextFireAt,
                    scheduledFor: $scheduledFor,
                    delayMinutes: $delayMinutes,
                    run: $run
                ),
            AlertDispatchRun::STATUS_PARTIAL => $this->state(
                state: 'partial',
                label: 'Envio parcial',
                nextFireAt: $nextFireAt,
                scheduledFor: $scheduledFor,
                delayMinutes: $deliveryDelayMinutes,
                run: $run
            ),
            AlertDispatchRun::STATUS_FAILED, AlertDispatchRun::STATUS_CANCELLED => $this->state(
                state: 'failed',
                label: 'Falha no ultimo disparo',
                nextFireAt: $nextFireAt,
                scheduledFor: $scheduledFor,
                delayMinutes: $deliveryDelayMinutes,
                run: $run
            ),
            default => $this->state(
                state: 'unknown',
                label: 'Estado indefinido',
                nextFireAt: $nextFireAt,
                scheduledFor: $scheduledFor,
                delayMinutes: $deliveryDelayMinutes,
                run: $run
            ),
        };
    }

    private function resolveNextFireAt(Collection $rules, CarbonImmutable $now): ?CarbonImmutable
    {
        return $rules
            ->map(fn($rule) => $this->nextFiringResolver->nextForRule($rule, $now))
            ->filter()
            ->sortBy(fn(CarbonImmutable $candidate) => $candidate->getTimestamp())
            ->first();
    }

    private function resolveLastDueAt(Collection $rules, CarbonImmutable $now): ?CarbonImmutable
    {
        return $rules
            ->map(fn($rule) => $this->nextFiringResolver->latestDueForRule($rule, $now))
            ->filter()
            ->sortByDesc(fn(CarbonImmutable $candidate) => $candidate->getTimestamp())
            ->first();
    }

    private function state(
        string $state,
        string $label,
        ?CarbonImmutable $nextFireAt,
        ?CarbonImmutable $scheduledFor,
        int $delayMinutes = 0,
        ?AlertDispatchRun $run = null
    ): array {
        return [
            'state' => $state,
            'label' => $label,
            'next_fire_at' => $nextFireAt?->toIso8601String(),
            'scheduled_for' => $scheduledFor?->toIso8601String(),
            'delay_minutes' => $delayMinutes,
            'last_run_status' => $run?->status,
            'last_run_created_at' => $run?->created_at?->toIso8601String(),
            'last_run_finished_at' => $run?->finished_at?->toIso8601String(),
        ];
    }

    private function defaultState(): array
    {
        return [
            'state' => 'unknown',
            'label' => 'Estado indefinido',
            'next_fire_at' => null,
            'scheduled_for' => null,
            'delay_minutes' => 0,
            'last_run_status' => null,
            'last_run_created_at' => null,
            'last_run_finished_at' => null,
        ];
    }
}
