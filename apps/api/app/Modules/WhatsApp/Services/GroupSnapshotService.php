<?php

namespace App\Modules\WhatsApp\Services;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppGroupsOverviewDailySnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class GroupSnapshotService
{
    public function captureOverviewDailySnapshot(?CarbonImmutable $capturedAt = null): array
    {
        $timezone = (string) config('app.timezone', 'UTC');
        $capturedAt = $capturedAt?->setTimezone($timezone) ?? CarbonImmutable::now($timezone);
        $snapshotDate = $capturedAt->toDateString();

        $groupIds = WhatsAppGroup::query()->active()->pluck('id');
        $groupsCount = $groupIds->count();

        if ($groupsCount === 0) {
            $payload = [
                'groups_count' => 0,
                'total_memberships_current' => 0,
                'unique_members_current' => 0,
                'multi_group_members_current' => 0,
                'multi_group_ratio' => 0,
            ];
        } else {
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

            $payload = [
                'groups_count' => $groupsCount,
                'total_memberships_current' => $totalMembershipsCurrent,
                'unique_members_current' => $uniqueMembersCurrent,
                'multi_group_members_current' => $multiGroupMembersCurrent,
                'multi_group_ratio' => $uniqueMembersCurrent > 0
                    ? round($multiGroupMembersCurrent / $uniqueMembersCurrent, 4)
                    : 0,
            ];
        }

        $snapshot = WhatsAppGroupsOverviewDailySnapshot::query()->updateOrCreate(
            ['snapshot_date' => $snapshotDate],
            [
                ...$payload,
                'captured_at' => $capturedAt,
            ]
        );

        return [
            'snapshot_date' => $snapshot->snapshot_date?->toDateString() ?? $snapshotDate,
            'captured_at' => $snapshot->captured_at?->toIso8601String() ?? $capturedAt->toIso8601String(),
            ...$payload,
        ];
    }
}
