<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Controllers;

use App\Modules\NewsRadarWhatsApp\Actions\SetUserWhatsAppEventStateAction;
use App\Modules\NewsRadarWhatsApp\Http\Requests\IndexWhatsAppGroupTimelineRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\SetWhatsAppEventStateRequest;
use App\Modules\NewsRadarWhatsApp\Http\Resources\WhatsAppTimelineEventResource;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppTimelineController extends BaseController
{
    public function __construct(
        private readonly SetUserWhatsAppEventStateAction $setUserState,
    ) {
    }

    public function groupTimeline(IndexWhatsAppGroupTimelineRequest $request, string $groupFk): JsonResponse
    {
        $userId = $request->user()->getKey();
        $this->findUserPreference($userId, $groupFk);

        $query = WhatsAppInboundEvent::query()
            ->with([
                'media',
                'userStates' => fn ($relation) => $relation->where('user_id', $userId),
            ])
            ->where('whatsapp_group_fk', $groupFk)
            ->visibleInTimeline();

        if (! filter_var($request->input('include_ignored', false), FILTER_VALIDATE_BOOLEAN)) {
            $query->whereDoesntHave('userStates', fn (Builder $builder) => $builder
                ->where('user_id', $userId)
                ->where('is_ignored', true));
        }

        if ($messageKind = $request->validated('message_kind')) {
            $query->where('message_kind', $messageKind);
        }

        if ($search = trim((string) $request->validated('search', ''))) {
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('text_message', 'like', "%{$search}%")
                    ->orWhere('text_title', 'like', "%{$search}%")
                    ->orWhere('sender_name', 'like', "%{$search}%")
                    ->orWhere('participant_phone', 'like', "%{$search}%")
                    ->orWhere('link_url', 'like', "%{$search}%");
            });
        }

        if ($from = $request->validated('from')) {
            $query->where('sent_at', '>=', $from);
        }

        if ($to = $request->validated('to')) {
            $query->where('sent_at', '<=', $to);
        }

        $perPage = (int) ($request->validated('per_page') ?? 30);

        $paginator = $query
            ->orderByDesc('sent_at')
            ->orderByDesc('id')
            ->cursorPaginate($perPage);

        return response()->json([
            'success' => true,
            'data' => WhatsAppTimelineEventResource::collection($paginator->items()),
            'meta' => [
                'per_page' => $paginator->perPage(),
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'prev_cursor' => $paginator->previousCursor()?->encode(),
                'has_more_pages' => $paginator->hasMorePages(),
            ],
            'message' => '',
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $event->load([
            'media',
            'userStates' => fn ($relation) => $relation->where('user_id', $request->user()->getKey()),
        ]);

        return $this->jsonSuccess(new WhatsAppTimelineEventResource($event), '');
    }

    public function ignore(SetWhatsAppEventStateRequest $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $this->setUserState->setIgnored($request->user(), $event, true);

        return $this->jsonSuccess(['event_id' => $event->id, 'is_ignored' => true], 'Mensagem ignorada');
    }

    public function unignore(SetWhatsAppEventStateRequest $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $this->setUserState->setIgnored($request->user(), $event, false);

        return $this->jsonSuccess(['event_id' => $event->id, 'is_ignored' => false], 'Mensagem reexibida');
    }

    public function star(SetWhatsAppEventStateRequest $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $this->setUserState->setStarred($request->user(), $event, true);

        return $this->jsonSuccess(['event_id' => $event->id, 'is_starred' => true], 'Mensagem marcada');
    }

    public function unstar(SetWhatsAppEventStateRequest $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $this->setUserState->setStarred($request->user(), $event, false);

        return $this->jsonSuccess(['event_id' => $event->id, 'is_starred' => false], 'Marcacao removida');
    }

    public function markReviewed(SetWhatsAppEventStateRequest $request, int $id): JsonResponse
    {
        $event = $this->findAccessibleEvent($request->user()->getKey(), $id);
        $state = $this->setUserState->markReviewed($request->user(), $event);

        return $this->jsonSuccess([
            'event_id' => $event->id,
            'reviewed_at' => $state->reviewed_at?->toIso8601String(),
        ], 'Mensagem revisada');
    }

    private function findAccessibleEvent(int $userId, int $id): WhatsAppInboundEvent
    {
        return WhatsAppInboundEvent::query()
            ->whereKey($id)
            ->whereIn('whatsapp_group_fk', UserWhatsAppNewsGroup::query()
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->pluck('whatsapp_group_fk'))
            ->firstOrFail();
    }

    private function findUserPreference(int $userId, string $groupFk): UserWhatsAppNewsGroup
    {
        return UserWhatsAppNewsGroup::query()
            ->where('user_id', $userId)
            ->where('whatsapp_group_fk', $groupFk)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
