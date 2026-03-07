<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Http\Requests\Public\StartWidgetSessionRequest;
use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Services\PollWidgetSessionService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class WidgetSessionController extends BaseController
{
    public function __construct(private readonly PollWidgetSessionService $service)
    {
    }

    public function store(StartWidgetSessionRequest $request): JsonResponse
    {
        $placement = PollPlacement::query()
            ->where('public_id', $request->validated('placement_public_id'))
            ->where('is_active', true)
            ->firstOrFail();

        return $this->jsonSuccess([
            'session' => $this->service->start($placement, $request->validated(), $request),
        ]);
    }
}
