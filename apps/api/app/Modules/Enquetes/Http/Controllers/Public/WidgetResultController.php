<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Support\PollStateResolver;
use App\Modules\Enquetes\Services\PollMetricsService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class WidgetResultController extends BaseController
{
    public function __construct(
        private readonly PollMetricsService $service,
        private readonly PollStateResolver $stateResolver
    )
    {
    }

    public function show(string $pollPublicId): JsonResponse
    {
        $poll = Poll::query()
            ->with('options')
            ->where('public_id', $pollPublicId)
            ->firstOrFail();

        if ($poll->results_visibility === Poll::RESULTS_NEVER) {
            return $this->jsonError('Resultados indisponiveis para esta enquete', 'POLL_RESULTS_HIDDEN', 403);
        }

        if ($poll->results_visibility === Poll::RESULTS_AFTER_VOTE) {
            return $this->jsonError('Resultados so ficam disponiveis apos voto aceito', 'POLL_RESULTS_AFTER_VOTE', 403);
        }

        if (
            $poll->results_visibility === Poll::RESULTS_AFTER_END
            && !str_starts_with($this->stateResolver->resolveWidgetState($poll), 'ended_')
        ) {
            return $this->jsonError('Resultados ainda nao disponiveis', 'POLL_RESULTS_NOT_AVAILABLE_YET', 403);
        }

        return $this->jsonSuccess($this->service->publicResults($poll));
    }
}
