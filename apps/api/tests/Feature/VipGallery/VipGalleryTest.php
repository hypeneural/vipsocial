<?php

use App\Models\User;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Jobs\DeleteVipGalleryPhotoJob;
use App\Modules\VipGallery\Jobs\IngestVipGalleryImageJob;
use App\Modules\VipGallery\Jobs\PauseVipGalleryEventJob;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryWebhookJob;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryPhotoJob;
use App\Modules\VipGallery\Models\VipGalleryBanner;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config([
        'app.url' => 'https://adm.tvvip.social',
        'cache.default' => 'array',
        'vip_gallery.disk' => 'public',
        'vip_gallery.webhook.secret' => 'segredo-galeria',
        'vip_gallery.webhook.secret_header' => 'X-VIP-GALLERY-SECRET',
    ]);

    Storage::fake('public');

    Schema::disableForeignKeyConstraints();
    Schema::dropIfExists('vip_gallery_webhook_logs');
    Schema::dropIfExists('vip_gallery_banners');
    Schema::dropIfExists('vip_gallery_photos');
    Schema::dropIfExists('external_events');
    Schema::dropIfExists('event_statuses');
    Schema::dropIfExists('event_categories');
    Schema::dropIfExists('event_activity_logs');
    Schema::dropIfExists('activity_log');
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
        $table->string('vip_gallery_status', 50)->default('draft');
        $table->string('whatsapp_group_id', 120)->nullable();
        $table->string('gallery_slug', 160)->nullable()->unique();
        $table->string('custom_logo_path')->nullable();
        $table->unsignedInteger('logo_size_percent')->default(15);
        $table->unsignedBigInteger('views_count')->default(0);
        $table->boolean('allow_pause_command')->default(true);
        $table->boolean('allow_delete_command')->default(false);
        $table->string('pause_command_keyword', 100)->default('Parar,Pausar');
        $table->string('delete_command_keyword', 100)->default('Apagar');
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
        $table->char('request_id', 36)->nullable();
        $table->char('trace_id', 36)->nullable();
        $table->string('origin', 20)->default('api');
        $table->timestamps();
    });

    Schema::create('event_activity_logs', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('event_id');
        $table->unsignedBigInteger('user_id')->nullable();
        $table->string('action', 100);
        $table->text('description');
        $table->json('changes')->nullable();
        $table->timestamps();
    });

    Schema::create('vip_gallery_photos', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('external_event_id');
        $table->string('zapi_message_id', 100)->unique();
        $table->string('participant_phone', 30);
        $table->string('sender_name', 100)->nullable();
        $table->text('caption')->nullable();
        $table->text('original_image_url')->nullable();
        $table->string('original_image_path')->nullable();
        $table->string('processed_image_path')->nullable();
        $table->unsignedInteger('width')->default(0);
        $table->unsignedInteger('height')->default(0);
        $table->string('processing_status', 50)->default('received');
        $table->unsignedInteger('processing_attempts')->default(0);
        $table->timestamp('last_processing_attempt_at')->nullable();
        $table->text('processing_error')->nullable();
        $table->integer('sort_order')->default(0);
        $table->unsignedBigInteger('downloads_count')->default(0);
        $table->boolean('is_approved')->default(true);
        $table->timestamp('received_at')->nullable();
        $table->timestamp('published_at')->nullable();
        $table->softDeletes();
        $table->timestamps();
    });

    Schema::create('vip_gallery_banners', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('external_event_id');
        $table->string('image_path');
        $table->string('link_url')->nullable();
        $table->string('alt_text')->nullable();
        $table->unsignedInteger('width')->nullable();
        $table->unsignedInteger('height')->nullable();
        $table->integer('sort_order')->default(0);
        $table->boolean('is_active')->default(true);
        $table->timestamp('start_date')->nullable();
        $table->timestamp('end_date')->nullable();
        $table->timestamps();
    });

    Schema::create('vip_gallery_webhook_logs', function (Blueprint $table) {
        $table->id();
        $table->string('message_id', 100)->nullable();
        $table->string('phone', 120)->nullable();
        $table->string('detected_type', 50)->default('unknown');
        $table->string('routing_status', 50)->default('received');
        $table->json('payload_json');
        $table->unsignedBigInteger('vip_gallery_photo_id')->nullable();
        $table->text('error_message')->nullable();
        $table->timestamps();
    });
});

function createVipGalleryEvent(array $overrides = []): ExternalEvent
{
    $categoryId = DB::table('event_categories')->where('slug', 'cobertura')->value('id');

    if (! $categoryId) {
        $categoryId = DB::table('event_categories')->insertGetId([
            'name' => 'Cobertura',
            'slug' => 'cobertura',
            'icon' => 'FileText',
            'color' => 'bg-gray-500',
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $statusId = DB::table('event_statuses')->where('slug', 'confirmado')->value('id');

    if (! $statusId) {
        $statusId = DB::table('event_statuses')->insertGetId([
            'name' => 'Confirmado',
            'slug' => 'confirmado',
            'icon' => 'CircleDot',
            'color' => 'bg-green-500',
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $viewsCount = (int) ($overrides['views_count'] ?? 5);
    unset($overrides['views_count']);

    $event = ExternalEvent::query()->create(array_merge([
        'titulo' => 'Casamento VIP',
        'category_id' => $categoryId,
        'status_id' => $statusId,
        'briefing' => 'Cobertura ao vivo',
        'data_hora' => now()->addDay(),
        'local' => 'Belem',
        'is_vip_gallery' => true,
        'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_ACTIVE,
        'whatsapp_group_id' => '120363027326371817-group',
        'gallery_slug' => 'casamento-vip',
        'logo_size_percent' => 15,
        'allow_pause_command' => true,
        'allow_delete_command' => true,
        'pause_command_keyword' => 'Parar,Pausar',
        'delete_command_keyword' => 'Apagar',
    ], $overrides));

    $event->forceFill([
        'views_count' => $viewsCount,
    ])->save();

    return $event;
}

function fakeJpegBinary(): string
{
    $image = imagecreatetruecolor(20, 10);
    $background = imagecolorallocate($image, 255, 0, 0);
    imagefill($image, 0, 0, $background);

    ob_start();
    imagejpeg($image);
    $binary = (string) ob_get_clean();

    imagedestroy($image);

    return $binary;
}

test('webhook gallery rejects invalid secret', function () {
    $this->postJson('/api/v1/webhook/zapi/gallery', [
        'messageId' => 'msg-1',
    ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');
});

test('webhook gallery logs payload and queues processing job', function () {
    Queue::fake();

    $response = $this->withHeader('X-VIP-GALLERY-SECRET', 'segredo-galeria')
        ->postJson('/api/v1/webhook/zapi/gallery', [
            'messageId' => 'msg-1',
            'groupId' => '120363027326371817-group',
            'participantPhone' => '5591999999999',
            'senderName' => 'Anderson',
            'isImage' => true,
            'imageUrl' => 'https://example.com/photo.jpg',
        ]);

    $response
        ->assertStatus(202)
        ->assertJsonPath('data.accepted', true);

    $this->assertDatabaseHas('vip_gallery_webhook_logs', [
        'message_id' => 'msg-1',
        'phone' => '120363027326371817-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_IMAGE,
        'routing_status' => 'received',
    ]);

    Queue::assertPushed(ProcessVipGalleryWebhookJob::class, 1);
});

test('sample z-api image payload resolves event by group phone and stores sender metadata on photo', function () {
    Http::fake([
        'https://f004.backblazeb2.com/*' => Http::response(fakeJpegBinary(), 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    Queue::fake();

    $event = createVipGalleryEvent([
        'whatsapp_group_id' => '120363423950458112-group',
        'gallery_slug' => 'galeria-1',
    ]);

    $payload = [
        'isStatusReply' => false,
        'chatLid' => null,
        'connectedPhone' => '554896727305',
        'waitingMessage' => false,
        'isEdit' => false,
        'isGroup' => true,
        'isNewsletter' => false,
        'instanceId' => '3DC6FE77FBBF108997D596155CBF9532',
        'messageId' => '2AD96B84D25767193C35',
        'phone' => '120363423950458112-group',
        'fromMe' => false,
        'momment' => 1772997259000,
        'status' => 'RECEIVED',
        'chatName' => 'Galeria 1',
        'senderName' => 'Anderson Marques',
        'broadcast' => false,
        'participantPhone' => '554896553954',
        'participantLid' => null,
        'messageExpirationSeconds' => 0,
        'forwarded' => false,
        'type' => 'ReceivedCallback',
        'fromApi' => false,
        'image' => [
            'imageUrl' => 'https://f004.backblazeb2.com/file/temp-file-download/instances/3DC6FE77FBBF108997D596155CBF9532/2AD96B84D25767193C35/test.jpg',
            'thumbnailUrl' => 'https://f004.backblazeb2.com/file/temp-file-download/instances/3DC6FE77FBBF108997D596155CBF9532/2AD96B84D25767193C35/test.jpg',
            'caption' => '',
            'mimeType' => 'image/jpeg',
            'viewOnce' => false,
            'width' => 720,
            'height' => 1280,
        ],
    ];

    $response = $this->withHeader('X-VIP-GALLERY-SECRET', 'segredo-galeria')
        ->postJson('/api/v1/webhook/zapi/gallery', $payload);

    $logId = $response->json('data.log_id');

    $log = VipGalleryWebhookLog::query()->findOrFail($logId);
    expect($log->phone)->toBe('120363423950458112-group');

    (new ProcessVipGalleryWebhookJob($logId))->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    expect($log->fresh()->routing_status)->toBe('queued_ingest');
    (new IngestVipGalleryImageJob($logId, $event->id))->handle(app(\App\Modules\VipGallery\Support\VipGalleryMediaManager::class));

    $photo = VipGalleryPhoto::query()->where('zapi_message_id', '2AD96B84D25767193C35')->first();

    expect($photo)->not->toBeNull();
    expect($photo?->external_event_id)->toBe($event->id);
    expect($photo?->participant_phone)->toBe('554896553954');
    expect($photo?->sender_name)->toBe('Anderson Marques');
    expect($photo?->processing_status)->toBe(VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL);
    expect(Storage::disk('public')->exists((string) $photo?->original_image_path))->toBeTrue();
});

test('public gallery detail and photos expose only visible records', function () {
    $event = createVipGalleryEvent();

    VipGalleryBanner::query()->create([
        'external_event_id' => $event->id,
        'image_path' => 'vip-gallery/banners/banner.jpg',
        'alt_text' => 'Banner VIP',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    Storage::disk('public')->put('vip-gallery/banners/banner.jpg', 'banner');
    Storage::disk('public')->put('vip-gallery/events/'.$event->id.'/processed/msg-1.jpg', 'photo-1');
    Storage::disk('public')->put('vip-gallery/events/'.$event->id.'/originals/msg-2.jpg', 'photo-2');

    VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-1',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'processed_image_path' => 'vip-gallery/events/'.$event->id.'/processed/msg-1.jpg',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-1.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
        'downloads_count' => 7,
        'published_at' => now()->subMinute(),
        'received_at' => now()->subMinutes(2),
    ]);

    VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-2',
        'participant_phone' => '5591888888888',
        'sender_name' => 'Bruna',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-2.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_FAILED,
        'published_at' => now()->subMinutes(3),
        'received_at' => now()->subMinutes(4),
    ]);

    $this->getJson('/api/v1/gallery/casamento-vip')
        ->assertOk()
        ->assertJsonPath('data.slug', 'casamento-vip')
        ->assertJsonPath('data.status', ExternalEvent::VIP_GALLERY_STATUS_ACTIVE)
        ->assertJsonPath('data.configured_status', ExternalEvent::VIP_GALLERY_STATUS_ACTIVE)
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.accepting_photos', true)
        ->assertJsonPath('data.public_url', 'https://www.coberturavip.com.br/casamento-vip')
        ->assertJsonPath('data.stats.total_photos', 1)
        ->assertJsonPath('data.stats.total_downloads', 7)
        ->assertJsonPath('data.stats.views_count', 5)
        ->assertJsonPath('data.hasBanners', true)
        ->assertJsonPath('data.banners.0.alt_text', 'Banner VIP');

    $this->getJson('/api/v1/gallery/casamento-vip/photos')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.image_url', 'https://adm.tvvip.social/storage/vip-gallery/events/'.$event->id.'/processed/msg-1.jpg')
        ->assertJsonPath('data.0.is_processed', true)
        ->assertJsonPath('data.0.sender_name', 'Anderson')
        ->assertJsonPath('next_cursor', null)
        ->assertJsonPath('has_more', false)
        ->assertJsonPath('meta.next_cursor', null)
        ->assertJsonPath('meta.has_more', false);
});

test('public gallery sends cors header for public gallery domain', function () {
    createVipGalleryEvent([
        'gallery_slug' => 'galeria-cors',
        'whatsapp_group_id' => '120363423950458112-group',
    ]);

    $this->withHeader('Origin', 'https://coberturavip.com.br')
        ->getJson('/api/v1/gallery')
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', 'https://coberturavip.com.br');
});

test('public storage route serves vip gallery files without relying on storage symlink', function () {
    $binary = fakeJpegBinary();
    $path = 'vip-gallery/events/1/processed/test-image.jpg';

    Storage::disk('public')->put($path, $binary);

    $this->get('/storage/'.$path)
        ->assertOk()
        ->assertHeader('Cache-Control', 'public');
});

test('public gallery discovery lists only active galleries with visible photos and auto opens single result', function () {
    $visibleEvent = createVipGalleryEvent([
        'gallery_slug' => 'galeria-visivel',
        'whatsapp_group_id' => '120363423950458112-group',
    ]);

    VipGalleryPhoto::query()->create([
        'external_event_id' => $visibleEvent->id,
        'zapi_message_id' => 'visible-msg-1',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'processed_image_path' => 'vip-gallery/events/'.$visibleEvent->id.'/processed/visible-msg-1.jpg',
        'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
        'received_at' => now()->subMinute(),
        'published_at' => now()->subSeconds(30),
    ]);

    Storage::disk('public')->put('vip-gallery/events/'.$visibleEvent->id.'/processed/visible-msg-1.jpg', 'photo');

    createVipGalleryEvent([
        'gallery_slug' => 'galeria-sem-foto',
        'whatsapp_group_id' => '120363425148164142-group',
    ]);

    $this->getJson('/api/v1/gallery')
        ->assertOk()
        ->assertJsonPath('meta.total_active', 1)
        ->assertJsonPath('meta.auto_open_slug', 'galeria-visivel')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'galeria-visivel')
        ->assertJsonPath('data.0.is_active', true)
        ->assertJsonPath('data.0.total_photos', 1)
        ->assertJsonPath('data.0.cover_image_url', 'https://adm.tvvip.social/storage/vip-gallery/events/'.$visibleEvent->id.'/processed/visible-msg-1.jpg')
        ->assertJsonMissing(['slug' => 'galeria-sem-foto']);

    $this->getJson('/api/v1/gallery/galeria-sem-foto')
        ->assertOk()
        ->assertJsonPath('data.status', ExternalEvent::VIP_GALLERY_STATUS_PAUSED)
        ->assertJsonPath('data.configured_status', ExternalEvent::VIP_GALLERY_STATUS_ACTIVE)
        ->assertJsonPath('data.is_active', false)
        ->assertJsonPath('data.has_visible_photos', false);
});

test('gallery tracking increments counters once per requester window', function () {
    $event = createVipGalleryEvent([
        'views_count' => 0,
    ]);

    $photo = VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-download',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-download.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
        'downloads_count' => 0,
        'published_at' => now()->subMinute(),
        'received_at' => now()->subMinutes(2),
    ]);

    Storage::disk('public')->put('vip-gallery/events/'.$event->id.'/originals/msg-download.jpg', 'photo');

    $viewHeaders = ['User-Agent' => 'VipGalleryFeatureTest'];

    $this->withHeaders($viewHeaders)
        ->postJson('/api/v1/gallery/track/view', ['identifier' => 'casamento-vip'])
        ->assertNoContent();

    $this->withHeaders($viewHeaders)
        ->postJson('/api/v1/gallery/track/view', ['identifier' => 'casamento-vip'])
        ->assertNoContent();

    expect($event->fresh()->views_count)->toBe(1);

    $this->withHeaders($viewHeaders)
        ->postJson("/api/v1/gallery/photos/{$photo->id}/download")
        ->assertNoContent();

    $this->withHeaders($viewHeaders)
        ->postJson("/api/v1/gallery/photos/{$photo->id}/download")
        ->assertNoContent();

    expect($photo->fresh()->downloads_count)->toBe(1);
});

test('delete command reply by referenceMessageId soft deletes photo and removes files', function () {
    $event = createVipGalleryEvent();

    $photo = VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-delete-target',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-delete-target.jpg',
        'processed_image_path' => 'vip-gallery/events/'.$event->id.'/processed/msg-delete-target.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
        'published_at' => now()->subMinute(),
        'received_at' => now()->subMinutes(2),
    ]);

    Storage::disk('public')->put($photo->original_image_path, 'original');
    Storage::disk('public')->put($photo->processed_image_path, 'processed');

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => 'cmd-delete-1',
        'phone' => '5591999999999',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'queued_delete',
        'payload_json' => [
            'messageId' => 'cmd-delete-1',
            'groupId' => $event->whatsapp_group_id,
            'body' => 'Apagar',
            'referenceMessageId' => 'msg-delete-target',
        ],
    ]);

    $job = new DeleteVipGalleryPhotoJob($log->id, $event->id, 'msg-delete-target');
    $job->handle(app(\App\Modules\VipGallery\Support\VipGalleryMediaManager::class));

    expect(VipGalleryPhoto::query()->find($photo->id))->toBeNull();
    expect(VipGalleryPhoto::withTrashed()->find($photo->id)?->processing_status)->toBe(VipGalleryPhoto::STATUS_DELETED);
    expect(Storage::disk('public')->exists($photo->original_image_path))->toBeFalse();
    expect(Storage::disk('public')->exists($photo->processed_image_path))->toBeFalse();
    expect($log->fresh()->routing_status)->toBe('deleted');
});

test('delete command without permission is ignored and does not delete photo', function () {
    Queue::fake();

    $event = createVipGalleryEvent([
        'allow_delete_command' => false,
    ]);

    $photo = VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-protected',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-protected.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
        'published_at' => now()->subMinute(),
        'received_at' => now()->subMinutes(2),
    ]);

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => 'cmd-delete-2',
        'phone' => '5591999999999',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => 'cmd-delete-2',
            'groupId' => $event->whatsapp_group_id,
            'body' => 'Apagar',
            'referenceMessageId' => 'msg-protected',
        ],
    ]);

    $job = new ProcessVipGalleryWebhookJob($log->id);
    $job->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    Queue::assertNothingPushed();
    expect($log->fresh()->routing_status)->toBe('ignored_delete_not_allowed');
    expect(VipGalleryPhoto::query()->find($photo->id))->not->toBeNull();
});

test('delete command accepts deletar alias when referenceMessageId is present', function () {
    Queue::fake();

    $event = createVipGalleryEvent([
        'whatsapp_group_id' => '120363425148164142-group',
        'gallery_slug' => 'galeria-2',
        'delete_command_keyword' => 'Apagar',
    ]);

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => '2AC721E2FB2C40A3090D',
        'phone' => '120363425148164142-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => '2AC721E2FB2C40A3090D',
            'phone' => '120363425148164142-group',
            'participantPhone' => '554896553954',
            'senderName' => 'Anderson Marques',
            'referenceMessageId' => '2A7C8521A40F6ECA9022',
            'text' => [
                'message' => 'Deletar',
            ],
        ],
    ]);

    (new ProcessVipGalleryWebhookJob($log->id))->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    Queue::assertPushed(DeleteVipGalleryPhotoJob::class, 1);
    expect($log->fresh()->routing_status)->toBe('queued_delete');
});

test('delete command accepts comma separated keywords case insensitively', function () {
    Queue::fake();

    createVipGalleryEvent([
        'whatsapp_group_id' => '120363408092361361-group',
        'gallery_slug' => 'galeria-3',
        'delete_command_keyword' => 'Deletar,Apagar,Excluir',
    ]);

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => '2AD96B84D25767193C35',
        'phone' => '120363408092361361-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => '2AD96B84D25767193C35',
            'phone' => '120363408092361361-group',
            'participantPhone' => '554896553954',
            'senderName' => 'Anderson Marques',
            'referenceMessageId' => '2A7C8521A40F6ECA9022',
            'text' => [
                'message' => 'eXcLuIr',
            ],
        ],
    ]);

    (new ProcessVipGalleryWebhookJob($log->id))->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    Queue::assertPushed(DeleteVipGalleryPhotoJob::class, 1);
    expect($log->fresh()->routing_status)->toBe('queued_delete');
});

test('pause command accepts comma separated keywords and pauses active gallery', function () {
    Queue::fake();

    $event = createVipGalleryEvent([
        'whatsapp_group_id' => '120363408092361361-group',
        'gallery_slug' => 'galeria-3',
        'allow_pause_command' => true,
        'pause_command_keyword' => 'Parar,Pausar',
    ]);

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => 'pause-msg-1',
        'phone' => '120363408092361361-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => 'pause-msg-1',
            'phone' => '120363408092361361-group',
            'participantPhone' => '554896553954',
            'senderName' => 'Anderson Marques',
            'text' => [
                'message' => 'pAuSaR',
            ],
        ],
    ]);

    (new ProcessVipGalleryWebhookJob($log->id))->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    Queue::assertPushed(PauseVipGalleryEventJob::class, 1);
    expect($log->fresh()->routing_status)->toBe('queued_pause');

    Queue::fake();
    (new PauseVipGalleryEventJob($log->id, $event->id))->handle();

    expect($event->fresh()->vip_gallery_status)->toBe(ExternalEvent::VIP_GALLERY_STATUS_PAUSED);
    expect($log->fresh()->routing_status)->toBe('paused');
});

test('delete command without referenceMessageId is rejected even with apagar text', function () {
    Queue::fake();

    $event = createVipGalleryEvent([
        'whatsapp_group_id' => '120363408092361361-group',
        'gallery_slug' => 'galeria-3',
    ]);

    $log = VipGalleryWebhookLog::query()->create([
        'message_id' => '2AD96B84D25767193C35',
        'phone' => '120363408092361361-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_TEXT_COMMAND,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => '2AD96B84D25767193C35',
            'phone' => '120363408092361361-group',
            'participantPhone' => '554896553954',
            'senderName' => 'Anderson Marques',
            'text' => [
                'message' => 'Apagar',
            ],
        ],
    ]);

    (new ProcessVipGalleryWebhookJob($log->id))->handle(app(\App\Modules\VipGallery\Support\VipGalleryEventResolver::class));

    Queue::assertNothingPushed();
    expect($log->fresh()->routing_status)->toBe('invalid_delete_command');
    expect($event->fresh()->whatsapp_group_id)->toBe('120363408092361361-group');
});

test('admin can queue reprocess for failed photo', function () {
    Queue::fake();

    $event = createVipGalleryEvent();

    $photo = VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'msg-failed',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/msg-failed.jpg',
        'width' => 1280,
        'height' => 720,
        'processing_status' => VipGalleryPhoto::STATUS_FAILED,
        'processing_attempts' => 0,
        'received_at' => now()->subMinutes(2),
    ]);

    Storage::disk('public')->put($photo->original_image_path, 'original');

    $this->actingAs(User::factory()->make(['role' => 'admin']), 'sanctum')
        ->postJson("/api/v1/vip-gallery/photos/{$photo->id}/reprocess")
        ->assertStatus(202)
        ->assertJsonPath('data.queued', true)
        ->assertJsonPath('data.photo_id', $photo->id);

    Queue::assertPushed(ProcessVipGalleryPhotoJob::class, 1);
    expect($photo->fresh()->processing_attempts)->toBe(1);
});

test('authenticated vip coverage endpoints expose vip event list and totals', function () {
    $event = createVipGalleryEvent([
        'views_count' => 11,
        'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_ACTIVE,
    ]);

    VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'vip-stat-1',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'original_image_path' => 'vip-gallery/events/'.$event->id.'/originals/vip-stat-1.jpg',
        'processing_status' => VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
        'downloads_count' => 3,
        'received_at' => now()->subMinutes(4),
        'published_at' => now()->subMinutes(3),
    ]);

    VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'vip-stat-2',
        'participant_phone' => '5591888888888',
        'sender_name' => 'Bruna',
        'processed_image_path' => 'vip-gallery/events/'.$event->id.'/processed/vip-stat-2.jpg',
        'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
        'downloads_count' => 2,
        'received_at' => now()->subMinutes(2),
        'published_at' => now()->subMinute(),
    ]);

    ExternalEvent::query()->create([
        'titulo' => 'Evento sem VIP',
        'category_id' => $event->category_id,
        'status_id' => $event->status_id,
        'data_hora' => now()->addDays(2),
        'local' => 'Ananindeua',
        'is_vip_gallery' => false,
        'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_DRAFT,
        'logo_size_percent' => 15,
        'allow_delete_command' => false,
        'delete_command_keyword' => 'Apagar',
    ]);

    $user = User::factory()->make(['role' => 'admin']);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/externas/cobertura-vip/stats')
        ->assertOk()
        ->assertJsonPath('data.total_galleries', 1)
        ->assertJsonPath('data.active_galleries', 1)
        ->assertJsonPath('data.total_views', 11)
        ->assertJsonPath('data.total_downloads', 5);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/externas/cobertura-vip?search=casamento-vip')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $event->id)
        ->assertJsonPath('data.0.gallery_slug', 'casamento-vip')
        ->assertJsonPath('data.0.vip_gallery_photos_count', 2)
        ->assertJsonPath('data.0.vip_gallery_downloads_count', 5)
        ->assertJsonPath('data.0.vip_gallery_public_url', 'https://www.coberturavip.com.br/casamento-vip')
        ->assertJsonPath('data.0.vip_gallery_is_active', true);
});

test('vip gallery admin options and logs expose operational context', function () {
    if (! Schema::hasTable('jobs')) {
        Schema::create('jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at')->default(0);
            $table->unsignedInteger('created_at')->default(0);
        });
    }

    if (! Schema::hasTable('failed_jobs')) {
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->nullable();
            $table->longText('payload')->nullable();
        });
    }

    $event = createVipGalleryEvent([
        'whatsapp_group_id' => '120363423950458112-group',
        'gallery_slug' => 'galeria-1',
    ]);

    VipGalleryWebhookLog::query()->create([
        'message_id' => 'pending-msg-1',
        'phone' => '120363423950458112-group',
        'detected_type' => VipGalleryWebhookLog::TYPE_IMAGE,
        'routing_status' => 'received',
        'payload_json' => [
            'messageId' => 'pending-msg-1',
            'phone' => '120363423950458112-group',
        ],
    ]);

    DB::table('jobs')->insert([
        'queue' => 'vip-gallery-webhook',
        'payload' => '{}',
        'attempts' => 0,
        'reserved_at' => null,
        'available_at' => 0,
        'created_at' => 0,
    ]);

    $user = User::factory()->make(['role' => 'admin']);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/vip-gallery/options')
        ->assertOk()
        ->assertJsonPath('data.groups.0.value', '120363423950458112-group')
        ->assertJsonPath('data.groups.0.label', 'Galeria 1')
        ->assertJsonPath('data.default_delete_keywords', 'Deletar,Apagar,Excluir')
        ->assertJsonPath('data.default_pause_keywords', 'Parar,Pausar')
        ->assertJsonPath('data.no_logo_sentinel', '__none__');

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/vip-gallery/logs')
        ->assertOk()
        ->assertJsonPath('data.summary.pending_webhook_jobs', 1)
        ->assertJsonPath('data.logs.0.event_id', $event->id)
        ->assertJsonPath('data.logs.0.group_label', 'Galeria 1')
        ->assertJsonPath('data.root_cause', 'A fila vip-gallery-webhook possui itens pendentes sem consumo. Enquanto isso ocorrer, os webhooks ficam em received e as fotos nao entram na galeria.');
});

test('admin can upload vip banners and generate zip download for event photos', function () {
    $event = createVipGalleryEvent([
        'gallery_slug' => 'galeria-banners',
        'whatsapp_group_id' => '120363423950458112-group',
    ]);

    $photo = VipGalleryPhoto::query()->create([
        'external_event_id' => $event->id,
        'zapi_message_id' => 'zip-msg-1',
        'participant_phone' => '5591999999999',
        'sender_name' => 'Anderson',
        'processed_image_path' => 'vip-gallery/events/'.$event->id.'/processed/zip-msg-1.jpg',
        'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
        'received_at' => now()->subMinute(),
        'published_at' => now()->subSeconds(30),
    ]);

    Storage::disk('public')->put((string) $photo->processed_image_path, fakeJpegBinary());

    $user = User::factory()->make(['role' => 'admin']);

    $uploadResponse = $this->actingAs($user, 'sanctum')
        ->post('/api/v1/vip-gallery/banners/upload', [
            'event_id' => $event->id,
            'banners' => [
                UploadedFile::fake()->image('banner-1.jpg', 1200, 320),
                UploadedFile::fake()->image('banner-2.png', 1200, 320),
            ],
        ]);

    $uploadResponse
        ->assertStatus(201)
        ->assertJsonCount(2, 'data.banners');

    expect(VipGalleryBanner::query()->where('external_event_id', $event->id)->count())->toBe(2);

    $zipResponse = $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/vip-gallery/events/{$event->id}/download-all");

    $zipResponse
        ->assertOk()
        ->assertJsonPath('data.total_files', 1);

    $fileName = (string) $zipResponse->json('data.file_name');
    expect(Storage::disk('public')->exists("vip-gallery/exports/events/{$event->id}/{$fileName}"))->toBeTrue();
});
