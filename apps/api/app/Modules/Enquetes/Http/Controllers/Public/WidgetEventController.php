<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Http\Requests\Public\TrackWidgetEventRequest;
use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollEvent;
use App\Modules\Enquetes\Models\PollOption;
use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Services\PollWidgetSessionService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class WidgetEventController extends BaseController
{
    public function __construct(private readonly PollWidgetSessionService $sessionService)
    {
    }

    public function store(string $pollPublicId, TrackWidgetEventRequest $request): JsonResponse
    {
        $poll = Poll::query()
            ->where('public_id', $pollPublicId)
            ->firstOrFail();

        $placement = PollPlacement::query()
            ->where('public_id', $request->validated('placement_public_id'))
            ->where('poll_id', $poll->id)
            ->where('is_active', true)
            ->firstOrFail();

        $session = $this->sessionService->findByToken($request->validated('session_token'));

        $optionId = null;
        if ($request->filled('option_public_id')) {
            $optionId = PollOption::query()
                ->where('poll_id', $poll->id)
                ->where('public_id', $request->validated('option_public_id'))
                ->value('id');
        }

        $event = PollEvent::query()->create([
            'poll_id' => $poll->id,
            'poll_placement_id' => $placement->id,
            'poll_session_id' => $session?->id,
            'event_type' => $request->validated('event_type'),
            'option_id' => $optionId,
            'meta' => $request->validated('meta', []),
            'created_at' => now(),
        ]);

        return $this->jsonSuccess([
            'event' => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'poll_id' => $event->poll_id,
                'poll_placement_id' => $event->poll_placement_id,
                'poll_session_id' => $event->poll_session_id,
                'option_id' => $event->option_id,
                'created_at' => optional($event->created_at)?->toIso8601String(),
            ],
        ]);
    }
}
