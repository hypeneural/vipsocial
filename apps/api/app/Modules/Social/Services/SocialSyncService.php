<?php

namespace App\Modules\Social\Services;

use App\Modules\Social\Clients\ApifyClientInterface;
use App\Modules\Social\Models\SocialMetricDefinition;
use App\Modules\Social\Models\SocialProfile;
use App\Modules\Social\Models\SocialProfileMetricValue;
use App\Modules\Social\Models\SocialProfileSnapshot;
use App\Modules\Social\Models\SocialSyncRun;
use App\Modules\Social\Services\Normalizers\PathMapNormalizer;
use App\Modules\Social\Services\Normalizers\SocialMetricNormalizer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class SocialSyncService
{
    public function __construct(
        private readonly ApifyClientInterface $client,
        private readonly PathMapNormalizer $pathMapNormalizer
    ) {
    }

    public function syncProfileById(string $profileId, array $inputOverride = []): array
    {
        $profile = SocialProfile::query()->find($profileId);
        if ($profile === null) {
            throw (new ModelNotFoundException())->setModel(SocialProfile::class, [$profileId]);
        }

        return $this->syncProfile($profile, $inputOverride);
    }

    public function syncProfile(SocialProfile $profile, array $inputOverride = []): array
    {
        $lock = Cache::lock("social:sync:profile:{$profile->id}", 180);
        if (!$lock->get()) {
            throw new RuntimeException('Sincronizacao do perfil ja esta em andamento');
        }

        $now = CarbonImmutable::now((string) config('social.timezone', config('app.timezone', 'UTC')));
        $normalizer = $this->resolveNormalizer($profile);

        $syncRun = SocialSyncRun::query()->create([
            'social_profile_id' => $profile->id,
            'metric_date' => $now->toDateString(),
            'status' => SocialSyncRun::STATUS_PENDING,
            'normalizer_type' => $normalizer->type(),
            'normalizer_version' => $normalizer->version(),
            'started_at' => $now,
        ]);

        $latestRunPayload = null;
        $rawItem = null;
        $normalizedPayload = null;

        try {
            $taskRun = $this->startTaskRun($profile, $inputOverride);
            $latestRunPayload = $taskRun;

            $syncRun->forceFill([
                'status' => (string) ($taskRun['status'] ?? SocialSyncRun::STATUS_RUNNING),
                'apify_run_id' => $taskRun['id'] ?? null,
                'apify_dataset_id' => $taskRun['defaultDatasetId'] ?? null,
                'started_at' => $this->parseApifyDate($taskRun['startedAt'] ?? null) ?? $now,
                'raw_run' => $taskRun,
            ])->save();

            $completedRun = $this->waitForRunCompletion($taskRun);
            $latestRunPayload = $completedRun;
            $capturedAt = $this->resolveCapturedAt($completedRun);
            $metricDate = $capturedAt
                ->setTimezone((string) config('social.timezone', config('app.timezone', 'UTC')))
                ->toDateString();

            if (($completedRun['status'] ?? null) !== SocialSyncRun::STATUS_SUCCEEDED) {
                $this->markFailedRun($syncRun, 'Run do Apify nao terminou com status SUCCEEDED', $completedRun);
                throw new RuntimeException('Run do Apify nao terminou com status SUCCEEDED');
            }

            if (blank($completedRun['defaultDatasetId'] ?? null)) {
                $this->markFailedRun($syncRun, 'Run do Apify retornou sem defaultDatasetId', $completedRun);
                throw new RuntimeException('Run do Apify retornou sem defaultDatasetId');
            }

            $items = $this->fetchDatasetItems((string) $completedRun['id']);

            if ((bool) config('social.fail_on_empty_dataset', true) && empty($items)) {
                $this->markFailedRun($syncRun, 'Dataset do Apify retornou vazio', $completedRun);
                throw new RuntimeException('Dataset do Apify retornou vazio');
            }

            $normalizedPayload = $normalizer->normalize($profile, $items, $capturedAt, $metricDate);
            $rawItem = (array) ($normalizedPayload['raw_item'] ?? []);
            $primaryMetric = collect((array) ($normalizedPayload['metrics'] ?? []))
                ->firstWhere('code', $profile->primary_metric_code);

            if (!is_array($primaryMetric)) {
                $this->markFailedRun($syncRun, 'Metrica principal nao encontrada no payload normalizado', $completedRun, $rawItem, $normalizedPayload);
                throw new RuntimeException('Metrica principal nao encontrada no payload normalizado');
            }

            if (!array_key_exists('value_number', $primaryMetric) || !is_numeric((string) $primaryMetric['value_number'])) {
                $this->markFailedRun($syncRun, 'Metrica principal nao numerica', $completedRun, $rawItem, $normalizedPayload);
                throw new RuntimeException('Metrica principal nao numerica');
            }

            DB::transaction(function () use (
                $profile,
                $syncRun,
                $completedRun,
                $capturedAt,
                $metricDate,
                $rawItem,
                $normalizedPayload
            ): void {
                $persisted = $this->persistSnapshot(
                    profile: $profile,
                    syncRun: $syncRun,
                    normalizedPayload: $normalizedPayload,
                    capturedAt: $capturedAt,
                    metricDate: $metricDate
                );

                $profile->forceFill([
                    'handle' => strtolower(trim((string) ($persisted['profile']['handle'] ?? $profile->handle))),
                    'display_name' => $persisted['profile']['display_name'] ?? $profile->display_name,
                    'external_profile_id' => $persisted['profile']['external_id'] ?? $profile->external_profile_id,
                    'url' => $persisted['profile']['profile_url'] ?? $profile->url,
                    'avatar_url' => $persisted['profile']['avatar_url'] ?? $profile->avatar_url,
                    'last_synced_at' => $capturedAt,
                ])->save();

                $syncRun->forceFill([
                    'metric_date' => $metricDate,
                    'status' => SocialSyncRun::STATUS_SUCCEEDED,
                    'apify_run_id' => $completedRun['id'] ?? $syncRun->apify_run_id,
                    'apify_dataset_id' => $completedRun['defaultDatasetId'] ?? $syncRun->apify_dataset_id,
                    'finished_at' => $capturedAt,
                    'usage_total_usd' => data_get($completedRun, 'usageTotalUsd'),
                    'compute_units' => data_get($completedRun, 'stats.computeUnits'),
                    'pricing_model' => data_get($completedRun, 'pricingInfo.pricingModel'),
                    'raw_item_hash' => $this->hashRawItem($rawItem),
                    'raw_run' => $completedRun,
                    'raw_item' => $rawItem,
                    'normalized_payload' => collect($normalizedPayload)->except('raw_item')->all(),
                    'error_message' => null,
                ])->save();
            });

            $this->flushCache($profile->id);

            $syncRun->refresh();
            $profile->refresh();

            return [
                'profile_id' => $profile->id,
                'network' => $profile->network,
                'handle' => $profile->handle,
                'status' => $syncRun->status,
                'metric_date' => $syncRun->metric_date?->toDateString(),
                'captured_at' => $syncRun->finished_at?->toIso8601String(),
                'run_id' => $syncRun->id,
                'apify_run_id' => $syncRun->apify_run_id,
                'apify_dataset_id' => $syncRun->apify_dataset_id,
                'primary_metric_code' => $profile->primary_metric_code,
                'primary_metric_value' => $primaryMetric['value_number'],
            ];
        } catch (Throwable $e) {
            $this->markFailedRun(
                syncRun: $syncRun,
                message: $e->getMessage(),
                rawRun: $latestRunPayload,
                rawItem: $rawItem,
                normalizedPayload: $normalizedPayload
            );

            throw $e;
        } finally {
            optional($lock)->release();
        }
    }

    private function startTaskRun(SocialProfile $profile, array $inputOverride = []): array
    {
        $query = [
            'waitForFinish' => max(1, (int) config('social.apify.wait_for_finish', 60)),
            'memory' => max(128, (int) config('social.apify.memory_mbytes', 256)),
            'timeout' => max(1, (int) config('social.apify.run_timeout_secs', 120)),
            'maxTotalChargeUsd' => max(0, (float) config('social.apify.max_total_charge_usd', 1)),
        ];

        return $this->client->runTask(
            taskId: $profile->provider_resource_id,
            input: $this->mergeInputOverride($profile, $inputOverride),
            query: $query
        );
    }

    private function waitForRunCompletion(array $runPayload): array
    {
        if ($this->isTerminalStatus((string) ($runPayload['status'] ?? ''))) {
            return $runPayload;
        }

        $runId = (string) ($runPayload['id'] ?? '');
        if ($runId === '') {
            throw new RuntimeException('Run do Apify retornou sem id');
        }

        $run = $this->client->getRun($runId, [
            'waitForFinish' => max(1, (int) config('social.apify.wait_for_finish', 60)),
        ]);

        if (!$this->isTerminalStatus((string) ($run['status'] ?? ''))) {
            throw new RuntimeException('Run do Apify nao finalizou dentro da janela esperada');
        }

        return $run;
    }

    private function fetchDatasetItems(string $runId): array
    {
        return $this->client->getRunDatasetItems($runId, [
            'format' => 'json',
            'clean' => 1,
            'desc' => 1,
            'limit' => 1,
        ]);
    }

    private function persistSnapshot(
        SocialProfile $profile,
        SocialSyncRun $syncRun,
        array $normalizedPayload,
        CarbonImmutable $capturedAt,
        string $metricDate
    ): array {
        $snapshot = SocialProfileSnapshot::query()->updateOrCreate(
            [
                'social_profile_id' => $profile->id,
                'metric_date' => $metricDate,
            ],
            [
                'social_sync_run_id' => $syncRun->id,
                'captured_at' => $capturedAt,
            ]
        );

        $metrics = collect((array) ($normalizedPayload['metrics'] ?? []))
            ->filter(fn($metric) => is_array($metric) && !empty($metric['code']))
            ->values();

        $definitions = $this->resolveMetricDefinitions($metrics->pluck('code')->all())
            ->keyBy('code');

        $snapshot->metricValues()->delete();

        foreach ($metrics as $metric) {
            /** @var SocialMetricDefinition|null $definition */
            $definition = $definitions->get($metric['code']);
            if ($definition === null) {
                continue;
            }

            SocialProfileMetricValue::query()->create([
                'social_profile_snapshot_id' => $snapshot->id,
                'social_metric_definition_id' => $definition->id,
                'value_number' => $metric['value_number'] ?? null,
                'value_text' => $metric['value_text'] ?? null,
                'value_json' => $metric['value_json'] ?? null,
                'raw_key' => $metric['raw_key'] ?? null,
            ]);
        }

        return $normalizedPayload;
    }

    private function resolveMetricDefinitions(array $codes): Collection
    {
        $codes = collect($codes)
            ->map(fn($code) => trim((string) $code))
            ->filter(fn($code) => $code !== '')
            ->unique()
            ->values();

        if ($codes->isEmpty()) {
            return collect();
        }

        $existing = SocialMetricDefinition::query()
            ->whereIn('code', $codes)
            ->get()
            ->keyBy('code');

        foreach ($codes as $code) {
            if ($existing->has($code)) {
                continue;
            }

            $created = SocialMetricDefinition::query()->create([
                'code' => $code,
                'label' => Str::of($code)->replace('_', ' ')->title()->toString(),
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'audience',
                'is_primary_candidate' => false,
                'sort_order' => 999,
            ]);

            $existing->put($code, $created);
        }

        return $existing->values();
    }

    private function resolveNormalizer(SocialProfile $profile): SocialMetricNormalizer
    {
        return match ($profile->normalizer_type) {
            'path_map' => $this->pathMapNormalizer,
            default => throw new RuntimeException("Normalizer nao suportado: {$profile->normalizer_type}"),
        };
    }

    private function mergeInputOverride(SocialProfile $profile, array $inputOverride): array
    {
        $storedOverride = (array) ($profile->task_input_override ?? []);

        return array_replace_recursive($storedOverride, $inputOverride);
    }

    private function markFailedRun(
        SocialSyncRun $syncRun,
        string $message,
        ?array $rawRun = null,
        ?array $rawItem = null,
        ?array $normalizedPayload = null
    ): void {
        $syncRun->forceFill([
            'status' => SocialSyncRun::STATUS_FAILED,
            'finished_at' => $syncRun->finished_at ?? now((string) config('social.timezone', config('app.timezone', 'UTC'))),
            'error_message' => $message,
            'raw_run' => $rawRun ?? $syncRun->raw_run,
            'raw_item' => $rawItem ?? $syncRun->raw_item,
            'raw_item_hash' => $rawItem !== null ? $this->hashRawItem($rawItem) : $syncRun->raw_item_hash,
            'normalized_payload' => $normalizedPayload !== null
                ? collect($normalizedPayload)->except('raw_item')->all()
                : $syncRun->normalized_payload,
        ])->save();
    }

    private function parseApifyDate(?string $value): ?CarbonImmutable
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return CarbonImmutable::parse($value);
    }

    private function resolveCapturedAt(array $runPayload): CarbonImmutable
    {
        return $this->parseApifyDate($runPayload['finishedAt'] ?? null)
            ?? $this->parseApifyDate($runPayload['startedAt'] ?? null)
            ?? CarbonImmutable::now((string) config('social.timezone', config('app.timezone', 'UTC')));
    }

    private function isTerminalStatus(string $status): bool
    {
        return in_array(strtoupper(trim($status)), [
            SocialSyncRun::STATUS_SUCCEEDED,
            SocialSyncRun::STATUS_FAILED,
            'TIMED-OUT',
            'ABORTED',
        ], true);
    }

    private function hashRawItem(array $rawItem): string
    {
        return hash('sha256', json_encode($rawItem, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function flushCache(string $profileId): void
    {
        foreach (['7d', '30d', '90d'] as $window) {
            Cache::forget("social:dashboard:{$window}");
            Cache::forget("social:profiles:metrics:{$window}");
            Cache::forget("social:profiles:metrics:{$profileId}:{$window}");
        }
    }
}
