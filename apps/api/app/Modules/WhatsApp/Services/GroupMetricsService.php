<?php

namespace App\Modules\WhatsApp\Services;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppGroupsOverviewDailySnapshot;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GroupMetricsService
{
    public function dashboard(string $window): array
    {
        [$normalizedWindow, $windowStart] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('whatsapp.cache.group_metrics_ttl_sec', 120));
        $cacheKey = "whatsapp:groups:metrics:dashboard:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($normalizedWindow, $windowStart) {
            $timezone = (string) config('app.timezone', 'UTC');
            $today = CarbonImmutable::now($timezone)->startOfDay();
            $overview = $this->overview($normalizedWindow);
            $groupsPayload = $this->byGroup($normalizedWindow);
            $series = $this->dailyOverviewSeries($windowStart, $today, $overview);
            $capturedSeries = array_values(array_filter($series, fn(array $point) => $point['captured'] === true));
            $baselinePoint = $capturedSeries[0] ?? null;
            $lastCapturedPoint = !empty($capturedSeries) ? $capturedSeries[array_key_last($capturedSeries)] : null;
            $currentUniqueMembers = (int) ($overview['unique_members_current'] ?? 0);
            $baselineUniqueMembers = (int) ($baselinePoint['unique_members_current'] ?? $currentUniqueMembers);
            $uniqueGrowthDelta = $currentUniqueMembers - $baselineUniqueMembers;
            $totalMembershipsCurrent = (int) ($overview['total_memberships_current'] ?? 0);

            $groups = collect($groupsPayload['items'] ?? [])
                ->map(function (array $group, int $index) use ($totalMembershipsCurrent) {
                    $membersCurrent = (int) ($group['members_current'] ?? 0);

                    return [
                        ...$group,
                        'rank' => $index + 1,
                        'share_of_total_memberships_pct' => $totalMembershipsCurrent > 0
                            ? round(($membersCurrent / $totalMembershipsCurrent) * 100, 2)
                            : 0,
                    ];
                })
                ->values()
                ->all();

            return [
                'window' => $normalizedWindow,
                'summary' => [
                    'groups_count' => (int) ($overview['groups_count'] ?? 0),
                    'total_memberships_current' => $totalMembershipsCurrent,
                    'unique_members_current' => $currentUniqueMembers,
                    'multi_group_members_current' => (int) ($overview['multi_group_members_current'] ?? 0),
                    'multi_group_ratio' => (float) ($overview['multi_group_ratio'] ?? 0),
                    'movement' => [
                        'joins' => (int) ($overview['movement']['joins'] ?? 0),
                        'leaves' => (int) ($overview['movement']['leaves'] ?? 0),
                        'net_growth' => (int) ($overview['movement']['net_growth'] ?? 0),
                    ],
                    'unique_growth' => [
                        'baseline' => $baselineUniqueMembers,
                        'current' => $currentUniqueMembers,
                        'delta' => $uniqueGrowthDelta,
                        'delta_pct' => $baselineUniqueMembers > 0
                            ? round(($uniqueGrowthDelta / $baselineUniqueMembers) * 100, 2)
                            : null,
                        'captured_points' => count($capturedSeries),
                        'has_history' => count($capturedSeries) >= 2,
                        'first_snapshot_date' => $baselinePoint['date'] ?? null,
                        'last_snapshot_date' => $lastCapturedPoint['date'] ?? null,
                    ],
                ],
                'series' => $series,
                'groups' => $groups,
            ];
        });
    }

    public function overview(string $window): array
    {
        [$normalizedWindow, $windowStart] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('whatsapp.cache.group_metrics_ttl_sec', 120));
        $cacheKey = "whatsapp:groups:metrics:overview:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($normalizedWindow, $windowStart) {
            $groupIds = WhatsAppGroup::query()->active()->pluck('id');
            $groupsCount = $groupIds->count();

            if ($groupsCount === 0) {
                return [
                    'window' => $normalizedWindow,
                    'groups_count' => 0,
                    'total_memberships_current' => 0,
                    'unique_members_current' => 0,
                    'multi_group_members_current' => 0,
                    'multi_group_ratio' => 0,
                    'movement' => [
                        'joins' => 0,
                        'leaves' => 0,
                        'net_growth' => 0,
                    ],
                ];
            }

            $activeMemberships = WhatsAppGroupMembership::query()
                ->whereIn('group_fk', $groupIds)
                ->active();

            $totalMembershipsCurrent = (clone $activeMemberships)->count();
            $uniqueMembersCurrent = (clone $activeMemberships)->distinct('participant_fk')->count('participant_fk');

            $multiGroupMembersCurrent = (int) DB::query()
                ->fromSub(
                    DB::table('whatsapp_group_memberships')
                        ->select('participant_fk')
                        ->whereIn('group_fk', $groupIds)
                        ->where('status', WhatsAppGroupMembership::STATUS_ACTIVE)
                        ->groupBy('participant_fk')
                        ->havingRaw('COUNT(*) >= 2'),
                    'multi_group_members'
                )
                ->count();

            $joins = WhatsAppGroupMemberEvent::query()
                ->whereIn('group_fk', $groupIds)
                ->where('event_type', WhatsAppGroupMemberEvent::TYPE_JOIN)
                ->where('event_at', '>=', $windowStart)
                ->count();

            $leaves = WhatsAppGroupMemberEvent::query()
                ->whereIn('group_fk', $groupIds)
                ->where('event_type', WhatsAppGroupMemberEvent::TYPE_LEAVE)
                ->where('event_at', '>=', $windowStart)
                ->count();

            return [
                'window' => $normalizedWindow,
                'groups_count' => $groupsCount,
                'total_memberships_current' => $totalMembershipsCurrent,
                'unique_members_current' => $uniqueMembersCurrent,
                'multi_group_members_current' => $multiGroupMembersCurrent,
                'multi_group_ratio' => $uniqueMembersCurrent > 0
                    ? round($multiGroupMembersCurrent / $uniqueMembersCurrent, 4)
                    : 0,
                'movement' => [
                    'joins' => $joins,
                    'leaves' => $leaves,
                    'net_growth' => $joins - $leaves,
                ],
            ];
        });
    }

    public function byGroup(string $window): array
    {
        [$normalizedWindow, $windowStart] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('whatsapp.cache.group_metrics_ttl_sec', 120));
        $cacheKey = "whatsapp:groups:metrics:by-group:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($normalizedWindow, $windowStart) {
            $groups = WhatsAppGroup::query()
                ->active()
                ->withCount([
                    'memberships as members_current' => fn($query) => $query->active(),
                ])
                ->orderByDesc('members_current')
                ->orderBy('name')
                ->get([
                    'id',
                    'group_id',
                    'name',
                    'subject',
                    'last_synced_at',
                ]);

            if ($groups->isEmpty()) {
                return [
                    'window' => $normalizedWindow,
                    'items' => [],
                ];
            }

            $groupIds = $groups->pluck('id')->all();
            $movementRows = WhatsAppGroupMemberEvent::query()
                ->select('group_fk', 'event_type', DB::raw('COUNT(*) as total'))
                ->whereIn('group_fk', $groupIds)
                ->whereIn('event_type', [
                    WhatsAppGroupMemberEvent::TYPE_JOIN,
                    WhatsAppGroupMemberEvent::TYPE_LEAVE,
                ])
                ->where('event_at', '>=', $windowStart)
                ->groupBy('group_fk', 'event_type')
                ->get();

            $movementMap = [];
            foreach ($movementRows as $row) {
                $groupFk = (string) $row->group_fk;
                $eventType = (string) $row->event_type;
                $total = (int) $row->total;
                $movementMap[$groupFk][$eventType] = $total;
            }

            $items = $groups->map(function (WhatsAppGroup $group) use ($movementMap) {
                $joins = (int) ($movementMap[$group->id][WhatsAppGroupMemberEvent::TYPE_JOIN] ?? 0);
                $leaves = (int) ($movementMap[$group->id][WhatsAppGroupMemberEvent::TYPE_LEAVE] ?? 0);

                return [
                    'group_id' => $group->group_id,
                    'name' => $group->name ?: $group->subject,
                    'subject' => $group->subject,
                    'members_current' => (int) ($group->members_current ?? 0),
                    'movement' => [
                        'joins' => $joins,
                        'leaves' => $leaves,
                        'net_growth' => $joins - $leaves,
                    ],
                    'last_synced_at' => $group->last_synced_at?->toIso8601String(),
                ];
            })->values()->all();

            return [
                'window' => $normalizedWindow,
                'items' => $items,
            ];
        });
    }

    public function groupMetrics(string $groupId, string $window): array
    {
        [$normalizedWindow, $windowStart] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('whatsapp.cache.group_metrics_ttl_sec', 120));
        $cacheKey = "whatsapp:groups:metrics:group:{$groupId}:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($groupId, $normalizedWindow, $windowStart) {
            $group = WhatsAppGroup::query()
                ->where('group_id', $groupId)
                ->firstOrFail();

            $membersCurrent = $group->memberships()->active()->count();
            $joins = $group->events()
                ->where('event_type', WhatsAppGroupMemberEvent::TYPE_JOIN)
                ->where('event_at', '>=', $windowStart)
                ->count();
            $leaves = $group->events()
                ->where('event_type', WhatsAppGroupMemberEvent::TYPE_LEAVE)
                ->where('event_at', '>=', $windowStart)
                ->count();

            return [
                'window' => $normalizedWindow,
                'group_id' => $group->group_id,
                'name' => $group->name ?: $group->subject,
                'subject' => $group->subject,
                'members_current' => $membersCurrent,
                'movement' => [
                    'joins' => $joins,
                    'leaves' => $leaves,
                    'net_growth' => $joins - $leaves,
                ],
                'last_synced_at' => $group->last_synced_at?->toIso8601String(),
            ];
        });
    }

    /**
     * @return array{0:string,1:CarbonImmutable}
     */
    private function resolveWindow(string $window): array
    {
        $normalized = strtolower(trim($window));
        $days = match ($normalized) {
            '7d' => 7,
            '15d' => 15,
            '30d' => 30,
            default => 7,
        };

        $timezone = (string) config('app.timezone', 'UTC');
        $start = CarbonImmutable::now($timezone)->subDays($days)->startOfDay();

        return ["{$days}d", $start];
    }

    /**
     * @return array<int, array{
     *     date: string,
     *     label: string,
     *     source: string,
     *     captured: bool,
     *     groups_count: ?int,
     *     total_memberships_current: ?int,
     *     unique_members_current: ?int,
     *     multi_group_members_current: ?int
     * }>
     */
    private function dailyOverviewSeries(CarbonImmutable $windowStart, CarbonImmutable $today, array $currentOverview): array
    {
        $snapshots = WhatsAppGroupsOverviewDailySnapshot::query()
            ->whereBetween('snapshot_date', [$windowStart->toDateString(), $today->toDateString()])
            ->orderBy('snapshot_date')
            ->get()
            ->keyBy(fn(WhatsAppGroupsOverviewDailySnapshot $snapshot) => $snapshot->snapshot_date?->toDateString());

        $series = [];
        $period = CarbonPeriod::create($windowStart, '1 day', $today);

        foreach ($period as $date) {
            $pointDate = CarbonImmutable::instance($date)->setTimezone($today->getTimezone());
            $dateKey = $pointDate->toDateString();
            /** @var WhatsAppGroupsOverviewDailySnapshot|null $snapshot */
            $snapshot = $snapshots->get($dateKey);

            if ($snapshot !== null) {
                $series[] = [
                    'date' => $dateKey,
                    'label' => $pointDate->format('d/m'),
                    'source' => 'snapshot',
                    'captured' => true,
                    'groups_count' => (int) $snapshot->groups_count,
                    'total_memberships_current' => (int) $snapshot->total_memberships_current,
                    'unique_members_current' => (int) $snapshot->unique_members_current,
                    'multi_group_members_current' => (int) $snapshot->multi_group_members_current,
                ];
                continue;
            }

            if ($dateKey === $today->toDateString()) {
                $series[] = [
                    'date' => $dateKey,
                    'label' => $pointDate->format('d/m'),
                    'source' => 'live',
                    'captured' => false,
                    'groups_count' => (int) ($currentOverview['groups_count'] ?? 0),
                    'total_memberships_current' => (int) ($currentOverview['total_memberships_current'] ?? 0),
                    'unique_members_current' => (int) ($currentOverview['unique_members_current'] ?? 0),
                    'multi_group_members_current' => (int) ($currentOverview['multi_group_members_current'] ?? 0),
                ];
                continue;
            }

            $series[] = [
                'date' => $dateKey,
                'label' => $pointDate->format('d/m'),
                'source' => 'missing',
                'captured' => false,
                'groups_count' => null,
                'total_memberships_current' => null,
                'unique_members_current' => null,
                'multi_group_members_current' => null,
            ];
        }

        return $series;
    }
}
