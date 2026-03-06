<?php

use App\Models\User;
use App\Modules\Social\Models\SocialMetricDefinition;
use App\Modules\Social\Models\SocialProfile;
use App\Modules\Social\Models\SocialProfileMetricValue;
use App\Modules\Social\Models\SocialProfileSnapshot;
use App\Modules\Social\Models\SocialSyncRun;
use Illuminate\Http\Client\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config([
        'social.provider' => 'apify',
        'social.timezone' => 'America/Sao_Paulo',
        'social.dashboard_default_window' => '30d',
        'social.fail_on_empty_dataset' => true,
        'social.cache.dashboard_ttl_sec' => 30,
        'social.apify.base_url' => 'https://api.apify.com/v2',
        'social.apify.token' => 'apify-token-test',
        'social.apify.timeout' => 10,
        'social.apify.retry_times' => 1,
        'social.apify.retry_sleep_ms' => 1,
        'social.apify.wait_for_finish' => 60,
        'social.apify.run_timeout_secs' => 120,
        'social.apify.memory_mbytes' => 256,
        'social.apify.max_total_charge_usd' => 1,
        'cache.default' => 'array',
    ]);

    Cache::flush();

    Schema::dropIfExists('social_profile_metric_values');
    Schema::dropIfExists('social_profile_snapshots');
    Schema::dropIfExists('social_sync_runs');
    Schema::dropIfExists('social_metric_definitions');
    Schema::dropIfExists('social_profiles');

    Schema::create('social_profiles', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('provider', 50)->default('apify');
        $table->string('provider_resource_type', 50)->default('task');
        $table->string('provider_resource_id', 191);
        $table->json('task_input_override')->nullable();
        $table->string('network', 50);
        $table->string('handle', 191);
        $table->string('display_name', 191)->nullable();
        $table->string('external_profile_id', 191)->nullable();
        $table->string('url', 500)->nullable();
        $table->string('avatar_url', 1000)->nullable();
        $table->string('primary_metric_code', 100);
        $table->string('normalizer_type', 100)->default('path_map');
        $table->json('normalizer_config');
        $table->unsignedInteger('sort_order')->default(0);
        $table->boolean('is_active')->default(true);
        $table->dateTime('last_synced_at')->nullable();
        $table->timestamps();
    });

    Schema::create('social_metric_definitions', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('code', 100)->unique();
        $table->string('label', 191);
        $table->string('value_type', 50)->default('integer');
        $table->string('unit', 50)->default('count');
        $table->string('metric_group', 50)->default('audience');
        $table->boolean('is_primary_candidate')->default(false);
        $table->unsignedInteger('sort_order')->default(0);
        $table->timestamps();
    });

    Schema::create('social_sync_runs', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('social_profile_id', 26);
        $table->date('metric_date');
        $table->string('status', 50);
        $table->string('apify_run_id', 191)->nullable();
        $table->string('apify_dataset_id', 191)->nullable();
        $table->string('normalizer_type', 100);
        $table->string('normalizer_version', 50);
        $table->string('raw_item_hash', 64)->nullable();
        $table->dateTime('started_at')->nullable();
        $table->dateTime('finished_at')->nullable();
        $table->decimal('usage_total_usd', 12, 6)->nullable();
        $table->decimal('compute_units', 12, 6)->nullable();
        $table->string('pricing_model', 100)->nullable();
        $table->text('error_message')->nullable();
        $table->json('raw_run')->nullable();
        $table->json('raw_item')->nullable();
        $table->json('normalized_payload')->nullable();
        $table->timestamps();
    });

    Schema::create('social_profile_snapshots', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('social_profile_id', 26);
        $table->string('social_sync_run_id', 26)->nullable();
        $table->date('metric_date');
        $table->dateTime('captured_at');
        $table->timestamps();
    });

    Schema::create('social_profile_metric_values', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('social_profile_snapshot_id', 26);
        $table->string('social_metric_definition_id', 26);
        $table->decimal('value_number', 20, 4)->nullable();
        $table->string('value_text', 500)->nullable();
        $table->json('value_json')->nullable();
        $table->string('raw_key', 191)->nullable();
        $table->timestamps();
    });

    SocialMetricDefinition::query()->create([
        'code' => 'followers_total',
        'label' => 'Seguidores',
        'value_type' => 'integer',
        'unit' => 'count',
        'metric_group' => 'audience',
        'is_primary_candidate' => true,
        'sort_order' => 10,
    ]);

    SocialMetricDefinition::query()->create([
        'code' => 'following_total',
        'label' => 'Seguindo',
        'value_type' => 'integer',
        'unit' => 'count',
        'metric_group' => 'audience',
        'is_primary_candidate' => false,
        'sort_order' => 20,
    ]);
});

function makeAuthenticatedSocialUser(): User
{
    return User::factory()->make([
        'id' => 1,
        'active' => true,
        'role' => 'admin',
    ]);
}

function socialInstagramNormalizerConfig(): array
{
    return [
        'item_index' => 0,
        'identity_paths' => [
            'external_id' => 'userId',
            'handle' => 'userName',
            'display_name' => 'userFullName',
            'profile_url' => 'userUrl',
            'avatar_url' => 'profilePic',
        ],
        'metric_paths' => [
            'followers_total' => 'followersCount',
            'following_total' => 'followsCount',
        ],
    ];
}

function createSocialInstagramProfile(): SocialProfile
{
    return SocialProfile::query()->create([
        'provider' => 'apify',
        'provider_resource_type' => 'task',
        'provider_resource_id' => 'task-instagram-vipsocial',
        'task_input_override' => [
            'usernames' => ['vipsocial'],
        ],
        'network' => 'instagram',
        'handle' => 'vipsocial',
        'primary_metric_code' => 'followers_total',
        'normalizer_type' => 'path_map',
        'normalizer_config' => socialInstagramNormalizerConfig(),
        'is_active' => true,
    ]);
}

test('social endpoints require authentication', function () {
    $this->getJson('/api/v1/social/dashboard')
        ->assertStatus(401);
});

test('social profile can be created', function () {
    Sanctum::actingAs(makeAuthenticatedSocialUser());

    $this->postJson('/api/v1/social/profiles', [
            'provider_resource_id' => 'task-instagram-vipsocial',
            'network' => 'instagram',
            'handle' => 'vipsocial',
            'primary_metric_code' => 'followers_total',
            'normalizer_config' => socialInstagramNormalizerConfig(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.profile.network', 'instagram')
        ->assertJsonPath('data.profile.handle', 'vipsocial');

    $this->assertDatabaseHas('social_profiles', [
        'network' => 'instagram',
        'handle' => 'vipsocial',
        'provider_resource_id' => 'task-instagram-vipsocial',
    ]);
});

test('social profile sync persists snapshot and metrics from apify task run', function () {
    Http::fake([
        'https://api.apify.com/v2/actor-tasks/task-instagram-vipsocial/runs*' => Http::response([
            'data' => [
                'id' => 'run-1',
                'status' => 'RUNNING',
                'defaultDatasetId' => 'dataset-1',
                'startedAt' => '2026-03-06T09:10:00.000Z',
            ],
        ], 200),
        'https://api.apify.com/v2/actor-runs/run-1/dataset/items*' => Http::response([
            [
                'profilePic' => 'https://cdn.example.com/avatar.jpg',
                'userName' => 'vipsocial',
                'followersCount' => 86391,
                'followsCount' => 1815,
                'timestamp' => '2026-03-06 - 16:25',
                'userUrl' => 'https://www.instagram.com/vipsocial',
                'userFullName' => 'VipSocial',
                'userId' => '189403979',
            ],
        ], 200),
        'https://api.apify.com/v2/actor-runs/run-1*' => Http::response([
            'data' => [
                'id' => 'run-1',
                'status' => 'SUCCEEDED',
                'defaultDatasetId' => 'dataset-1',
                'startedAt' => '2026-03-06T09:10:00.000Z',
                'finishedAt' => '2026-03-06T09:10:30.000Z',
                'usageTotalUsd' => 0.015,
                'stats' => [
                    'computeUnits' => 0.03,
                ],
                'pricingInfo' => [
                    'pricingModel' => 'PAY_PER_EVENT',
                ],
            ],
        ], 200),
    ]);

    Sanctum::actingAs(makeAuthenticatedSocialUser());
    $profile = createSocialInstagramProfile();

    $this->postJson("/api/v1/social/profiles/{$profile->id}/sync")
        ->assertOk()
        ->assertJsonPath('data.sync.apify_run_id', 'run-1')
        ->assertJsonPath('data.sync.primary_metric_value', 86391)
        ->assertJsonPath('data.profile.external_profile_id', '189403979');

    $this->assertDatabaseHas('social_sync_runs', [
        'social_profile_id' => $profile->id,
        'status' => 'SUCCEEDED',
        'apify_run_id' => 'run-1',
        'apify_dataset_id' => 'dataset-1',
    ]);

    $snapshot = SocialProfileSnapshot::query()
        ->where('social_profile_id', $profile->id)
        ->first();

    expect($snapshot)->not->toBeNull();
    expect($snapshot->metric_date?->toDateString())->toBe('2026-03-06');

    $followersDefinition = SocialMetricDefinition::query()->where('code', 'followers_total')->firstOrFail();

    $this->assertDatabaseHas('social_profile_metric_values', [
        'social_profile_snapshot_id' => $snapshot->id,
        'social_metric_definition_id' => $followersDefinition->id,
        'raw_key' => 'followersCount',
    ]);

    Http::assertSent(function (Request $request) {
        return str_contains($request->url(), '/actor-tasks/task-instagram-vipsocial/runs?')
            && $request->hasHeader('Authorization', 'Bearer apify-token-test')
            && $request['usernames'] === ['vipsocial'];
    });
});

test('social dashboard returns cards and series from persisted snapshots', function () {
    Sanctum::actingAs(makeAuthenticatedSocialUser());
    $profile = createSocialInstagramProfile();

    $followersDefinition = SocialMetricDefinition::query()->where('code', 'followers_total')->firstOrFail();
    $followingDefinition = SocialMetricDefinition::query()->where('code', 'following_total')->firstOrFail();

    $snapshotDay1 = SocialProfileSnapshot::query()->create([
        'social_profile_id' => $profile->id,
        'metric_date' => '2026-03-05',
        'captured_at' => '2026-03-05 06:10:00',
    ]);

    SocialProfileMetricValue::query()->create([
        'social_profile_snapshot_id' => $snapshotDay1->id,
        'social_metric_definition_id' => $followersDefinition->id,
        'value_number' => 86000,
        'raw_key' => 'followersCount',
    ]);

    SocialProfileMetricValue::query()->create([
        'social_profile_snapshot_id' => $snapshotDay1->id,
        'social_metric_definition_id' => $followingDefinition->id,
        'value_number' => 1800,
        'raw_key' => 'followsCount',
    ]);

    $snapshotDay2 = SocialProfileSnapshot::query()->create([
        'social_profile_id' => $profile->id,
        'metric_date' => '2026-03-06',
        'captured_at' => '2026-03-06 06:10:00',
    ]);

    SocialProfileMetricValue::query()->create([
        'social_profile_snapshot_id' => $snapshotDay2->id,
        'social_metric_definition_id' => $followersDefinition->id,
        'value_number' => 86391,
        'raw_key' => 'followersCount',
    ]);

    SocialProfileMetricValue::query()->create([
        'social_profile_snapshot_id' => $snapshotDay2->id,
        'social_metric_definition_id' => $followingDefinition->id,
        'value_number' => 1815,
        'raw_key' => 'followsCount',
    ]);

    SocialSyncRun::query()->create([
        'social_profile_id' => $profile->id,
        'metric_date' => '2026-03-06',
        'status' => 'SUCCEEDED',
        'apify_run_id' => 'run-dashboard-1',
        'apify_dataset_id' => 'dataset-dashboard-1',
        'normalizer_type' => 'path_map',
        'normalizer_version' => '1.0.0',
        'started_at' => '2026-03-06 06:09:00',
        'finished_at' => '2026-03-06 06:10:00',
    ]);

    $profile->forceFill([
        'display_name' => 'VipSocial',
        'external_profile_id' => '189403979',
        'url' => 'https://www.instagram.com/vipsocial',
        'avatar_url' => 'https://cdn.example.com/avatar.jpg',
        'last_synced_at' => '2026-03-06 06:10:00',
    ])->save();

    $this->getJson('/api/v1/social/dashboard?window=30d')
        ->assertOk()
        ->assertJsonPath('data.summary.total_audience_current', 86391)
        ->assertJsonPath('data.summary.profiles_count', 1)
        ->assertJsonPath('data.cards.0.current_value', 86391)
        ->assertJsonPath('data.cards.0.growth_day', 391)
        ->assertJsonPath('data.cards.0.primary_metric_code', 'followers_total')
        ->assertJsonPath('data.cards.0.avatar_proxy_url', "/api/v1/social/profiles/{$profile->id}/avatar")
        ->assertJsonPath("data.series.{$profile->id}.points.1.value", 86391);
});

test('social avatar proxy returns proxied image for allowed hosts', function () {
    Http::fake([
        'https://assets.cdninstagram.com/*' => Http::response('fake-image-binary', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $profile = SocialProfile::query()->create([
        'provider' => 'apify',
        'provider_resource_type' => 'task',
        'provider_resource_id' => 'task-instagram-vipsocial',
        'task_input_override' => [
            'usernames' => ['vipsocial'],
        ],
        'network' => 'instagram',
        'handle' => 'vipsocial',
        'avatar_url' => 'https://assets.cdninstagram.com/avatar.jpg',
        'primary_metric_code' => 'followers_total',
        'normalizer_type' => 'path_map',
        'normalizer_config' => socialInstagramNormalizerConfig(),
        'is_active' => true,
    ]);

    $this->get("/api/v1/social/profiles/{$profile->id}/avatar")
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');
});

test('failed sync does not overwrite existing valid snapshot', function () {
    Http::fake([
        'https://api.apify.com/v2/actor-tasks/task-instagram-vipsocial/runs*' => Http::response([
            'data' => [
                'id' => 'run-2',
                'status' => 'RUNNING',
                'defaultDatasetId' => 'dataset-2',
                'startedAt' => '2026-03-06T11:00:00.000Z',
            ],
        ], 200),
        'https://api.apify.com/v2/actor-runs/run-2/dataset/items*' => Http::response([], 200),
        'https://api.apify.com/v2/actor-runs/run-2*' => Http::response([
            'data' => [
                'id' => 'run-2',
                'status' => 'SUCCEEDED',
                'defaultDatasetId' => 'dataset-2',
                'startedAt' => '2026-03-06T11:00:00.000Z',
                'finishedAt' => '2026-03-06T11:00:30.000Z',
            ],
        ], 200),
    ]);

    Sanctum::actingAs(makeAuthenticatedSocialUser());
    $profile = createSocialInstagramProfile();
    $followersDefinition = SocialMetricDefinition::query()->where('code', 'followers_total')->firstOrFail();

    $snapshot = SocialProfileSnapshot::query()->create([
        'social_profile_id' => $profile->id,
        'metric_date' => '2026-03-06',
        'captured_at' => '2026-03-06 06:10:00',
    ]);

    $metricValue = SocialProfileMetricValue::query()->create([
        'social_profile_snapshot_id' => $snapshot->id,
        'social_metric_definition_id' => $followersDefinition->id,
        'value_number' => 86000,
        'raw_key' => 'followersCount',
    ]);

    $this->postJson("/api/v1/social/profiles/{$profile->id}/sync")
        ->assertStatus(500)
        ->assertJsonPath('code', 'SOCIAL_PROFILE_SYNC_FAILED');

    $snapshot->refresh();
    $metricValue->refresh();

    expect(SocialProfileSnapshot::query()->where('social_profile_id', $profile->id)->count())->toBe(1);
    expect((float) $metricValue->value_number)->toBe(86000.0);

    $this->assertDatabaseHas('social_sync_runs', [
        'social_profile_id' => $profile->id,
        'status' => 'FAILED',
        'apify_run_id' => 'run-2',
    ]);
});
