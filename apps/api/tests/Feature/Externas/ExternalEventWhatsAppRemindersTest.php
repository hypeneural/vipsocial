<?php

use App\Models\User;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\Externas\Services\ExternalEventWhatsAppNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    config([
        'app.timezone' => 'UTC',
        'cache.default' => 'array',
        'queue.default' => 'sync',
        'externas.timezone' => 'America/Sao_Paulo',
        'externas.whatsapp_queue' => 'default',
        'externas.whatsapp_due_batch_limit' => 200,
        'externas.whatsapp_default_targets' => ['554896318744-1499088823'],
        'vip_gallery.images.logo_anchors' => ['bottom_center'],
        'whatsapp.zapi.base_url' => 'https://api.z-api.io',
        'whatsapp.zapi.instance' => 'instance-test',
        'whatsapp.zapi.token' => 'token-test',
        'whatsapp.zapi.client_token' => 'client-token-test',
        'whatsapp.zapi.timeout' => 10,
        'whatsapp.zapi.retry_times' => 1,
        'whatsapp.zapi.retry_sleep_ms' => 1,
    ]);

    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-14 12:00:00', 'America/Sao_Paulo'));

    Schema::disableForeignKeyConstraints();
    Schema::dropIfExists('external_event_whatsapp_notifications');
    Schema::dropIfExists('event_equipment');
    Schema::dropIfExists('event_collaborators');
    Schema::dropIfExists('event_activity_logs');
    Schema::dropIfExists('activity_log');
    Schema::dropIfExists('vip_gallery_banners');
    Schema::dropIfExists('equipments');
    Schema::dropIfExists('users');
    Schema::dropIfExists('external_events');
    Schema::dropIfExists('event_statuses');
    Schema::dropIfExists('event_categories');
    Schema::enableForeignKeyConstraints();

    Schema::create('event_categories', function (Blueprint $table) {
        $table->id();
        $table->string('name', 100);
        $table->string('slug', 100)->unique();
        $table->string('icon', 50)->default('FileText');
        $table->string('color', 50)->default('bg-gray-500');
        $table->integer('sort_order')->default(0);
        $table->timestamps();
    });

    Schema::create('event_statuses', function (Blueprint $table) {
        $table->id();
        $table->string('name', 100);
        $table->string('slug', 100)->unique();
        $table->string('icon', 50)->default('CircleDot');
        $table->string('color', 50)->default('bg-gray-500');
        $table->integer('sort_order')->default(0);
        $table->timestamps();
    });

    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->nullable();
        $table->string('password')->nullable();
        $table->string('phone', 30)->nullable();
        $table->string('role')->nullable();
        $table->string('department')->nullable();
        $table->boolean('active')->default(true);
        $table->timestamp('email_verified_at')->nullable();
        $table->timestamp('deleted_at')->nullable();
        $table->rememberToken();
        $table->timestamps();
    });

    Schema::create('equipments', function (Blueprint $table) {
        $table->id();
        $table->string('nome');
        $table->timestamps();
    });

    Schema::create('external_events', function (Blueprint $table) {
        $table->id();
        $table->string('titulo', 200);
        $table->unsignedBigInteger('category_id');
        $table->unsignedBigInteger('status_id');
        $table->text('briefing')->nullable();
        $table->dateTime('data_hora');
        $table->dateTime('data_hora_fim')->nullable();
        $table->string('local', 200);
        $table->string('endereco_completo', 300)->nullable();
        $table->string('contato_nome', 100)->nullable();
        $table->string('contato_whatsapp', 30)->nullable();
        $table->text('observacao_interna')->nullable();
        $table->boolean('is_vip_gallery')->default(false);
        $table->string('vip_gallery_status', 50)->default(ExternalEvent::VIP_GALLERY_STATUS_DRAFT);
        $table->string('whatsapp_group_id', 120)->nullable();
        $table->string('gallery_slug', 160)->nullable()->unique();
        $table->string('custom_logo_path')->nullable();
        $table->unsignedInteger('logo_size_percent')->default(15);
        $table->string('logo_anchor', 32)->default('bottom_center');
        $table->decimal('logo_offset_x_percent', 5, 2)->default(3);
        $table->decimal('logo_offset_y_percent', 5, 2)->default(3);
        $table->unsignedBigInteger('views_count')->default(0);
        $table->boolean('allow_pause_command')->default(true);
        $table->boolean('allow_delete_command')->default(false);
        $table->string('pause_command_keyword', 100)->default('Parar,Pausar');
        $table->string('delete_command_keyword', 100)->default('Apagar');
        $table->softDeletes();
        $table->timestamps();
    });

    Schema::create('event_collaborators', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('event_id');
        $table->unsignedBigInteger('user_id');
        $table->string('funcao', 100)->nullable();
        $table->timestamps();
        $table->unique(['event_id', 'user_id']);
    });

    Schema::create('event_equipment', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('event_id');
        $table->unsignedBigInteger('equipment_id');
        $table->boolean('checked')->default(false);
        $table->timestamps();
    });

    Schema::create('event_activity_logs', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('event_id');
        $table->unsignedBigInteger('user_id')->nullable();
        $table->string('action');
        $table->text('description');
        $table->json('changes')->nullable();
        $table->timestamps();
    });

    Schema::create('vip_gallery_banners', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('external_event_id');
        $table->string('path');
        $table->string('url')->nullable();
        $table->unsignedInteger('sort_order')->default(0);
        $table->timestamps();
    });

    Schema::create('external_event_whatsapp_notifications', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('external_event_id');
        $table->string('trigger_type', 50);
        $table->string('recipient_type', 50);
        $table->unsignedBigInteger('recipient_user_id')->nullable();
        $table->string('recipient_name_snapshot')->nullable();
        $table->string('recipient_role_snapshot', 100)->nullable();
        $table->string('target_kind', 50);
        $table->string('target_value', 64);
        $table->text('message_snapshot');
        $table->string('event_title_snapshot');
        $table->dateTime('event_start_snapshot');
        $table->dateTime('scheduled_for');
        $table->string('status', 50);
        $table->string('idempotency_key', 191)->unique();
        $table->string('provider', 50)->default('zapi');
        $table->string('provider_zaap_id', 191)->nullable();
        $table->string('provider_message_id', 191)->nullable();
        $table->string('provider_response_id', 191)->nullable();
        $table->integer('provider_status_code')->nullable();
        $table->json('provider_response')->nullable();
        $table->text('error_message')->nullable();
        $table->dateTime('sent_at')->nullable();
        $table->timestamps();
    });

    Schema::create('activity_log', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->string('log_name')->nullable();
        $table->text('description');
        $table->unsignedBigInteger('subject_id')->nullable();
        $table->string('subject_type')->nullable();
        $table->unsignedBigInteger('causer_id')->nullable();
        $table->string('causer_type')->nullable();
        $table->string('event')->nullable();
        $table->json('properties')->nullable();
        $table->uuid('batch_uuid')->nullable();
        $table->string('ip_address', 45)->nullable();
        $table->text('user_agent')->nullable();
        $table->uuid('request_id')->nullable();
        $table->uuid('trace_id')->nullable();
        $table->string('origin', 20)->nullable();
        $table->timestamps();
    });
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function remindersActingUser(): User
{
    return User::factory()->make([
        'id' => 999,
        'active' => true,
        'role' => 'admin',
    ]);
}

function remindersPayload(array $overrides = []): array
{
    $categoryId = DB::table('event_categories')->insertGetId([
        'name' => 'Cobertura',
        'slug' => 'cobertura-'.uniqid(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $statusId = DB::table('event_statuses')->insertGetId([
        'name' => 'Agendado',
        'slug' => 'agendado-'.uniqid(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $collaboratorId = DB::table('users')->insertGetId([
        'name' => 'Ana Maria Souza',
        'email' => 'ana-'.uniqid().'@example.com',
        'phone' => '(48) 99631-8744',
        'role' => 'Reporter',
        'department' => 'Jornalismo',
        'active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $equipmentId = DB::table('equipments')->insertGetId([
        'nome' => 'Camera Teste',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return array_merge([
        'titulo' => 'Coletiva da Prefeitura',
        'category_id' => $categoryId,
        'status_id' => $statusId,
        'briefing' => 'Cobrir fala de abertura e entrevista.',
        'data_hora' => '2026-05-15T18:00',
        'data_hora_fim' => '2026-05-15T20:00',
        'local' => 'Tijucas',
        'endereco_completo' => 'Rua Central, 100',
        'contato_nome' => 'Assessoria',
        'contato_whatsapp' => '(48) 99999-0000',
        'colaboradores' => [
            ['user_id' => $collaboratorId, 'funcao' => 'Reporter'],
        ],
        'equipamentos' => [
            ['equipment_id' => $equipmentId, 'checked' => false],
        ],
        'is_vip_gallery' => false,
    ], $overrides);
}

test('creating external event sends immediate whatsapp notifications and schedules two hour reminders', function () {
    Http::fake([
        '*' => Http::response([
            'zaapId' => 'zaap-created',
            'messageId' => 'msg-created',
            'id' => 'msg-created',
        ], 200),
    ]);

    $this->actingAs(remindersActingUser(), 'sanctum')
        ->postJson('/api/v1/externas', remindersPayload())
        ->assertCreated();

    $eventId = ExternalEvent::query()->value('id');

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $eventId,
        'trigger_type' => 'created',
        'recipient_type' => 'collaborator',
        'target_kind' => 'whatsapp_phone',
        'target_value' => '5548996318744',
        'status' => 'success',
        'provider_message_id' => 'msg-created',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $eventId,
        'trigger_type' => 'created',
        'recipient_type' => 'default_target',
        'target_kind' => 'whatsapp_group',
        'target_value' => '554896318744-1499088823',
        'status' => 'success',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $eventId,
        'trigger_type' => 'two_hours_before',
        'recipient_type' => 'collaborator',
        'target_value' => '5548996318744',
        'scheduled_for' => '2026-05-15 19:00:00',
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $eventId,
        'trigger_type' => 'two_hours_before',
        'recipient_type' => 'default_target',
        'target_value' => '554896318744-1499088823',
        'scheduled_for' => '2026-05-15 19:00:00',
        'status' => 'pending',
    ]);

    Http::assertSentCount(2);
    Http::assertSent(function (Request $request): bool {
        return $request['phone'] === '5548996318744'
            && str_starts_with((string) $request['message'], '📅 Ana,')
            && str_contains((string) $request['message'], '🎬 *Evento:* Coletiva da Prefeitura')
            && str_contains((string) $request['message'], '🗓️ *Inicio:* 15/05/2026 18:00')
            && ! str_contains((string) $request['message'], '*Funcao:*');
    });
    Http::assertSent(function (Request $request): bool {
        return $request['phone'] === '554896318744-1499088823'
            && str_contains((string) $request['message'], '📅 *Nova externa agendada*')
            && str_contains((string) $request['message'], '👥 *Colaboradores:* Ana Maria Souza')
            && ! str_contains((string) $request['message'], '*Funcao:*');
    });

    app(ExternalEventWhatsAppNotificationService::class)->handleEventCreated(
        ExternalEvent::query()->with('collaborators')->firstOrFail()
    );

    expect(DB::table('external_event_whatsapp_notifications')->where('trigger_type', 'created')->count())->toBe(2);
    Http::assertSentCount(2);
});

test('updating start datetime sends date changed notifications and replaces pending reminders', function () {
    Http::fake(['*' => Http::response(['messageId' => 'msg-update', 'id' => 'msg-update'], 200)]);

    $this->actingAs(remindersActingUser(), 'sanctum')
        ->postJson('/api/v1/externas', remindersPayload())
        ->assertCreated();

    $event = ExternalEvent::query()->with('collaborators')->firstOrFail();
    DB::table('external_event_whatsapp_notifications')
        ->where('trigger_type', 'created')
        ->delete();

    $payload = remindersPayload([
        'category_id' => $event->category_id,
        'status_id' => $event->status_id,
        'data_hora' => '2026-05-16T09:30',
        'data_hora_fim' => '2026-05-16T11:00',
        'colaboradores' => $event->collaborators->map(fn (User $user) => [
            'user_id' => $user->id,
            'funcao' => $user->pivot->funcao,
        ])->all(),
    ]);

    $this->actingAs(remindersActingUser(), 'sanctum')
        ->putJson("/api/v1/externas/{$event->id}", $payload)
        ->assertOk();

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $event->id,
        'trigger_type' => 'date_changed',
        'recipient_type' => 'collaborator',
        'target_value' => '5548996318744',
        'status' => 'success',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $event->id,
        'trigger_type' => 'date_changed',
        'recipient_type' => 'default_target',
        'target_value' => '554896318744-1499088823',
        'status' => 'success',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $event->id,
        'trigger_type' => 'two_hours_before',
        'scheduled_for' => '2026-05-15 19:00:00',
        'status' => 'cancelled',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'external_event_id' => $event->id,
        'trigger_type' => 'two_hours_before',
        'scheduled_for' => '2026-05-16 10:30:00',
        'status' => 'pending',
    ]);
});

test('due reminder command dispatches pending notifications and records provider response', function () {
    Http::fake(['*' => Http::response([
        'zaapId' => 'zaap-reminder',
        'messageId' => 'msg-reminder',
        'id' => 'msg-reminder',
    ], 200)]);

    $this->actingAs(remindersActingUser(), 'sanctum')
        ->postJson('/api/v1/externas', remindersPayload())
        ->assertCreated();

    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-15 16:00:00', 'America/Sao_Paulo'));

    Artisan::call('externas:dispatch-due-whatsapp-reminders');

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'trigger_type' => 'two_hours_before',
        'target_value' => '5548996318744',
        'status' => 'success',
        'provider_message_id' => 'msg-reminder',
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'trigger_type' => 'two_hours_before',
        'target_value' => '554896318744-1499088823',
        'status' => 'success',
        'provider_message_id' => 'msg-reminder',
    ]);
});

test('provider errors are stored without failing event creation', function () {
    Http::fake(['*' => Http::response(['error' => 'provider-down'], 503)]);

    $this->actingAs(remindersActingUser(), 'sanctum')
        ->postJson('/api/v1/externas', remindersPayload())
        ->assertCreated();

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'trigger_type' => 'created',
        'target_value' => '5548996318744',
        'status' => 'failed',
        'provider_status_code' => 503,
    ]);

    $this->assertDatabaseHas('external_event_whatsapp_notifications', [
        'trigger_type' => 'created',
        'target_value' => '554896318744-1499088823',
        'status' => 'failed',
        'provider_status_code' => 503,
    ]);
});
