<?php

namespace App\Modules\Alertas\Http\Controllers;

use App\Modules\Alertas\Http\Requests\NextFiringsRequest;
use App\Modules\Alertas\Services\AlertDashboardService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class AlertDashboardController extends BaseController
{
    public function __construct(private readonly AlertDashboardService $service)
    {
    }

    public function stats(): JsonResponse
    {
        return $this->jsonSuccess($this->service->stats());
    }

    public function nextFirings(NextFiringsRequest $request): JsonResponse
    {
        $limit = (int) ($request->validated()['limit'] ?? config('alertas.dashboard.next_firings_limit', 5));

        return $this->jsonSuccess($this->service->nextFirings($limit));
    }

    public function recentLogs(NextFiringsRequest $request): JsonResponse
    {
        $limit = (int) ($request->validated()['limit'] ?? 10);

        return $this->jsonSuccess($this->service->recentLogs($limit));
    }
}
