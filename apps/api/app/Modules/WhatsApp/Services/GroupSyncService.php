<?php

namespace App\Modules\WhatsApp\Services;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppParticipant;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class GroupSyncService
{
    public function __construct(
        private readonly WhatsAppService $whatsAppService,
        private readonly GroupSnapshotService $snapshotService,
    )
    {
    }

    public function syncGroupById(string $groupId, ?string $syncBatchId = null, bool $force = false): array
    {
        $normalizedGroupId = trim($groupId);
        if ($normalizedGroupId === '') {
            throw new InvalidArgumentException('groupId nao pode ser vazio');
        }

        $syncBatchId = $syncBatchId ?: 'wpp_sync_' . str_replace('-', '', (string) Str::ulid());
        $lockKey = 'wpp:sync:group:' . md5($normalizedGroupId);
        $lock = Cache::lock($lockKey, 120);

        if (!is_object($lock) || !method_exists($lock, 'get') || !$lock->get()) {
            return [
                'group_id' => $normalizedGroupId,
                'sync_batch_id' => $syncBatchId,
                'applied' => false,
                'reason' => 'group_locked',
            ];
        }

        try {
            return $this->syncInsideLock($normalizedGroupId, $syncBatchId, $force);
        } finally {
            try {
                $lock->release();
            } catch (\Throwable) {
                // best effort
            }
        }
    }

    private function syncInsideLock(string $groupId, string $syncBatchId, bool $force): array
    {
        $now = CarbonImmutable::now(config('app.timezone', 'UTC'));

        $group = WhatsAppGroup::query()->firstOrCreate(
            ['group_id' => $groupId],
            [
                'name' => null,
                'subject' => null,
                'is_active' => true,
            ]
        );

        $payload = $this->whatsAppService->lightGroupMetadata($groupId);
        $extracted = $this->extractCurrentParticipants($payload['participants'] ?? []);
        $currentParticipants = $extracted['participants'];
        $skippedNoKeyCount = $extracted['skipped_no_key_count'];

        $previousMemberships = $group->memberships()
            ->active()
            ->with('participant')
            ->get();

        $previousByKey = [];
        foreach ($previousMemberships as $membership) {
            $key = $this->participantKey(
                $membership->participant?->lid,
                $membership->participant?->phone
            );
            if ($key !== null) {
                $previousByKey[$key] = $membership;
            }
        }

        $currentCount = count($currentParticipants);
        $previousCount = count($previousByKey);

        $guardRailReason = $this->guardRailReason($currentCount, $previousCount, $force);
        if ($guardRailReason !== null) {
            Log::warning('WhatsApp group sync aborted by guard rail', [
                'group_id' => $groupId,
                'sync_batch_id' => $syncBatchId,
                'current_count' => $currentCount,
                'previous_count' => $previousCount,
                'reason' => $guardRailReason,
            ]);

            return [
                'group_id' => $groupId,
                'sync_batch_id' => $syncBatchId,
                'applied' => false,
                'reason' => $guardRailReason,
                'current_count' => $currentCount,
                'previous_count' => $previousCount,
                'added_count' => 0,
                'removed_count' => 0,
                'skipped_no_key_count' => $skippedNoKeyCount,
            ];
        }

        $addedCount = 0;
        $removedCount = 0;
        $processedKeys = [];

        DB::transaction(function () use (
            $group,
            $payload,
            $currentParticipants,
            $previousByKey,
            $now,
            $syncBatchId,
            &$addedCount,
            &$removedCount,
            &$processedKeys
        ) {
            $group->fill([
                'name' => $this->stringOrNull($payload['name'] ?? null) ?? $group->name,
                'subject' => $this->stringOrNull($payload['subject'] ?? null) ?? $group->subject,
                'description' => $this->stringOrNull($payload['description'] ?? null),
                'owner_phone' => $this->normalizePhone($payload['owner'] ?? null),
                'creation_ts' => $this->intOrNull($payload['creation'] ?? null),
                'admin_only_message' => $this->boolOrNull($payload['adminOnlyMessage'] ?? null),
                'admin_only_settings' => $this->boolOrNull($payload['adminOnlySettings'] ?? null),
                'require_admin_approval' => $this->boolOrNull($payload['requireAdminApproval'] ?? null),
                'is_group_announcement' => $this->boolOrNull($payload['isGroupAnnouncement'] ?? null),
                'admin_only_add_member' => $this->boolOrNull($payload['adminOnlyAddMember'] ?? null),
                'last_synced_at' => $now,
                'last_member_count' => count($currentParticipants),
            ]);
            $group->save();

            foreach ($currentParticipants as $key => $current) {
                $processedKeys[$key] = true;

                $participant = $this->resolveParticipant($current['lid'], $current['phone'], $now);
                $membership = WhatsAppGroupMembership::query()
                    ->where('group_fk', $group->id)
                    ->where('participant_fk', $participant->id)
                    ->first();

                $isAdminNow = (bool) $current['is_admin'];
                $isSuperAdminNow = (bool) $current['is_super_admin'];

                if (isset($previousByKey[$key]) && $membership !== null && $membership->status === WhatsAppGroupMembership::STATUS_ACTIVE) {
                    $wasAdminBefore = (bool) $membership->is_admin || (bool) $membership->is_super_admin;
                    $isAdminAfter = $isAdminNow || $isSuperAdminNow;

                    if (!$wasAdminBefore && $isAdminAfter) {
                        $this->createEvent($group->id, $participant->id, WhatsAppGroupMemberEvent::TYPE_PROMOTE_ADMIN, $now, $syncBatchId);
                    } elseif ($wasAdminBefore && !$isAdminAfter) {
                        $this->createEvent($group->id, $participant->id, WhatsAppGroupMemberEvent::TYPE_DEMOTE_ADMIN, $now, $syncBatchId);
                    }

                    $membership->fill([
                        'status' => WhatsAppGroupMembership::STATUS_ACTIVE,
                        'is_admin' => $isAdminNow,
                        'is_super_admin' => $isSuperAdminNow,
                        'last_seen_at' => $now,
                    ]);
                    $membership->save();
                    continue;
                }

                $addedCount++;

                if ($membership !== null && $membership->status === WhatsAppGroupMembership::STATUS_LEFT) {
                    $membership->fill([
                        'status' => WhatsAppGroupMembership::STATUS_ACTIVE,
                        'is_admin' => $isAdminNow,
                        'is_super_admin' => $isSuperAdminNow,
                        'joined_at' => $now,
                        'left_at' => null,
                        'last_seen_at' => $now,
                        'times_joined' => (int) $membership->times_joined + 1,
                    ]);
                    $membership->save();
                } elseif ($membership === null) {
                    $membership = WhatsAppGroupMembership::query()->create([
                        'group_fk' => $group->id,
                        'participant_fk' => $participant->id,
                        'status' => WhatsAppGroupMembership::STATUS_ACTIVE,
                        'is_admin' => $isAdminNow,
                        'is_super_admin' => $isSuperAdminNow,
                        'joined_at' => $now,
                        'left_at' => null,
                        'last_seen_at' => $now,
                        'times_joined' => 1,
                    ]);
                } else {
                    $membership->fill([
                        'status' => WhatsAppGroupMembership::STATUS_ACTIVE,
                        'is_admin' => $isAdminNow,
                        'is_super_admin' => $isSuperAdminNow,
                        'joined_at' => $membership->joined_at ?: $now,
                        'left_at' => null,
                        'last_seen_at' => $now,
                    ]);
                    $membership->save();
                }

                $this->createEvent($group->id, $participant->id, WhatsAppGroupMemberEvent::TYPE_JOIN, $now, $syncBatchId);
            }

            foreach ($previousByKey as $key => $previousMembership) {
                if (isset($processedKeys[$key])) {
                    continue;
                }

                if ($previousMembership->status !== WhatsAppGroupMembership::STATUS_ACTIVE) {
                    continue;
                }

                $removedCount++;

                $previousMembership->fill([
                    'status' => WhatsAppGroupMembership::STATUS_LEFT,
                    'left_at' => $now,
                ]);
                $previousMembership->save();

                $this->createEvent(
                    $group->id,
                    $previousMembership->participant_fk,
                    WhatsAppGroupMemberEvent::TYPE_LEAVE,
                    $now,
                    $syncBatchId
                );
            }
        });

        $result = [
            'group_id' => $groupId,
            'sync_batch_id' => $syncBatchId,
            'applied' => true,
            'reason' => null,
            'current_count' => $currentCount,
            'previous_count' => $previousCount,
            'added_count' => $addedCount,
            'removed_count' => $removedCount,
            'skipped_no_key_count' => $skippedNoKeyCount,
        ];

        try {
            $snapshot = $this->snapshotService->captureOverviewDailySnapshot($now);
            $result['daily_snapshot_date'] = $snapshot['snapshot_date'];
        } catch (\Throwable $e) {
            Log::warning('WhatsApp overview daily snapshot capture failed after sync', [
                'group_id' => $groupId,
                'sync_batch_id' => $syncBatchId,
                'error' => $e->getMessage(),
            ]);
        }

        return $result;
    }

    /**
     * @param array<int, mixed> $participants
     * @return array{
     *     participants: array<string, array{lid: ?string, phone: ?string, is_admin: bool, is_super_admin: bool}>,
     *     skipped_no_key_count: int
     * }
     */
    private function extractCurrentParticipants(array $participants): array
    {
        $result = [];
        $skippedNoKeyCount = 0;

        foreach ($participants as $participant) {
            if (!is_array($participant)) {
                continue;
            }

            $lid = $this->normalizeLid($participant['lid'] ?? null);
            $phone = $this->normalizePhone($participant['phone'] ?? null);
            $key = $this->participantKey($lid, $phone);

            if ($key === null) {
                $skippedNoKeyCount++;
                continue;
            }

            $isAdmin = $this->toBool($participant['isAdmin'] ?? false);
            $isSuperAdmin = $this->toBool($participant['isSuperAdmin'] ?? false);

            if (!isset($result[$key])) {
                $result[$key] = [
                    'lid' => $lid,
                    'phone' => $phone,
                    'is_admin' => $isAdmin,
                    'is_super_admin' => $isSuperAdmin,
                ];
                continue;
            }

            $result[$key]['is_admin'] = $result[$key]['is_admin'] || $isAdmin;
            $result[$key]['is_super_admin'] = $result[$key]['is_super_admin'] || $isSuperAdmin;
            $result[$key]['lid'] = $result[$key]['lid'] ?? $lid;
            $result[$key]['phone'] = $result[$key]['phone'] ?? $phone;
        }

        return [
            'participants' => $result,
            'skipped_no_key_count' => $skippedNoKeyCount,
        ];
    }

    private function resolveParticipant(?string $lid, ?string $phone, CarbonImmutable $now): WhatsAppParticipant
    {
        if ($lid !== null) {
            $participant = WhatsAppParticipant::query()->where('lid', $lid)->first();
            if ($participant === null) {
                return WhatsAppParticipant::query()->create([
                    'lid' => $lid,
                    'phone' => $phone,
                    'first_seen_at' => $now,
                    'last_seen_at' => $now,
                ]);
            }

            $participant->fill([
                'phone' => $participant->phone ?: $phone,
                'last_seen_at' => $now,
                'first_seen_at' => $participant->first_seen_at ?: $now,
            ]);
            $participant->save();

            return $participant;
        }

        if ($phone !== null) {
            $participant = WhatsAppParticipant::query()
                ->where(function ($query) use ($phone) {
                    $query->where('phone', $phone);
                })
                ->orderByRaw('CASE WHEN lid IS NULL THEN 0 ELSE 1 END')
                ->first();

            if ($participant === null) {
                return WhatsAppParticipant::query()->create([
                    'lid' => null,
                    'phone' => $phone,
                    'first_seen_at' => $now,
                    'last_seen_at' => $now,
                ]);
            }

            $participant->fill([
                'phone' => $phone,
                'last_seen_at' => $now,
                'first_seen_at' => $participant->first_seen_at ?: $now,
            ]);
            $participant->save();

            return $participant;
        }

        throw new InvalidArgumentException('Participante invalido sem lid e sem phone');
    }

    private function createEvent(
        string $groupPk,
        string $participantPk,
        string $eventType,
        CarbonImmutable $eventAt,
        string $syncBatchId
    ): void {
        WhatsAppGroupMemberEvent::query()->firstOrCreate([
            'group_fk' => $groupPk,
            'participant_fk' => $participantPk,
            'event_type' => $eventType,
            'sync_batch_id' => $syncBatchId,
        ], [
            'event_at' => $eventAt,
        ]);
    }

    private function normalizeLid(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $lid = strtolower(trim($value));
        if ($lid === '') {
            return null;
        }

        return str_ends_with($lid, '@lid') ? $lid : "{$lid}@lid";
    }

    private function normalizePhone(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value) ?? '';
        $digits = trim($digits);

        return $digits !== '' ? $digits : null;
    }

    private function participantKey(?string $lid, ?string $phone): ?string
    {
        if ($lid !== null) {
            return "lid:{$lid}";
        }

        if ($phone !== null) {
            return "phone:{$phone}";
        }

        return null;
    }

    private function guardRailReason(int $currentCount, int $previousCount, bool $force): ?string
    {
        if ($force) {
            return null;
        }

        if ($currentCount === 0 && $previousCount > 50) {
            return 'guard_rail_empty_snapshot';
        }

        if ($previousCount >= 100 && $currentCount < (int) floor($previousCount * 0.4)) {
            return 'guard_rail_suspicious_drop';
        }

        return null;
    }

    private function toBool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function intOrNull(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function boolOrNull(mixed $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
}
