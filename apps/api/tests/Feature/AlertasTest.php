<?php

use App\Models\User;
use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertDestination;
use App\Modules\Alertas\Models\AlertDispatchLog;
use App\Modules\Alertas\Models\AlertDispatchRun;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config([
        'alertas.timezone' => 'America/Sao_Paulo',
        'alertas.queue' => 'default',
        'alertas.dashboard.next_firings_limit' => 5,
        'queue.default' => 'sync',
        'cache.default' => 'array',
        'whatsapp.zapi.base_url' => 'https://api.z-api.io',
        'whatsapp.zapi.instance' => 'instance-test',
        'whatsapp.zapi.token' => 'token-test',
        'whatsapp.zapi.client_token' => 'client-token-test',
        'whatsapp.zapi.timeout' => 10,
        'whatsapp.zapi.retry_times' => 1,
        'whatsapp.zapi.retry_sleep_ms' => 1,
    ]);

    Cache::flush();
    CarbonImmutable::setTestNow();

    Schema::dropIfExists('alert_dispatch_logs');
    Schema::dropIfExists('alert_dispatch_runs');
    Schema::dropIfExists('alert_schedule_rules');
    Schema::dropIfExists('alert_destination_links');
    Schema::dropIfExists('alerts');
    Schema::dropIfExists('alert_destinations');

    Schema::create('alert_destinations', function (Blueprint $table) {
        $table->id();
        $table->string('name', 191);
        $table->string('target_kind', 50);
        $table->string('target_value', 64);
        $table->json('tags')->nullable();
        $table->boolean('active')->default(true);
        $table->dateTime('archived_at')->nullable();
        $table->dateTime('last_sent_at')->nullable();
        $table->unsignedBigInteger('created_by')->nullable();
        $table->unsignedBigInteger('updated_by')->nullable();
        $table->string('whatsapp_group_fk', 26)->nullable();
        $table->timestamps();
        $table->unique(['target_kind', 'target_value']);
        $table->index('active');
        $table->index('last_sent_at');
    });

    Schema::create('alerts', function (Blueprint $table) {
        $table->id();
        $table->string('title', 191);
        $table->text('message');
        $table->boolean('active')->default(true);
        $table->dateTime('archived_at')->nullable();
        $table->unsignedBigInteger('created_by')->nullable();
        $table->unsignedBigInteger('updated_by')->nullable();
        $table->timestamps();
        $table->index('active');
    });

    Schema::create('alert_destination_links', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('alert_id');
        $table->unsignedBigInteger('destination_id');
        $table->timestamps();
        $table->unique(['alert_id', 'destination_id']);
    });

    Schema::create('alert_schedule_rules', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('alert_id');
        $table->string('schedule_type', 50);
        $table->unsignedTinyInteger('day_of_week')->nullable();
        $table->date('specific_date')->nullable();
        $table->string('time_hhmm', 5);
        $table->string('rule_key', 191);
        $table->boolean('active')->default(true);
        $table->timestamps();
        $table->unique(['alert_id', 'rule_key']);
        $table->index(['active', 'schedule_type', 'day_of_week', 'time_hhmm']);
        $table->index(['active', 'schedule_type', 'specific_date', 'time_hhmm']);
    });

    Schema::create('alert_dispatch_runs', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('alert_id');
        $table->unsignedBigInteger('schedule_rule_id')->nullable();
        $table->string('trigger_type', 50);
        $table->string('source_log_id', 26)->nullable();
        $table->json('source_context')->nullable();
        $table->dateTime('scheduled_for');
        $table->string('idempotency_key', 255)->unique();
        $table->string('status', 50);
        $table->unsignedInteger('destinations_total')->default(0);
        $table->unsignedInteger('destinations_success')->default(0);
        $table->unsignedInteger('destinations_failed')->default(0);
        $table->dateTime('started_at')->nullable();
        $table->dateTime('finished_at')->nullable();
        $table->text('error_message')->nullable();
        $table->unsignedBigInteger('created_by')->nullable();
        $table->timestamps();
        $table->index(['alert_id', 'scheduled_for']);
        $table->index(['status', 'scheduled_for']);
        $table->index(['trigger_type', 'created_at']);
    });

    Schema::create('alert_dispatch_logs', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->string('dispatch_run_id', 26);
        $table->unsignedBigInteger('alert_id');
        $table->unsignedBigInteger('destination_id');
        $table->string('alert_title_snapshot', 191);
        $table->string('destination_name_snapshot', 191);
        $table->string('target_kind', 50);
        $table->string('target_value', 64);
        $table->text('message_snapshot');
        $table->string('status', 50);
        $table->string('provider', 50)->default('zapi');
        $table->string('provider_zaap_id', 191)->nullable();
        $table->string('provider_message_id', 191)->nullable();
        $table->string('provider_response_id', 191)->nullable();
        $table->unsignedInteger('provider_status_code')->nullable();
        $table->json('provider_response')->nullable();
        $table->text('error_message')->nullable();
        $table->dateTime('sent_at')->nullable();
        $table->timestamps();
        $table->unique(['dispatch_run_id', 'destination_id']);
        $table->index(['alert_id', 'sent_at']);
        $table->index(['destination_id', 'sent_at']);
        $table->index(['status', 'sent_at']);
        $table->index(['dispatch_run_id', 'status']);
    });
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function makeAuthenticatedAlertUser(): User
{
    return User::factory()->make([
        'id' => 1,
        'active' => true,
        'role' => 'admin',
    ]);
}

function createAlertDestination(array $attributes = []): AlertDestination
{
    return AlertDestination::query()->create(array_merge([
        'name' => 'Grupo Jornal VIP',
        'target_kind' => AlertDestination::KIND_GROUP,
        'target_value' => '120363027326371817-group',
        'tags' => ['jornal'],
        'active' => true,
    ], $attributes));
}

function createAlertWithRule(array $attributes = [], array $rule = []): Alert
{
    $alert = Alert::query()->create(array_merge([
        'title' => 'Jornal VIP Meio-dia',
        'message' => 'Em instantes comeca o Jornal VIP.',
        'active' => true,
    ], $attributes));

    $alert->scheduleRules()->create(array_merge([
        'schedule_type' => 'weekly',
        'day_of_week' => 5,
        'specific_date' => null,
        'time_hhmm' => '11:45',
        'rule_key' => 'weekly:5:11:45',
        'active' => true,
    ], $rule));

    return $alert;
}

test('alertas endpoints require authentication', function () {
    $this->getJson('/api/v1/alertas/dashboard/stats')
        ->assertStatus(401);
});

test('destination can be created and group target is detected', function () {
    Sanctum::actingAs(makeAuthenticatedAlertUser());

    $this->postJson('/api/v1/alertas/destinos', [
            'name' => 'Grupo Noticias VIP',
            'phone_number' => '120363027326371817-group',
            'tags' => ['noticias', 'vip'],
            'active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Grupo Noticias VIP')
        ->assertJsonPath('data.phone_number', '120363027326371817-group')
        ->assertJsonPath('data.target_kind', 'whatsapp_group');

    $this->assertDatabaseHas('alert_destinations', [
        'name' => 'Grupo Noticias VIP',
        'target_kind' => 'whatsapp_group',
        'target_value' => '120363027326371817-group',
    ]);
});

test('alert can be created with destinations and schedule rules', function () {
    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();

    $this->postJson('/api/v1/alertas', [
            'title' => 'Jornal VIP Meio-dia',
            'message' => 'Em instantes comeca o Jornal VIP.',
            'active' => true,
            'destination_ids' => [$destination->id],
            'schedule_rules' => [
                [
                    'schedule_type' => 'weekly',
                    'day_of_week' => 5,
                    'time_hhmm' => '11:45',
                    'active' => true,
                ],
                [
                    'schedule_type' => 'weekly',
                    'day_of_week' => 6,
                    'time_hhmm' => '09:00',
                    'active' => true,
                ],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Jornal VIP Meio-dia')
        ->assertJsonPath('data.destination_count', 1)
        ->assertJsonPath('data.schedule_rules.0.time_hhmm', '11:45')
        ->assertJsonPath('data.schedule_rules.1.time_hhmm', '09:00');

    $this->assertDatabaseHas('alerts', [
        'title' => 'Jornal VIP Meio-dia',
    ]);

    $this->assertDatabaseHas('alert_schedule_rules', [
        'rule_key' => 'weekly:5:11:45',
    ]);
});

test('manual send creates dispatch run and logs provider ids preserving group target', function () {
    Http::fake([
        '*' => Http::response([
            'zaapId' => 'zaap-123',
            'messageId' => 'msg-456',
            'id' => 'msg-456',
        ], 200),
    ]);

    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();
    $alert = createAlertWithRule();
    $alert->destinations()->sync([$destination->id]);

    $response = $this->postJson('/api/v1/alertas/' . $alert->id . '/send', [], [
            'Idempotency-Key' => 'alert-send-now-1',
        ])
        ->assertOk()
        ->assertJsonPath('data.dispatch_run.trigger_type', 'manual')
        ->assertJsonPath('data.dispatch_run.destinations_total', 1);

    $runId = $response->json('data.dispatch_run.dispatch_run_id');

    $this->assertDatabaseHas('alert_dispatch_runs', [
        'id' => $runId,
        'alert_id' => $alert->id,
        'trigger_type' => 'manual',
    ]);

    $this->assertDatabaseHas('alert_dispatch_logs', [
        'dispatch_run_id' => $runId,
        'destination_id' => $destination->id,
        'status' => 'success',
        'provider_zaap_id' => 'zaap-123',
        'provider_message_id' => 'msg-456',
        'provider_response_id' => 'msg-456',
        'target_value' => '120363027326371817-group',
    ]);

    $this->getJson('/api/v1/alertas/logs')
        ->assertOk()
        ->assertJsonPath('data.0.dispatch_run_id', $runId)
        ->assertJsonPath('data.0.target_kind', 'whatsapp_group')
        ->assertJsonPath('data.0.response_message_id', 'msg-456');

    Http::assertSent(function (Request $request): bool {
        return $request->url() === 'https://api.z-api.io/instances/instance-test/token/token-test/send-text'
            && $request['phone'] === '120363027326371817-group'
            && $request['message'] === 'Em instantes comeca o Jornal VIP.';
    });
});

test('dashboard stats and next firings return operational data', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-06 10:00:00', 'America/Sao_Paulo'));

    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();
    $alert = createAlertWithRule();
    $alert->destinations()->sync([$destination->id]);

    $run = AlertDispatchRun::query()->create([
        'alert_id' => $alert->id,
        'schedule_rule_id' => $alert->scheduleRules()->value('id'),
        'trigger_type' => AlertDispatchRun::TRIGGER_SCHEDULER,
        'scheduled_for' => '2026-03-06 09:45:00',
        'idempotency_key' => 'scheduler:alert-' . $alert->id . ':rule-1:2026-03-06T09:45:00-03:00',
        'status' => AlertDispatchRun::STATUS_SUCCESS,
        'destinations_total' => 1,
        'destinations_success' => 1,
        'destinations_failed' => 0,
        'started_at' => '2026-03-06 09:45:00',
        'finished_at' => '2026-03-06 09:45:03',
    ]);

    AlertDispatchLog::query()->create([
        'dispatch_run_id' => $run->id,
        'alert_id' => $alert->id,
        'destination_id' => $destination->id,
        'alert_title_snapshot' => $alert->title,
        'destination_name_snapshot' => $destination->name,
        'target_kind' => $destination->target_kind,
        'target_value' => $destination->target_value,
        'message_snapshot' => $alert->message,
        'status' => AlertDispatchLog::STATUS_SUCCESS,
        'provider' => 'zapi',
        'provider_zaap_id' => 'zaap-dashboard',
        'provider_message_id' => 'msg-dashboard',
        'provider_response_id' => 'msg-dashboard',
        'provider_response' => ['messageId' => 'msg-dashboard'],
        'sent_at' => '2026-03-06 09:45:02',
    ]);

    $this->getJson('/api/v1/alertas/dashboard/stats')
        ->assertOk()
        ->assertJsonPath('data.total_destinations', 1)
        ->assertJsonPath('data.active_destinations', 1)
        ->assertJsonPath('data.total_alerts', 1)
        ->assertJsonPath('data.active_alerts', 1)
        ->assertJsonPath('data.overdue_alerts', 0)
        ->assertJsonPath('data.today_sent', 1)
        ->assertJsonPath('data.failed_last_7_days', 0);

    $this->getJson('/api/v1/alertas/dashboard/next-firings?limit=5')
        ->assertOk()
        ->assertJsonPath('data.0.alert_id', $alert->id)
        ->assertJsonPath('data.0.scheduled_time', '11:45')
        ->assertJsonPath('data.0.destination_count', 1);
});

test('alert list and dashboard expose overdue scheduler gap when a due alert has no run', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-06 10:00:00', 'America/Sao_Paulo'));

    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();
    $alert = createAlertWithRule([], [
        'day_of_week' => 5,
        'time_hhmm' => '09:45',
        'rule_key' => 'weekly:5:09:45',
    ]);
    Alert::query()->whereKey($alert->id)->update([
        'created_at' => '2026-03-06 08:00:00',
        'updated_at' => '2026-03-06 08:00:00',
    ]);
    $alert->refresh();
    $alert->destinations()->sync([$destination->id]);

    $this->getJson('/api/v1/alertas?per_page=10&include_inactive=1')
        ->assertOk()
        ->assertJsonPath('data.0.alert_id', $alert->id)
        ->assertJsonPath('data.0.monitoring.state', 'missed')
        ->assertJsonPath('data.0.monitoring.delay_minutes', 15)
        ->assertJsonPath('data.0.monitoring.label', 'Disparo atrasado');

    $this->getJson('/api/v1/alertas/dashboard/stats')
        ->assertOk()
        ->assertJsonPath('data.overdue_alerts', 1);
});

test('retry endpoint creates a new retry run for original destination', function () {
    Http::fake([
        '*' => Http::response([
            'zaapId' => 'zaap-retry',
            'messageId' => 'msg-retry',
            'id' => 'msg-retry',
        ], 200),
    ]);

    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();
    $alert = createAlertWithRule();
    $alert->destinations()->sync([$destination->id]);

    $originalRun = AlertDispatchRun::query()->create([
        'alert_id' => $alert->id,
        'trigger_type' => AlertDispatchRun::TRIGGER_MANUAL,
        'scheduled_for' => '2026-03-06 08:00:00',
        'idempotency_key' => 'manual:alert-' . $alert->id . ':test-original',
        'status' => AlertDispatchRun::STATUS_FAILED,
        'destinations_total' => 1,
        'destinations_success' => 0,
        'destinations_failed' => 1,
        'started_at' => '2026-03-06 08:00:00',
        'finished_at' => '2026-03-06 08:00:10',
    ]);

    $log = AlertDispatchLog::query()->create([
        'dispatch_run_id' => $originalRun->id,
        'alert_id' => $alert->id,
        'destination_id' => $destination->id,
        'alert_title_snapshot' => $alert->title,
        'destination_name_snapshot' => $destination->name,
        'target_kind' => $destination->target_kind,
        'target_value' => $destination->target_value,
        'message_snapshot' => $alert->message,
        'status' => AlertDispatchLog::STATUS_FAILED,
        'provider' => 'zapi',
        'error_message' => 'Timeout no provider',
    ]);

    $response = $this->postJson('/api/v1/alertas/logs/' . $log->id . '/retry', [], [
            'Idempotency-Key' => 'alert-retry-1',
        ])
        ->assertOk()
        ->assertJsonPath('data.dispatch_run.trigger_type', 'retry');

    $retryRunId = $response->json('data.dispatch_run.dispatch_run_id');

    expect($retryRunId)->not->toBe($originalRun->id);

    $this->assertDatabaseHas('alert_dispatch_runs', [
        'id' => $retryRunId,
        'source_log_id' => $log->id,
        'trigger_type' => 'retry',
    ]);

    $this->assertDatabaseHas('alert_dispatch_logs', [
        'dispatch_run_id' => $retryRunId,
        'provider_message_id' => 'msg-retry',
        'status' => 'success',
    ]);
});

test('sent late state stays visible on alert list but does not count as open overdue and recent logs expose scheduler trigger in sao paulo time', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-06 10:30:00', 'America/Sao_Paulo'));

    Sanctum::actingAs(makeAuthenticatedAlertUser());
    $destination = createAlertDestination();
    $alert = createAlertWithRule([], [
        'day_of_week' => 5,
        'time_hhmm' => '09:45',
        'rule_key' => 'weekly:5:09:45',
    ]);
    Alert::query()->whereKey($alert->id)->update([
        'created_at' => '2026-03-06 08:00:00',
        'updated_at' => '2026-03-06 08:00:00',
    ]);
    $alert->refresh();
    $alert->destinations()->sync([$destination->id]);

    $run = AlertDispatchRun::query()->create([
        'alert_id' => $alert->id,
        'schedule_rule_id' => $alert->scheduleRules()->value('id'),
        'trigger_type' => AlertDispatchRun::TRIGGER_SCHEDULER,
        'scheduled_for' => '2026-03-06 09:45:00',
        'idempotency_key' => 'scheduler:alert-' . $alert->id . ':rule-2:2026-03-06T09:45:00-03:00',
        'status' => AlertDispatchRun::STATUS_SUCCESS,
        'destinations_total' => 1,
        'destinations_success' => 1,
        'destinations_failed' => 0,
        'started_at' => '2026-03-06 09:45:00',
        'finished_at' => '2026-03-06 10:15:00',
    ]);

    AlertDispatchLog::query()->create([
        'dispatch_run_id' => $run->id,
        'alert_id' => $alert->id,
        'destination_id' => $destination->id,
        'alert_title_snapshot' => $alert->title,
        'destination_name_snapshot' => $destination->name,
        'target_kind' => $destination->target_kind,
        'target_value' => $destination->target_value,
        'message_snapshot' => $alert->message,
        'status' => AlertDispatchLog::STATUS_SUCCESS,
        'provider' => 'zapi',
        'provider_zaap_id' => 'zaap-late',
        'provider_message_id' => 'msg-late',
        'provider_response_id' => 'msg-late',
        'provider_response' => ['messageId' => 'msg-late'],
        'sent_at' => '2026-03-06 10:15:00',
    ]);

    $this->getJson('/api/v1/alertas?per_page=10&include_inactive=1')
        ->assertOk()
        ->assertJsonPath('data.0.monitoring.state', 'sent_late');

    $this->getJson('/api/v1/alertas/dashboard/stats')
        ->assertOk()
        ->assertJsonPath('data.overdue_alerts', 0);

    $this->getJson('/api/v1/alertas/dashboard/recent-logs?limit=5')
        ->assertOk()
        ->assertJsonPath('data.0.trigger_type', 'scheduler')
        ->assertJsonPath('data.0.sent_at', '2026-03-06T10:15:00-03:00');
});
