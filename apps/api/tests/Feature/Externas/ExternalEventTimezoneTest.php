<?php

use App\Models\User;
use App\Modules\Externas\Models\ExternalEvent;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    config([
        'app.timezone' => 'UTC',
        'cache.default' => 'array',
        'vip_gallery.images.logo_anchors' => ['bottom_center'],
    ]);

    Schema::disableForeignKeyConstraints();
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
        $table->string('role')->nullable();
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
    Carbon::setTestNow();
});

function createExternalEventPayload(array $overrides = []): array
{
    $categoryId = DB::table('event_categories')->where('slug', 'cobertura')->value('id')
        ?: DB::table('event_categories')->insertGetId([
            'name' => 'Cobertura',
            'slug' => 'cobertura',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    $statusId = DB::table('event_statuses')->where('slug', 'agendado')->value('id')
        ?: DB::table('event_statuses')->insertGetId([
            'name' => 'Agendado',
            'slug' => 'agendado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    $collaboratorId = DB::table('users')->where('email', 'colaborador@example.com')->value('id')
        ?: DB::table('users')->insertGetId([
            'name' => 'Colaborador Teste',
            'email' => 'colaborador@example.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    $equipmentId = DB::table('equipments')->where('nome', 'Camera Teste')->value('id')
        ?: DB::table('equipments')->insertGetId([
            'nome' => 'Camera Teste',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    return array_merge([
        'titulo' => 'Evento com timezone',
        'category_id' => $categoryId,
        'status_id' => $statusId,
        'briefing' => 'Validar datas',
        'data_hora' => '2026-05-15T18:00',
        'data_hora_fim' => '2026-05-15T20:59',
        'local' => 'Tijucas',
        'colaboradores' => [
            ['user_id' => $collaboratorId, 'funcao' => 'Fotografo'],
        ],
        'equipamentos' => [
            ['equipment_id' => $equipmentId, 'checked' => false],
        ],
        'is_vip_gallery' => false,
    ], $overrides);
}

function createStoredExternalEvent(array $overrides = []): ExternalEvent
{
    $payload = createExternalEventPayload($overrides);

    return ExternalEvent::query()->create(collect($payload)
        ->except(['colaboradores', 'equipamentos'])
        ->toArray());
}

test('store accepts retroactive Sao Paulo local datetime and persists UTC', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-16 12:00:00', 'UTC'));

    $this->actingAs(User::factory()->make(['role' => 'admin']), 'sanctum')
        ->postJson('/api/v1/externas', createExternalEventPayload([
            'data_hora' => '2026-05-15T18:00',
            'data_hora_fim' => '2026-05-15T20:59',
        ]))
        ->assertCreated()
        ->assertJsonPath('data.data_hora', '2026-05-15T21:00:00.000000Z')
        ->assertJsonPath('data.data_hora_fim', '2026-05-15T23:59:00.000000Z');

    $event = ExternalEvent::query()->latest('id')->firstOrFail();

    expect($event->getRawOriginal('data_hora'))->toBe('2026-05-15 21:00:00')
        ->and($event->getRawOriginal('data_hora_fim'))->toBe('2026-05-15 23:59:00');

});

test('update rejects end datetime before start datetime', function () {
    $event = createStoredExternalEvent([
        'data_hora' => '2026-05-15 21:00:00',
        'data_hora_fim' => '2026-05-15 23:59:00',
    ]);

    $payload = createExternalEventPayload([
        'category_id' => $event->category_id,
        'status_id' => $event->status_id,
        'data_hora' => '2026-05-15T18:00',
        'data_hora_fim' => '2026-05-15T17:59',
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']), 'sanctum')
        ->putJson("/api/v1/externas/{$event->id}", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_hora_fim']);
});

test('update accepts retroactive Sao Paulo local datetime and persists UTC', function () {
    Carbon::setTestNow(Carbon::parse('2026-05-16 12:00:00', 'UTC'));

    $event = createStoredExternalEvent([
        'data_hora' => '2026-05-16 15:00:00',
        'data_hora_fim' => '2026-05-16 17:00:00',
    ]);

    $payload = createExternalEventPayload([
        'category_id' => $event->category_id,
        'status_id' => $event->status_id,
        'data_hora' => '2026-05-14T10:00',
        'data_hora_fim' => '2026-05-14T11:00',
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']), 'sanctum')
        ->putJson("/api/v1/externas/{$event->id}", $payload)
        ->assertOk()
        ->assertJsonPath('data.data_hora', '2026-05-14T13:00:00.000000Z')
        ->assertJsonPath('data.data_hora_fim', '2026-05-14T14:00:00.000000Z');

    $event->refresh();

    expect($event->getRawOriginal('data_hora'))->toBe('2026-05-14 13:00:00')
        ->and($event->getRawOriginal('data_hora_fim'))->toBe('2026-05-14 14:00:00');

});
