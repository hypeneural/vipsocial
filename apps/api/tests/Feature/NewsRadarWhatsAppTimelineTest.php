<?php

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function createNewsRadarWhatsAppGroup(array $overrides = []): WhatsAppGroup
{
    return WhatsAppGroup::query()->create(array_merge([
        'group_id' => '120363027326371817-group',
        'provider' => 'zapi',
        'provider_group_id' => '120363027326371817-group',
        'name' => 'PRF SC Imprensa',
        'is_active' => true,
        'news_ingest_enabled' => true,
        'allow_media_download' => true,
        'allow_ai_export' => true,
    ], $overrides));
}

function createInboundEvent(WhatsAppGroup $group, array $overrides = []): WhatsAppInboundEvent
{
    $defaults = [
        'provider' => 'zapi',
        'instance_id' => 'INSTANCE-1',
        'message_id' => 'msg-' . str()->random(8),
        'provider_message_id' => 'msg-' . str()->random(8),
        'normalized_version' => 1,
        'payload_hash' => hash('sha256', str()->random(16)),
        'whatsapp_group_fk' => $group->id,
        'group_id_raw' => $group->provider_group_id,
        'chat_name' => $group->name,
        'is_group' => true,
        'is_newsletter' => false,
        'from_me' => false,
        'is_edit' => false,
        'status' => 'RECEIVED',
        'message_kind' => 'text',
        'participant_phone' => '5548999999999',
        'sender_name' => 'Assessoria',
        'processing_status' => WhatsAppInboundEvent::STATUS_READY,
        'download_status' => WhatsAppInboundEvent::DOWNLOAD_SKIPPED,
        'has_media' => false,
        'has_caption' => false,
        'has_external_link' => false,
        'contains_release_pattern' => false,
        'text_message' => 'Texto de teste',
        'sent_at' => now(),
        'received_at' => now(),
        'group_resolved_at' => now(),
        'ready_at' => now(),
    ];

    return WhatsAppInboundEvent::query()->create(array_merge($defaults, $overrides));
}

beforeEach(function () {
    $this->user = User::factory()->create([
        'active' => true,
    ]);
});

test('news radar whatsapp timeline endpoints require authentication', function () {
    $this->getJson('/api/v1/news-radar/whatsapp/groups')
        ->assertStatus(401);
});

test('user can upsert whatsapp group preferences and list group timeline sources', function () {
    Sanctum::actingAs($this->user);

    $group = createNewsRadarWhatsAppGroup();
    createInboundEvent($group, [
        'message_id' => 'msg-1',
        'text_message' => 'Primeira mensagem',
        'sent_at' => now()->subMinutes(5),
    ]);
    createInboundEvent($group, [
        'message_id' => 'msg-2',
        'text_message' => 'Segunda mensagem',
        'sent_at' => now()->subMinute(),
    ]);

    putJson('/api/v1/news-radar/whatsapp/groups/preferences', [
        'items' => [
            [
                'whatsapp_group_fk' => $group->id,
                'is_active' => true,
                'sort_order' => 1,
                'label_override' => 'PRF',
            ],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.0.whatsapp_group_fk', $group->id)
        ->assertJsonPath('data.0.label_override', 'PRF');

    $this->getJson('/api/v1/news-radar/whatsapp/groups')
        ->assertOk()
        ->assertJsonPath('data.0.whatsapp_group_fk', $group->id)
        ->assertJsonPath('data.0.stats.unread_count', 2)
        ->assertJsonPath('data.0.stats.latest_event_preview', 'Segunda mensagem');
});

test('group summary and mark as read update user preference checkpoint', function () {
    Sanctum::actingAs($this->user);

    $group = createNewsRadarWhatsAppGroup();
    $preference = UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $older = createInboundEvent($group, [
        'message_id' => 'msg-old',
        'text_message' => 'Mais antiga',
        'sent_at' => now()->subMinutes(10),
    ]);
    $latest = createInboundEvent($group, [
        'message_id' => 'msg-latest',
        'text_message' => 'Mais recente',
        'sent_at' => now()->subMinute(),
    ]);

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/summary")
        ->assertOk()
        ->assertJsonPath('data.stats.total_events', 2)
        ->assertJsonPath('data.stats.unread_count', 2);

    postJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/mark-as-read", [
        'last_seen_event_id' => $latest->id,
    ])
        ->assertOk()
        ->assertJsonPath('data.last_seen_event_id', $latest->id);

    expect($preference->fresh()->last_seen_event_id)->toBe($latest->id);
    expect($preference->fresh()->last_seen_event_at?->toIso8601String())
        ->toBe($latest->sent_at?->toIso8601String());

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/summary")
        ->assertOk()
        ->assertJsonPath('data.stats.unread_count', 0);
});

test('group timeline returns events and excludes ignored messages for the current user by default', function () {
    Sanctum::actingAs($this->user);

    $group = createNewsRadarWhatsAppGroup();
    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $visible = createInboundEvent($group, [
        'message_id' => 'msg-visible',
        'text_message' => 'Mensagem visivel',
        'sent_at' => now()->subMinutes(2),
    ]);
    $ignored = createInboundEvent($group, [
        'message_id' => 'msg-ignored',
        'text_message' => 'Mensagem ignorada',
        'sent_at' => now()->subMinute(),
    ]);

    postJson("/api/v1/news-radar/whatsapp/events/{$ignored->id}/ignore")
        ->assertOk()
        ->assertJsonPath('data.is_ignored', true);

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/timeline")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visible->id)
        ->assertJsonPath('data.0.editorial_state', 'new');

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/timeline?include_ignored=1")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('group timeline accepts include_ignored as query string false', function () {
    Sanctum::actingAs($this->user);

    $group = createNewsRadarWhatsAppGroup();
    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    createInboundEvent($group, [
        'message_id' => 'msg-query-false',
        'text_message' => 'Mensagem valida com filtro false',
    ]);

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/timeline?include_ignored=false&per_page=30")
        ->assertOk()
        ->assertJsonPath('meta.per_page', 30)
        ->assertJsonCount(1, 'data');
});

test('group timeline and summary include media pending events with caption while attachment is still processing', function () {
    Sanctum::actingAs($this->user);

    $group = createNewsRadarWhatsAppGroup();
    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    createInboundEvent($group, [
        'message_id' => 'msg-text-visible',
        'message_kind' => 'text',
        'text_message' => 'Mensagem textual pronta',
        'processing_status' => WhatsAppInboundEvent::STATUS_READY,
        'download_status' => WhatsAppInboundEvent::DOWNLOAD_SKIPPED,
        'has_media' => false,
        'sent_at' => now()->subMinutes(2),
        'ready_at' => now()->subMinutes(2),
    ]);

    $imageEvent = createInboundEvent($group, [
        'message_id' => 'msg-image-pending',
        'message_kind' => 'image',
        'text_message' => 'Policia acionada para um afogamento',
        'processing_status' => WhatsAppInboundEvent::STATUS_MEDIA_PENDING,
        'download_status' => WhatsAppInboundEvent::DOWNLOAD_PENDING,
        'has_media' => true,
        'has_caption' => true,
        'sent_at' => now()->subMinute(),
        'ready_at' => null,
    ]);

    $imageEvent->media()->create([
        'kind' => 'image',
        'source_url' => 'https://example.com/afogamento.jpg',
        'thumbnail_source_url' => 'https://example.com/afogamento-thumb.jpg',
        'mime_type' => 'image/jpeg',
        'download_status' => WhatsAppInboundEvent::DOWNLOAD_PENDING,
        'width' => 720,
        'height' => 1280,
    ]);

    $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/summary")
        ->assertOk()
        ->assertJsonPath('data.stats.total_events', 2)
        ->assertJsonPath('data.stats.latest_event_at', $imageEvent->sent_at?->toIso8601String());

    $response = $this->getJson("/api/v1/news-radar/whatsapp/groups/{$group->id}/timeline")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $events = collect($response->json('data'));
    $imagePayload = $events->firstWhere('id', $imageEvent->id);

    expect($imagePayload)->not->toBeNull();
    expect($imagePayload['message_kind'])->toBe('image');
    expect($imagePayload['text_message'])->toBe('Policia acionada para um afogamento');
    expect($imagePayload['download_status'])->toBe(WhatsAppInboundEvent::DOWNLOAD_PENDING);
    expect($imagePayload['media'][0]['kind'])->toBe('image');
    expect($imagePayload['media'][0]['thumbnail_source_url'])->toBe('https://example.com/afogamento-thumb.jpg');
});

test('event actions are stored per user and do not alter visibility for another user', function () {
    $otherUser = User::factory()->create(['active' => true]);

    $group = createNewsRadarWhatsAppGroup();
    $event = createInboundEvent($group, [
        'message_id' => 'msg-shared',
        'text_message' => 'Mensagem compartilhada',
    ]);

    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);
    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $otherUser->id,
        'whatsapp_group_fk' => $group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Sanctum::actingAs($this->user);

    postJson("/api/v1/news-radar/whatsapp/events/{$event->id}/star")
        ->assertOk()
        ->assertJsonPath('data.is_starred', true);

    postJson("/api/v1/news-radar/whatsapp/events/{$event->id}/mark-reviewed")
        ->assertOk()
        ->assertJsonPath('data.event_id', $event->id);

    postJson("/api/v1/news-radar/whatsapp/events/{$event->id}/ignore")
        ->assertOk()
        ->assertJsonPath('data.is_ignored', true);

    $this->getJson("/api/v1/news-radar/whatsapp/events/{$event->id}")
        ->assertOk()
        ->assertJsonPath('data.user_state.is_ignored', true)
        ->assertJsonPath('data.user_state.is_starred', true)
        ->assertJsonPath('data.editorial_state', 'ignored');

    Sanctum::actingAs($otherUser);

    $this->getJson("/api/v1/news-radar/whatsapp/events/{$event->id}")
        ->assertOk()
        ->assertJsonPath('data.user_state.is_ignored', false)
        ->assertJsonPath('data.user_state.is_starred', false)
        ->assertJsonPath('data.editorial_state', 'new');
});
