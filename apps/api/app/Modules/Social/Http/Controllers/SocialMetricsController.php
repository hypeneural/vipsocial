<?php

namespace App\Modules\Social\Http\Controllers;

use App\Modules\Social\Http\Requests\SocialWindowRequest;
use App\Modules\Social\Services\SocialDashboardService;
use App\Modules\Social\Services\SocialMetricsService;
use App\Support\Http\Controllers\BaseController;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class SocialMetricsController extends BaseController
{
    public function __construct(
        private readonly SocialDashboardService $dashboardService,
        private readonly SocialMetricsService $metricsService
    ) {
    }

    public function dashboard(SocialWindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? config('social.dashboard_default_window', '30d'));
            $data = $this->dashboardService->dashboard($window);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao carregar o dashboard de redes sociais', 'SOCIAL_METRICS_ERROR', 500);
        }
    }

    public function profilesMetrics(SocialWindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? config('social.dashboard_default_window', '30d'));
            $data = $this->metricsService->profilesMetrics($window);

            return response()->json([
                'success' => true,
                'data' => $data['items'],
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao calcular metricas dos perfis sociais', 'SOCIAL_METRICS_ERROR', 500);
        }
    }

    public function show(string $id, SocialWindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? config('social.dashboard_default_window', '30d'));
            $data = $this->metricsService->profileMetrics($id, $window);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (ModelNotFoundException) {
            return $this->jsonError('Perfil social nao encontrado', 'RESOURCE_NOT_FOUND', 404);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao calcular metricas do perfil social', 'SOCIAL_METRICS_ERROR', 500);
        }
    }

    private function buildMeta(string $window): array
    {
        $timezone = (string) config('social.timezone', config('app.timezone', 'UTC'));

        return [
            'window' => $window,
            'generated_at' => CarbonImmutable::now($timezone)->toIso8601String(),
            'source' => 'db',
        ];
    }
}
