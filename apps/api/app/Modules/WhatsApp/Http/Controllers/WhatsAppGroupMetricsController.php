<?php

namespace App\Modules\WhatsApp\Http\Controllers;

use App\Modules\WhatsApp\Http\Requests\WindowRequest;
use App\Modules\WhatsApp\Services\GroupMetricsService;
use App\Support\Http\Controllers\BaseController;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class WhatsAppGroupMetricsController extends BaseController
{
    public function __construct(private readonly GroupMetricsService $metricsService)
    {
    }

    public function overview(WindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? '7d');
            $data = $this->metricsService->overview($window);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao calcular metricas gerais dos grupos', 'WHATSAPP_GROUPS_METRICS_ERROR', 500);
        }
    }

    public function dashboard(WindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? '7d');
            $data = $this->metricsService->dashboard($window);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao carregar o dashboard de grupos WhatsApp', 'WHATSAPP_GROUPS_METRICS_ERROR', 500);
        }
    }

    public function byGroup(WindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? '7d');
            $result = $this->metricsService->byGroup($window);

            return response()->json([
                'success' => true,
                'data' => $result['items'],
                'meta' => $this->buildMeta($result['window'] ?? $window),
                'message' => '',
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao calcular metricas por grupo', 'WHATSAPP_GROUPS_METRICS_ERROR', 500);
        }
    }

    public function show(string $groupId, WindowRequest $request): JsonResponse
    {
        try {
            $window = (string) ($request->validated()['window'] ?? '7d');
            $data = $this->metricsService->groupMetrics($groupId, $window);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => $this->buildMeta($data['window'] ?? $window),
                'message' => '',
            ]);
        } catch (ModelNotFoundException) {
            return $this->jsonError('Grupo nao encontrado', 'RESOURCE_NOT_FOUND', 404);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao calcular metricas do grupo', 'WHATSAPP_GROUPS_METRICS_ERROR', 500);
        }
    }

    private function buildMeta(string $window): array
    {
        $timezone = (string) config('app.timezone', 'UTC');

        return [
            'window' => $window,
            'generated_at' => CarbonImmutable::now($timezone)->toIso8601String(),
            'source' => 'db',
        ];
    }
}
