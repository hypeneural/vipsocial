<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Services\PollMetricsService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class PollMetricsController extends BaseController
{
    public function __construct(private readonly PollMetricsService $service)
    {
    }

    public function overview(): JsonResponse
    {
        return $this->jsonSuccess($this->service->overview());
    }

    public function dashboard(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->dashboard($id));
    }

    public function pollOverview(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->pollOverview($id));
    }

    public function timeseries(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->timeseries(
            $id,
            (string) request()->query('window', '30d'),
            request()->query('bucket_type')
        ));
    }

    public function options(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->optionsBreakdown($id));
    }

    public function placements(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->placementsBreakdown($id));
    }

    public function locations(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->locationsBreakdown($id));
    }

    public function providers(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->providersBreakdown($id));
    }

    public function devices(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->devicesBreakdown($id));
    }

    public function browsers(int $id): JsonResponse
    {
        return $this->jsonSuccess($this->service->browsersBreakdown($id));
    }
}
