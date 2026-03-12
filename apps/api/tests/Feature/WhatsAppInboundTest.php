<?php

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryWebhookJob;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsAppInbound\Jobs\ProcessWhatsAppInboundReceiptJob;
use App\Modules\WhatsAppInbound\Models\WhatsAppWebhookReceipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'whatsapp.inbound.webhook.secret' => 'segredo-inbound',
        'whatsapp.inbound.webhook.secret_header' => 'X-WHATSAPP-INBOUND-SECRET',
        'whatsapp.inbound.queue' => 'whatsapp-inbound',
        'vip_gallery.webhook.secret' => 'segredo-galeria',
        'vip_gallery.webhook.secret_header' => 'X-VIP-GALLERY-SECRET',
    ]);
});

test('generic inbound webhook rejects invalid secret', function () {
    $this->postJson('/api/v1/webhook/zapi/inbound-message', [
        'messageId' => 'msg-1',
    ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');
});

test('generic inbound webhook stores receipt and queues processing job', function () {
    Queue::fake();

    $this->withHeader('X-WHATSAPP-INBOUND-SECRET', 'segredo-inbound')
        ->postJson('/api/v1/webhook/zapi/inbound-message', [
            'instanceId' => 'INSTANCE-1',
            'messageId' => 'msg-1',
            'phone' => '120363027326371817-group',
            'text' => [
                'message' => 'teste',
            ],
        ])
        ->assertStatus(202)
        ->assertJsonPath('data.accepted', true);

    $this->assertDatabaseHas('whatsapp_webhook_receipts', [
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-1',
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
    ]);

    Queue::assertPushed(ProcessWhatsAppInboundReceiptJob::class, function (ProcessWhatsAppInboundReceiptJob $job): bool {
        $receipt = WhatsAppWebhookReceipt::query()->find($job->receiptId);

        return $receipt instanceof WhatsAppWebhookReceipt
            && $receipt->instance_id === 'INSTANCE-1';
    });
});

test('processing job marks structured receipts as normalized', function () {
    $receipt = WhatsAppWebhookReceipt::query()->create([
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-2',
        'headers_json' => ['x-test' => '1'],
        'payload_json' => [
            'instanceId' => 'INSTANCE-2',
            'messageId' => 'msg-2',
        ],
        'payload_hash' => hash('sha256', '{"instanceId":"INSTANCE-2","messageId":"msg-2"}'),
        'received_at' => now(),
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
        'processing_attempts' => 0,
    ]);

    (new ProcessWhatsAppInboundReceiptJob($receipt->id))->handle(app(\App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction::class));

    expect($receipt->fresh()->processing_status)->toBe(WhatsAppWebhookReceipt::STATUS_NORMALIZED);
    expect($receipt->fresh()->processing_attempts)->toBe(1);
});

test('processing job normalizes text group messages into canonical inbound events', function () {
    $group = WhatsAppGroup::query()->create([
        'group_id' => '120363027326371817-group',
        'provider' => 'zapi',
        'provider_group_id' => '120363027326371817-group',
        'name' => 'PRF SC Imprensa',
        'is_active' => true,
        'news_ingest_enabled' => true,
        'allow_media_download' => true,
    ]);

    $receipt = WhatsAppWebhookReceipt::query()->create([
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-TEXT',
        'headers_json' => [],
        'payload_json' => [
            'instanceId' => 'INSTANCE-TEXT',
            'messageId' => 'msg-text-1',
            'phone' => '120363027326371817-group',
            'isGroup' => true,
            'chatName' => 'PRF SC Imprensa',
            'participantPhone' => '5548999999999',
            'senderName' => 'Assessoria PRF',
            'momment' => 1710255000000,
            'text' => [
                'message' => 'Liberacao parcial da pista no km 210.',
            ],
        ],
        'payload_hash' => hash('sha256', '{"messageId":"msg-text-1"}'),
        'received_at' => now(),
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
        'processing_attempts' => 0,
    ]);

    (new ProcessWhatsAppInboundReceiptJob($receipt->id))->handle(app(\App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction::class));

    $event = WhatsAppInboundEvent::query()
        ->where('message_id', 'msg-text-1')
        ->first();

    expect($event)->not->toBeNull();
    expect($event?->whatsapp_group_fk)->toBe($group->id);
    expect($event?->processing_status)->toBe(WhatsAppInboundEvent::STATUS_READY);
    expect($event?->download_status)->toBe(WhatsAppInboundEvent::DOWNLOAD_SKIPPED);
    expect($event?->text_message)->toBe('Liberacao parcial da pista no km 210.');
    expect($receipt->fresh()->normalized_event_id)->toBe($event?->id);
});

test('processing job stores media rows and uses image caption as canonical text', function () {
    WhatsAppGroup::query()->create([
        'group_id' => '120363043533483930-group',
        'provider' => 'zapi',
        'provider_group_id' => '120363043533483930-group',
        'name' => 'IMPRENSA DO 31 BPM',
        'is_active' => true,
        'news_ingest_enabled' => true,
        'allow_media_download' => true,
    ]);

    $receipt = WhatsAppWebhookReceipt::query()->create([
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-IMAGE',
        'headers_json' => [],
        'payload_json' => [
            'instanceId' => 'INSTANCE-IMAGE',
            'messageId' => 'msg-image-1',
            'phone' => '120363043533483930-group',
            'isGroup' => true,
            'chatName' => 'IMPRENSA DO 31 BPM',
            'senderName' => 'PMSC',
            'momment' => 1710255001000,
            'image' => [
                'mimeType' => 'image/jpeg',
                'imageUrl' => 'https://example.com/pmsc.jpg',
                'thumbnailUrl' => 'https://example.com/pmsc-thumb.jpg',
                'caption' => 'Ocorrencia atendida no bairro Centro.',
                'width' => 600,
                'height' => 315,
            ],
        ],
        'payload_hash' => hash('sha256', '{"messageId":"msg-image-1"}'),
        'received_at' => now(),
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
        'processing_attempts' => 0,
    ]);

    (new ProcessWhatsAppInboundReceiptJob($receipt->id))->handle(app(\App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction::class));

    $event = WhatsAppInboundEvent::query()
        ->where('message_id', 'msg-image-1')
        ->firstOrFail();

    expect($event->text_message)->toBe('Ocorrencia atendida no bairro Centro.');
    expect($event->processing_status)->toBe(WhatsAppInboundEvent::STATUS_MEDIA_PENDING);
    expect($event->download_status)->toBe(WhatsAppInboundEvent::DOWNLOAD_PENDING);
    expect($event->has_media)->toBeTrue();

    $this->assertDatabaseHas('whatsapp_inbound_event_media', [
        'inbound_event_id' => $event->id,
        'kind' => 'image',
        'source_url' => 'https://example.com/pmsc.jpg',
        'mime_type' => 'image/jpeg',
        'download_status' => WhatsAppInboundEvent::DOWNLOAD_PENDING,
    ]);
});

test('processing edited messages updates canonical event and stores revision history', function () {
    WhatsAppGroup::query()->create([
        'group_id' => '120363387783726644-group',
        'provider' => 'zapi',
        'provider_group_id' => '120363387783726644-group',
        'name' => 'FME TIJUCAS - IMPRENSA',
        'is_active' => true,
        'news_ingest_enabled' => true,
    ]);

    $originalReceipt = WhatsAppWebhookReceipt::query()->create([
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-EDIT',
        'headers_json' => [],
        'payload_json' => [
            'instanceId' => 'INSTANCE-EDIT',
            'messageId' => 'msg-edit-1',
            'phone' => '120363387783726644-group',
            'isGroup' => true,
            'text' => [
                'message' => 'Texto inicial.',
            ],
        ],
        'payload_hash' => hash('sha256', '{"messageId":"msg-edit-1","v":1}'),
        'received_at' => now(),
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
        'processing_attempts' => 0,
    ]);

    (new ProcessWhatsAppInboundReceiptJob($originalReceipt->id))->handle(app(\App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction::class));

    $editedReceipt = WhatsAppWebhookReceipt::query()->create([
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-EDIT',
        'headers_json' => [],
        'payload_json' => [
            'instanceId' => 'INSTANCE-EDIT',
            'messageId' => 'msg-edit-1',
            'phone' => '120363387783726644-group',
            'isGroup' => true,
            'isEdit' => true,
            'text' => [
                'message' => 'Texto corrigido.',
            ],
        ],
        'payload_hash' => hash('sha256', '{"messageId":"msg-edit-1","v":2}'),
        'received_at' => now()->addSecond(),
        'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
        'processing_attempts' => 0,
    ]);

    (new ProcessWhatsAppInboundReceiptJob($editedReceipt->id))->handle(app(\App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction::class));

    $event = WhatsAppInboundEvent::query()
        ->where('message_id', 'msg-edit-1')
        ->firstOrFail();

    expect($event->text_message)->toBe('Texto corrigido.');
    expect($event->edited_at)->not->toBeNull();

    $this->assertDatabaseHas('whatsapp_inbound_event_revisions', [
        'inbound_event_id' => $event->id,
        'revision_number' => 1,
        'text_message' => 'Texto inicial.',
    ]);
});

test('legacy gallery webhook also stores a generic receipt', function () {
    Queue::fake();

    $response = $this->withHeader('X-VIP-GALLERY-SECRET', 'segredo-galeria')
        ->postJson('/api/v1/webhook/zapi/gallery', [
            'instanceId' => 'INSTANCE-GALLERY',
            'messageId' => 'gallery-msg-1',
            'phone' => '120363027326371817-group',
            'isImage' => true,
            'imageUrl' => 'https://example.com/photo.jpg',
        ]);

    $response
        ->assertStatus(202)
        ->assertJsonPath('data.accepted', true)
        ->assertJsonPath('data.log_id', fn ($value) => is_int($value))
        ->assertJsonPath('data.receipt_id', fn ($value) => is_int($value));

    $this->assertDatabaseHas('vip_gallery_webhook_logs', [
        'message_id' => 'gallery-msg-1',
        'phone' => '120363027326371817-group',
    ]);

    $this->assertDatabaseHas('whatsapp_webhook_receipts', [
        'provider' => WhatsAppWebhookReceipt::PROVIDER_ZAPI,
        'instance_id' => 'INSTANCE-GALLERY',
    ]);

    Queue::assertPushed(ProcessVipGalleryWebhookJob::class, 1);
});
