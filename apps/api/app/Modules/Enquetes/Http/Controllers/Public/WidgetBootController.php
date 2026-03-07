<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Services\PollService;
use App\Modules\Enquetes\Support\PollStateResolver;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class WidgetBootController extends BaseController
{
    public function __construct(
        private readonly PollService $service,
        private readonly PollStateResolver $stateResolver
    ) {
    }

    public function show(string $placementPublicId): JsonResponse
    {
        $placement = PollPlacement::query()
            ->with(['poll.options', 'site'])
            ->where('public_id', $placementPublicId)
            ->where('is_active', true)
            ->firstOrFail();

        $poll = $placement->poll;

        return $this->jsonSuccess([
            'placement' => [
                'public_id' => $placement->public_id,
                'placement_name' => $placement->placement_name,
                'article_external_id' => $placement->article_external_id,
                'article_title' => $placement->article_title,
                'canonical_url' => $placement->canonical_url,
                'page_path' => $placement->page_path,
                'site' => $placement->site ? [
                    'id' => $placement->site->id,
                    'name' => $placement->site->name,
                    'public_key' => $placement->site->public_key,
                ] : null,
            ],
            'poll' => $this->service->serializePublic($poll),
            'state' => $this->stateResolver->resolveWidgetState($poll),
        ]);
    }
}
