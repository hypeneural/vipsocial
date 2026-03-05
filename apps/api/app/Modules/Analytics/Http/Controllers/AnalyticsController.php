<?php

namespace App\Modules\Analytics\Http\Controllers;

use App\Modules\Analytics\Exceptions\AnalyticsUnavailableException;
use App\Modules\Analytics\Http\Requests\AnalyticsAcquisitionRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsCitiesRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsKpisRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsOverviewRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsRealtimeRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsTimeseriesRequest;
use App\Modules\Analytics\Http\Requests\AnalyticsTopPagesRequest;
use App\Modules\Analytics\Services\AnalyticsService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends BaseController
{
    public function __construct(private readonly AnalyticsService $service)
    {
    }

    public function overview(AnalyticsOverviewRequest $request): JsonResponse
    {
        try {
            $result = $this->service->overview($request->validated(), $request->includes());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function kpis(AnalyticsKpisRequest $request): JsonResponse
    {
        try {
            $result = $this->service->kpis($request->validated());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function topPages(AnalyticsTopPagesRequest $request): JsonResponse
    {
        try {
            $result = $this->service->topPages($request->validated());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function cities(AnalyticsCitiesRequest $request): JsonResponse
    {
        try {
            $result = $this->service->cities($request->validated());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function acquisition(AnalyticsAcquisitionRequest $request): JsonResponse
    {
        try {
            $result = $this->service->acquisition($request->validated());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function realtime(AnalyticsRealtimeRequest $request): JsonResponse
    {
        try {
            $result = $this->service->realtime($request->validated());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }

    public function timeseries(AnalyticsTimeseriesRequest $request): JsonResponse
    {
        try {
            $result = $this->service->timeseries($request->validated(), $request->metrics());

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => '',
            ]);
        } catch (AnalyticsUnavailableException $e) {
            return $this->jsonError($e->getMessage(), 'ANALYTICS_UNAVAILABLE', 503);
        }
    }
}
