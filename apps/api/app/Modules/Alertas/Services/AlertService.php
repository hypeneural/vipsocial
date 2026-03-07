<?php

namespace App\Modules\Alertas\Services;

use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertScheduleRule;
use App\Modules\Alertas\Support\NextFiringResolver;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AlertService
{
    public function __construct(
        private readonly NextFiringResolver $nextFiringResolver,
        private readonly AlertMonitoringService $monitoringService
    ) {
    }

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(100, max(1, (int) ($filters['per_page'] ?? 20)));
        $search = trim((string) ($filters['search'] ?? ''));
        $includeInactive = (bool) ($filters['include_inactive'] ?? false);
        $includeArchived = (bool) ($filters['include_archived'] ?? false);
        $destinationId = $filters['destination_id'] ?? null;

        $query = Alert::query()
            ->with(['destinations', 'scheduleRules', 'latestScheduledRun'])
            ->withCount('destinations')
            ->orderByDesc('active')
            ->orderByDesc('id');

        if (!$includeArchived) {
            $query->whereNull('archived_at');
        }

        if (!$includeInactive) {
            $query->where('active', true);
        }

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($destinationId !== null) {
            $query->whereHas('destinations', fn(Builder $builder) => $builder->whereKey($destinationId));
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function create(array $validated, ?int $userId = null): Alert
    {
        return DB::transaction(function () use ($validated, $userId): Alert {
            $alert = Alert::query()->create([
                'title' => trim((string) $validated['title']),
                'message' => trim((string) $validated['message']),
                'active' => (bool) ($validated['active'] ?? true),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->syncDestinations($alert, (array) $validated['destination_ids']);
            $this->replaceScheduleRules($alert, $this->normalizeScheduleRulePayloads($validated));

            return $alert->fresh(['destinations', 'scheduleRules']);
        });
    }

    public function update(Alert $alert, array $validated, ?int $userId = null): Alert
    {
        return DB::transaction(function () use ($alert, $validated, $userId): Alert {
            if ($alert->archived_at !== null) {
                throw new RuntimeException('Alerta arquivado nao pode ser editado');
            }

            if (array_key_exists('title', $validated)) {
                $alert->title = trim((string) $validated['title']);
            }

            if (array_key_exists('message', $validated)) {
                $alert->message = trim((string) $validated['message']);
            }

            if (array_key_exists('active', $validated)) {
                $alert->active = (bool) $validated['active'];
            }

            $alert->updated_by = $userId;
            $alert->save();

            if (array_key_exists('destination_ids', $validated)) {
                $this->syncDestinations($alert, (array) $validated['destination_ids']);
            }

            if (array_key_exists('schedule_rules', $validated) || array_key_exists('schedules', $validated)) {
                $this->replaceScheduleRules($alert, $this->normalizeScheduleRulePayloads($validated));
            }

            return $alert->fresh(['destinations', 'scheduleRules']);
        });
    }

    public function archive(Alert $alert, ?int $userId = null): Alert
    {
        $alert->forceFill([
            'active' => false,
            'archived_at' => now((string) config('alertas.timezone', config('app.timezone', 'UTC'))),
            'updated_by' => $userId,
        ])->save();

        return $alert->fresh(['destinations', 'scheduleRules']);
    }

    public function toggle(Alert $alert, ?int $userId = null): Alert
    {
        if ($alert->archived_at !== null) {
            throw new RuntimeException('Alerta arquivado nao pode ser reativado por toggle');
        }

        $alert->forceFill([
            'active' => !$alert->active,
            'updated_by' => $userId,
        ])->save();

        return $alert->fresh(['destinations', 'scheduleRules']);
    }

    public function duplicate(Alert $alert, ?int $userId = null): Alert
    {
        return DB::transaction(function () use ($alert, $userId): Alert {
            $clone = Alert::query()->create([
                'title' => trim($alert->title . ' (Copia)'),
                'message' => $alert->message,
                'active' => false,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $clone->destinations()->sync($alert->destinations()->pluck('alert_destinations.id')->all());

            $rules = $alert->scheduleRules()
                ->get()
                ->map(fn(AlertScheduleRule $rule) => [
                    'schedule_type' => $rule->schedule_type,
                    'day_of_week' => $rule->day_of_week,
                    'specific_date' => $rule->specific_date?->toDateString(),
                    'time_hhmm' => $rule->time_hhmm,
                    'active' => $rule->active,
                ])->all();

            $this->replaceScheduleRules($clone, $rules);

            return $clone->fresh(['destinations', 'scheduleRules']);
        });
    }

    public function serialize(Alert $alert): array
    {
        $alert->loadMissing(['destinations', 'scheduleRules', 'latestScheduledRun']);
        $rules = $alert->scheduleRules->sortBy([
            ['schedule_type', 'asc'],
            ['specific_date', 'asc'],
            ['day_of_week', 'asc'],
            ['time_hhmm', 'asc'],
        ])->values();
        $monitoring = $this->monitoringService->evaluate($alert);
        $nextFireAt = $monitoring['next_fire_at'];

        return [
            'alert_id' => $alert->id,
            'title' => $alert->title,
            'message' => $alert->message,
            'active' => (bool) $alert->active,
            'archived_at' => $alert->archived_at?->toIso8601String(),
            'destination_count' => (int) ($alert->destinations_count ?? $alert->destinations->count()),
            'next_fire_at' => $nextFireAt,
            'monitoring' => $monitoring,
            'destinations' => $alert->destinations->map(fn($destination) => [
                'destination_id' => $destination->id,
                'name' => $destination->name,
                'phone_number' => $destination->target_value,
                'target_kind' => $destination->target_kind,
                'active' => (bool) $destination->active,
            ])->values()->all(),
            'schedule_rules' => $rules->map(fn(AlertScheduleRule $rule) => [
                'schedule_id' => $rule->id,
                'schedule_type' => $rule->schedule_type,
                'day_of_week' => $rule->day_of_week,
                'specific_date' => $rule->specific_date?->toDateString(),
                'time_hhmm' => $rule->time_hhmm,
                'rule_key' => $rule->rule_key,
                'active' => (bool) $rule->active,
                'schedule_active' => (bool) $rule->active,
                'next_fire_at' => $this->nextFiringResolver->nextForRule($rule)?->toIso8601String(),
                'created_at' => $rule->created_at?->toIso8601String(),
                'updated_at' => $rule->updated_at?->toIso8601String(),
            ])->all(),
            'schedules' => $this->buildLegacySchedules($rules)->all(),
            'created_at' => $alert->created_at?->toIso8601String(),
            'updated_at' => $alert->updated_at?->toIso8601String(),
        ];
    }

    private function syncDestinations(Alert $alert, array $destinationIds): void
    {
        $alert->destinations()->sync(collect($destinationIds)->map(fn($id) => (int) $id)->all());
    }

    private function replaceScheduleRules(Alert $alert, array $rules): void
    {
        $alert->scheduleRules()->delete();

        foreach ($rules as $rule) {
            $alert->scheduleRules()->create([
                'schedule_type' => $rule['schedule_type'],
                'day_of_week' => $rule['day_of_week'],
                'specific_date' => $rule['specific_date'],
                'time_hhmm' => $rule['time_hhmm'],
                'rule_key' => $this->buildRuleKey($rule),
                'active' => (bool) ($rule['active'] ?? true),
            ]);
        }
    }

    private function normalizeScheduleRulePayloads(array $validated): array
    {
        $directRules = collect((array) ($validated['schedule_rules'] ?? []))
            ->filter(fn($rule) => is_array($rule))
            ->map(fn(array $rule) => [
                'schedule_type' => $rule['schedule_type'],
                'day_of_week' => $rule['schedule_type'] === AlertScheduleRule::TYPE_WEEKLY ? (int) $rule['day_of_week'] : null,
                'specific_date' => $rule['schedule_type'] === AlertScheduleRule::TYPE_SPECIFIC_DATE ? $rule['specific_date'] : null,
                'time_hhmm' => (string) $rule['time_hhmm'],
                'active' => (bool) ($rule['active'] ?? true),
            ])
            ->unique(fn(array $rule) => $this->buildRuleKey($rule))
            ->values();

        if ($directRules->isNotEmpty()) {
            return $directRules->all();
        }

        return collect((array) ($validated['schedules'] ?? []))
            ->flatMap(function (array $schedule): array {
                $times = collect((array) ($schedule['times'] ?? []))
                    ->map(fn($time) => (string) $time)
                    ->filter()
                    ->values();

                $active = (bool) ($schedule['active'] ?? true);
                $specificDate = $schedule['specific_date'] ?? null;

                if (filled($specificDate)) {
                    return $times->map(fn(string $time) => [
                        'schedule_type' => AlertScheduleRule::TYPE_SPECIFIC_DATE,
                        'day_of_week' => null,
                        'specific_date' => $specificDate,
                        'time_hhmm' => $time,
                        'active' => $active,
                    ])->all();
                }

                $days = str_split((string) ($schedule['days_of_week'] ?? ''));
                $rules = [];

                foreach ($days as $index => $flag) {
                    if ($flag !== '1') {
                        continue;
                    }

                    foreach ($times as $time) {
                        $rules[] = [
                            'schedule_type' => AlertScheduleRule::TYPE_WEEKLY,
                            'day_of_week' => $index,
                            'specific_date' => null,
                            'time_hhmm' => $time,
                            'active' => $active,
                        ];
                    }
                }

                return $rules;
            })
            ->unique(fn(array $rule) => $this->buildRuleKey($rule))
            ->values()
            ->all();
    }

    private function buildRuleKey(array $rule): string
    {
        if ($rule['schedule_type'] === AlertScheduleRule::TYPE_SPECIFIC_DATE) {
            return sprintf('specific_date:%s:%s', $rule['specific_date'], $rule['time_hhmm']);
        }

        return sprintf('weekly:%d:%s', (int) $rule['day_of_week'], $rule['time_hhmm']);
    }

    private function buildLegacySchedules(Collection $rules): Collection
    {
        $weekly = $rules
            ->where('schedule_type', AlertScheduleRule::TYPE_WEEKLY)
            ->groupBy('time_hhmm')
            ->map(function (Collection $group, string $time) {
                $days = array_fill(0, 7, '0');

                foreach ($group as $rule) {
                    $days[(int) $rule->day_of_week] = '1';
                }

                return [
                    'days_of_week' => implode('', $days),
                    'times' => [$time],
                    'specific_date' => null,
                    'schedule_active' => (bool) $group->every(fn($rule) => $rule->active),
                ];
            })
            ->values();

        $specific = $rules
            ->where('schedule_type', AlertScheduleRule::TYPE_SPECIFIC_DATE)
            ->groupBy(fn(AlertScheduleRule $rule) => $rule->specific_date?->toDateString())
            ->map(function (Collection $group, ?string $date) {
                return [
                    'days_of_week' => null,
                    'times' => $group->pluck('time_hhmm')->sort()->values()->all(),
                    'specific_date' => $date,
                    'schedule_active' => (bool) $group->every(fn($rule) => $rule->active),
                ];
            })
            ->values();

        return $weekly->concat($specific)->values();
    }
}
