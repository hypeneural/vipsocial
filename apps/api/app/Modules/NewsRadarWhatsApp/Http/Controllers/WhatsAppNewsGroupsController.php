<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Controllers;

use App\Modules\NewsRadarWhatsApp\Actions\MarkWhatsAppGroupAsReadAction;
use App\Modules\NewsRadarWhatsApp\Actions\UpsertUserWhatsAppGroupPreferencesAction;
use App\Modules\NewsRadarWhatsApp\Http\Requests\MarkWhatsAppGroupAsReadRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\UpdateUserWhatsAppGroupsPreferencesRequest;
use App\Modules\NewsRadarWhatsApp\Http\Resources\UserWhatsAppNewsGroupResource;
use App\Modules\NewsRadarWhatsApp\Http\Resources\WhatsAppGroupSummaryResource;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppEventState;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppNewsGroupsController extends BaseController
{
    public function __construct(
        private readonly UpsertUserWhatsAppGroupPreferencesAction $upsertPreferences,
        private readonly MarkWhatsAppGroupAsReadAction $markAsRead,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $includeInactive = filter_var($request->input('include_inactive', false), FILTER_VALIDATE_BOOLEAN);

        $preferences = UserWhatsAppNewsGroup::query()
            ->with('group')
            ->where('user_id', $user->getKey())
            ->when(! $includeInactive, fn ($query) => $query->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (UserWhatsAppNewsGroup $preference) use ($user) {
                $preference->setAttribute('unread_count', $this->countUnread($preference, $user->getKey()));
                $latestEvent = $this->latestEvent($preference);
                $preference->setAttribute('latest_event_at', $latestEvent?->sent_at?->toIso8601String() ?? $latestEvent?->received_at?->toIso8601String());
                $preference->setAttribute('latest_event_preview', $latestEvent?->text_message);

                return $preference;
            });

        return $this->jsonSuccess(
            UserWhatsAppNewsGroupResource::collection($preferences),
            ''
        );
    }

    public function updatePreferences(UpdateUserWhatsAppGroupsPreferencesRequest $request): JsonResponse
    {
        $preferences = $this->upsertPreferences->execute($request->user(), $request->validated('items'));

        return $this->jsonSuccess(
            UserWhatsAppNewsGroupResource::collection($preferences),
            'Preferencias atualizadas com sucesso'
        );
    }

    public function summary(Request $request, string $groupFk): JsonResponse
    {
        $preference = $this->findUserPreference($request->user()->getKey(), $groupFk);

        $preference->load('group');
        $preference->setAttribute('total_events', $this->baseEventsQuery($preference)->count());
        $preference->setAttribute('unread_count', $this->countUnread($preference, $request->user()->getKey()));
        $preference->setAttribute('ignored_count', UserWhatsAppEventState::query()
            ->where('user_id', $request->user()->getKey())
            ->where('is_ignored', true)
            ->whereIn('inbound_event_id', $this->baseEventsQuery($preference)->pluck('id'))
            ->count());
        $preference->setAttribute('starred_count', UserWhatsAppEventState::query()
            ->where('user_id', $request->user()->getKey())
            ->where('is_starred', true)
            ->whereIn('inbound_event_id', $this->baseEventsQuery($preference)->pluck('id'))
            ->count());
        $latestEvent = $this->latestEvent($preference);
        $preference->setAttribute('latest_event_at', $latestEvent?->sent_at?->toIso8601String() ?? $latestEvent?->received_at?->toIso8601String());

        return $this->jsonSuccess(
            new WhatsAppGroupSummaryResource($preference),
            ''
        );
    }

    public function markAsRead(MarkWhatsAppGroupAsReadRequest $request, string $groupFk): JsonResponse
    {
        $preference = $this->findUserPreference($request->user()->getKey(), $groupFk);
        $preference = $this->markAsRead->execute(
            $request->user(),
            $preference,
            (int) $request->validated('last_seen_event_id')
        );

        return $this->jsonSuccess(
            new WhatsAppGroupSummaryResource($preference),
            'Grupo marcado como lido'
        );
    }

    private function findUserPreference(int $userId, string $groupFk): UserWhatsAppNewsGroup
    {
        return UserWhatsAppNewsGroup::query()
            ->where('user_id', $userId)
            ->where('whatsapp_group_fk', $groupFk)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function baseEventsQuery(UserWhatsAppNewsGroup $preference)
    {
        return WhatsAppInboundEvent::query()
            ->where('whatsapp_group_fk', $preference->whatsapp_group_fk)
            ->visibleInTimeline();
    }

    private function latestEvent(UserWhatsAppNewsGroup $preference): ?WhatsAppInboundEvent
    {
        return $this->baseEventsQuery($preference)
            ->orderByDesc('sent_at')
            ->orderByDesc('id')
            ->first();
    }

    private function countUnread(UserWhatsAppNewsGroup $preference, int $userId): int
    {
        $query = $this->baseEventsQuery($preference);

        if ($preference->last_seen_event_at) {
            $lastSeenAt = $preference->last_seen_event_at;
            $lastSeenId = $preference->last_seen_event_id ?? 0;

            $query->where(function ($builder) use ($lastSeenAt, $lastSeenId) {
                $builder->where('sent_at', '>', $lastSeenAt)
                    ->orWhere(function ($nested) use ($lastSeenAt, $lastSeenId) {
                        $nested->where('sent_at', '=', $lastSeenAt)
                            ->where('id', '>', $lastSeenId);
                    });
            });
        }

        $ignoredIds = UserWhatsAppEventState::query()
            ->where('user_id', $userId)
            ->where('is_ignored', true)
            ->pluck('inbound_event_id');

        if ($ignoredIds->isNotEmpty()) {
            $query->whereNotIn('id', $ignoredIds);
        }

        return $query->count();
    }
}
