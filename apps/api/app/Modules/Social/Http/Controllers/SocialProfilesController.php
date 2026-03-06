<?php

namespace App\Modules\Social\Http\Controllers;

use App\Modules\Social\Exceptions\ApifyProviderException;
use App\Modules\Social\Http\Requests\StoreSocialProfileRequest;
use App\Modules\Social\Http\Requests\SyncSocialProfileRequest;
use App\Modules\Social\Http\Requests\UpdateSocialProfileRequest;
use App\Modules\Social\Models\SocialProfile;
use App\Modules\Social\Services\SocialSyncService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class SocialProfilesController extends BaseController
{
    public function __construct(private readonly SocialSyncService $syncService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->integer('per_page', 20)));
        $includeInactive = filter_var($request->input('include_inactive', false), FILTER_VALIDATE_BOOLEAN);

        $query = SocialProfile::query()
            ->orderByDesc('is_active')
            ->orderBy('sort_order')
            ->orderBy('network')
            ->orderBy('handle');

        if (!$includeInactive) {
            $query->active();
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $items = $paginator->getCollection()
            ->map(fn(SocialProfile $profile) => $this->serializeProfile($profile))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'message' => '',
        ]);
    }

    public function avatar(string $id): Response
    {
        $profile = SocialProfile::query()->find($id);
        if ($profile === null || blank($profile->avatar_url)) {
            abort(404);
        }

        $avatarUrl = trim((string) $profile->avatar_url);
        if (!$this->shouldProxyAvatarUrl($avatarUrl)) {
            abort(404);
        }

        $response = Http::accept('image/*')
            ->timeout(15)
            ->retry(2, 250, throw: false)
            ->get($avatarUrl);

        if (!$response->successful() || blank($response->body())) {
            abort(404);
        }

        return response($response->body(), 200, [
            'Content-Type' => $response->header('Content-Type', 'image/jpeg'),
            'Cache-Control' => 'public, max-age=3600, stale-while-revalidate=86400',
        ]);
    }

    public function store(StoreSocialProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $syncNow = (bool) ($validated['sync_now'] ?? false);

        try {
            $profile = SocialProfile::query()->create([
                'provider' => $validated['provider'] ?? 'apify',
                'provider_resource_type' => $validated['provider_resource_type'] ?? 'task',
                'provider_resource_id' => $validated['provider_resource_id'],
                'task_input_override' => $validated['task_input_override'] ?? null,
                'network' => $validated['network'],
                'handle' => $validated['handle'],
                'display_name' => $validated['display_name'] ?? null,
                'external_profile_id' => $validated['external_profile_id'] ?? null,
                'url' => $validated['url'] ?? null,
                'avatar_url' => $validated['avatar_url'] ?? null,
                'primary_metric_code' => $validated['primary_metric_code'],
                'normalizer_type' => $validated['normalizer_type'] ?? 'path_map',
                'normalizer_config' => $validated['normalizer_config'],
                'sort_order' => (int) ($validated['sort_order'] ?? 0),
                'is_active' => (bool) ($validated['is_active'] ?? true),
            ]);

            $payload = [
                'profile' => $this->serializeProfile($profile->fresh()),
            ];

            if ($syncNow) {
                $payload['sync'] = $this->syncService->syncProfileById($profile->id);
                $payload['profile'] = $this->serializeProfile($profile->fresh());
            }

            return $this->jsonCreated($payload, 'Perfil social monitorado criado com sucesso');
        } catch (ApifyProviderException $e) {
            return $this->jsonError(
                message: $e->getMessage(),
                code: 'SOCIAL_PROVIDER_ERROR',
                status: $e->status(),
                errors: [
                    'provider_status' => $e->status(),
                    'provider_body' => $e->responseBody(),
                ]
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar perfil social monitorado', 'SOCIAL_PROFILE_CREATE_FAILED', 500);
        }
    }

    public function update(string $id, UpdateSocialProfileRequest $request): JsonResponse
    {
        $profile = SocialProfile::query()->find($id);
        if ($profile === null) {
            throw (new ModelNotFoundException())->setModel(SocialProfile::class, [$id]);
        }

        $validated = $request->validated();
        $profile->fill($validated);
        $profile->save();

        return $this->jsonSuccess(
            $this->serializeProfile($profile->fresh()),
            'Perfil social monitorado atualizado com sucesso'
        );
    }

    public function sync(string $id, SyncSocialProfileRequest $request): JsonResponse
    {
        $profile = SocialProfile::query()->find($id);
        if ($profile === null) {
            throw (new ModelNotFoundException())->setModel(SocialProfile::class, [$id]);
        }

        try {
            $syncResult = $this->syncService->syncProfileById(
                profileId: $profile->id,
                inputOverride: (array) ($request->validated()['input_override'] ?? [])
            );

            return $this->jsonSuccess([
                'profile' => $this->serializeProfile($profile->fresh()),
                'sync' => $syncResult,
            ], 'Sincronizacao executada');
        } catch (ApifyProviderException $e) {
            return $this->jsonError(
                message: $e->getMessage(),
                code: 'SOCIAL_PROVIDER_ERROR',
                status: $e->status(),
                errors: [
                    'provider_status' => $e->status(),
                    'provider_body' => $e->responseBody(),
                ]
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao sincronizar perfil social monitorado', 'SOCIAL_PROFILE_SYNC_FAILED', 500);
        }
    }

    private function serializeProfile(SocialProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'provider' => $profile->provider,
            'provider_resource_type' => $profile->provider_resource_type,
            'provider_resource_id' => $profile->provider_resource_id,
            'network' => $profile->network,
            'handle' => $profile->handle,
            'display_name' => $profile->display_name,
            'external_profile_id' => $profile->external_profile_id,
            'url' => $profile->url,
            'avatar_url' => $profile->avatar_url,
            'avatar_proxy_url' => $profile->avatar_url ? "/api/v1/social/profiles/{$profile->id}/avatar" : null,
            'primary_metric_code' => $profile->primary_metric_code,
            'normalizer_type' => $profile->normalizer_type,
            'normalizer_config' => $profile->normalizer_config,
            'task_input_override' => $profile->task_input_override,
            'sort_order' => (int) $profile->sort_order,
            'is_active' => (bool) $profile->is_active,
            'last_synced_at' => $profile->last_synced_at?->toIso8601String(),
            'created_at' => $profile->created_at?->toIso8601String(),
            'updated_at' => $profile->updated_at?->toIso8601String(),
        ];
    }

    private function shouldProxyAvatarUrl(string $avatarUrl): bool
    {
        $host = parse_url($avatarUrl, PHP_URL_HOST);
        if (!is_string($host) || $host === '') {
            return false;
        }

        $normalizedHost = strtolower($host);

        return str_contains($normalizedHost, 'cdninstagram.com')
            || str_ends_with($normalizedHost, 'fbcdn.net')
            || str_ends_with($normalizedHost, 'googleusercontent.com')
            || str_ends_with($normalizedHost, 'ggpht.com');
    }
}
