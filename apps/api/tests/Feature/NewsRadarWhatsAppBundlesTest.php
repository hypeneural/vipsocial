<?php

use App\Models\User;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Laravel\Sanctum\Sanctum;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function createBundleTestGroup(array $overrides = []): WhatsAppGroup
{
    return WhatsAppGroup::query()->create(array_merge([
        'group_id' => '120363387783726644-group',
        'provider' => 'zapi',
        'provider_group_id' => '120363387783726644-group',
        'name' => 'FME TIJUCAS - IMPRENSA',
        'is_active' => true,
        'news_ingest_enabled' => true,
    ], $overrides));
}

function createBundleTestEvent(WhatsAppGroup $group, array $overrides = []): WhatsAppInboundEvent
{
    return WhatsAppInboundEvent::query()->create(array_merge([
        'provider' => 'zapi',
        'instance_id' => 'INSTANCE-BUNDLE',
        'message_id' => 'bundle-msg-' . str()->random(6),
        'provider_message_id' => 'bundle-msg-' . str()->random(6),
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
        'text_message' => 'Texto base',
        'sent_at' => now(),
        'received_at' => now(),
        'group_resolved_at' => now(),
        'ready_at' => now(),
    ], $overrides));
}

beforeEach(function () {
    $this->user = User::factory()->create(['active' => true]);
    $this->group = createBundleTestGroup();

    UserWhatsAppNewsGroup::query()->create([
        'user_id' => $this->user->id,
        'whatsapp_group_fk' => $this->group->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('user can create and inspect a whatsapp news bundle', function () {
    Sanctum::actingAs($this->user);

    $eventA = createBundleTestEvent($this->group, [
        'message_id' => 'bundle-a',
        'text_message' => 'Primeiro evento',
        'sent_at' => now()->subMinutes(5),
    ]);
    $eventB = createBundleTestEvent($this->group, [
        'message_id' => 'bundle-b',
        'text_message' => 'Segundo evento',
        'sent_at' => now()->subMinute(),
    ]);

    $response = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Acidente na BR-101',
        'event_ids' => [$eventA->id, $eventB->id],
    ]);

    $bundleId = $response->json('data.id');

    $response
        ->assertCreated()
        ->assertJsonPath('data.title', 'Acidente na BR-101')
        ->assertJsonPath('data.message_count', 2)
        ->assertJsonPath('data.items.0.event.id', $eventA->id)
        ->assertJsonPath('data.items.1.event.id', $eventB->id);

    $this->getJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}")
        ->assertOk()
        ->assertJsonPath('data.id', $bundleId)
        ->assertJsonPath('data.group.id', $this->group->id);
});

test('bundle creation rejects events from another group', function () {
    Sanctum::actingAs($this->user);

    $otherGroup = createBundleTestGroup([
        'group_id' => '120363387755894479-group',
        'provider_group_id' => '120363387755894479-group',
        'name' => 'Prefeitura de Itapema - Imprensa',
    ]);
    $foreignEvent = createBundleTestEvent($otherGroup);

    $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Bundle invalido',
        'event_ids' => [$foreignEvent->id],
    ])
        ->assertStatus(422)
        ->assertJsonPath('success', false);
});

test('user can update add remove duplicate archive and reopen bundle', function () {
    Sanctum::actingAs($this->user);

    $eventA = createBundleTestEvent($this->group, ['message_id' => 'event-a']);
    $eventB = createBundleTestEvent($this->group, ['message_id' => 'event-b']);
    $eventC = createBundleTestEvent($this->group, ['message_id' => 'event-c']);

    $bundleResponse = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Bundle original',
        'event_ids' => [$eventA->id, $eventB->id],
    ]);

    $bundleId = $bundleResponse->json('data.id');
    $lockVersion = $bundleResponse->json('data.lock_version');

    $updateResponse = $this->putJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}", [
        'lock_version' => $lockVersion,
        'summary' => 'Resumo editorial',
        'city' => 'Tijucas',
    ]);

    $lockVersion = $updateResponse->json('data.lock_version');

    $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/items", [
        'lock_version' => $lockVersion,
        'event_ids' => [$eventC->id],
    ])
        ->assertOk()
        ->assertJsonPath('data.message_count', 3);

    $bundle = $this->getJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}")->json('data');
    $lockVersion = $bundle['lock_version'];

    $this->deleteJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/items/{$eventA->id}", [
        'lock_version' => $lockVersion,
    ])
        ->assertOk()
        ->assertJsonPath('data.message_count', 2);

    $bundle = $this->getJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}")->json('data');
    $lockVersion = $bundle['lock_version'];

    $this->putJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/star", [
        'is_starred' => true,
    ])
        ->assertOk()
        ->assertJsonPath('data.is_starred', true);

    $duplicateResponse = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/duplicate");
    $duplicateResponse
        ->assertCreated()
        ->assertJsonPath('data.title', 'Bundle original (Copia)')
        ->assertJsonPath('data.is_starred', false)
        ->assertJsonPath('data.message_count', 2);

    $archiveResponse = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/archive", [
        'lock_version' => $lockVersion,
    ]);
    $archiveResponse
        ->assertOk()
        ->assertJsonPath('data.status', 'archived');

    $reopenLockVersion = $archiveResponse->json('data.lock_version');

    $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/reopen", [
        'lock_version' => $reopenLockVersion,
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'open');
});

test('bundle update fails with stale lock version', function () {
    Sanctum::actingAs($this->user);

    $event = createBundleTestEvent($this->group);

    $bundleResponse = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Bundle concorrencia',
        'event_ids' => [$event->id],
    ]);

    $bundleId = $bundleResponse->json('data.id');

    $this->putJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}", [
        'lock_version' => 999,
        'summary' => 'Tentativa invalida',
    ])
        ->assertStatus(409)
        ->assertJsonPath('success', false);
});

test('bundle markdown preview and export generate stable snapshot and public access', function () {
    Sanctum::actingAs($this->user);

    $event = createBundleTestEvent($this->group, [
        'message_id' => 'export-msg',
        'text_message' => 'Texto para exportacao',
    ]);
    $event->media()->create([
        'kind' => 'image',
        'source_url' => 'https://example.com/export.jpg',
        'mime_type' => 'image/jpeg',
        'download_status' => 'pending',
    ]);

    $bundleResponse = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Bundle exportado',
        'event_ids' => [$event->id],
    ]);

    $bundleId = $bundleResponse->json('data.id');
    $lockVersion = $bundleResponse->json('data.lock_version');

    $previewResponse = $this->getJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/markdown-preview");
    $previewResponse
        ->assertOk()
        ->assertJsonPath('data.bundle_id', $bundleId)
        ->assertJsonPath('data.lock_version', $lockVersion);

    expect($previewResponse->json('data.markdown_text'))->toContain('Agrupamento editorial do WhatsApp');
    expect($previewResponse->json('data.markdown_text'))->toContain('Bundle exportado');
    expect($previewResponse->json('data.markdown_text'))->toContain('Texto para exportacao');

    $exportResponse = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/markdown-export", [
        'lock_version' => $lockVersion,
        'expires_in_minutes' => 30,
    ]);

    $exportResponse
        ->assertOk()
        ->assertJsonPath('data.bundle_id', $bundleId);

    $signedUrl = $exportResponse->json('data.signed_url');
    expect($signedUrl)->toEndWith('.md');
    $signedPath = parse_url($signedUrl, PHP_URL_PATH);

    $this->get($signedPath)
        ->assertOk()
        ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
        ->assertSee('Texto para exportacao');
});

test('bundle promotion creates news source lazily, news item, origins and promotion snapshot', function () {
    Sanctum::actingAs($this->user);

    $event = createBundleTestEvent($this->group, [
        'message_id' => 'promote-msg',
        'text_message' => 'Corpo principal da noticia promovida.',
        'sender_name' => 'Policia Civil',
    ]);
    $event->media()->create([
        'kind' => 'image',
        'storage_disk' => 'public',
        'storage_path' => 'whatsapp/promote.jpg',
        'storage_visibility' => 'public',
        'mime_type' => 'image/jpeg',
        'download_status' => 'downloaded',
    ]);

    $bundleResponse = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Titulo manual da materia',
        'event_ids' => [$event->id],
    ]);

    $bundleId = $bundleResponse->json('data.id');
    $lockVersion = $bundleResponse->json('data.lock_version');

    $this->putJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}", [
        'lock_version' => $lockVersion,
        'summary' => 'Resumo editorial da materia.',
        'city' => 'Tijucas',
        'urgency' => 'alta',
        'category' => 'Seguranca',
        'categories_json' => ['Seguranca', 'Policia'],
    ])->assertOk();

    $bundle = $this->getJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}")->json('data');
    $lockVersion = $bundle['lock_version'];

    $response = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/promote", [
        'lock_version' => $lockVersion,
    ]);

    $newsItemId = $response->json('data.news_item.id');

    $response
        ->assertOk()
        ->assertJsonPath('data.created', true)
        ->assertJsonPath('data.bundle.status', 'promoted')
        ->assertJsonPath('data.news_item.title', 'Titulo manual da materia');

    $newsItem = NewsItem::query()->with(['source', 'aiMetadata', 'media'])->findOrFail($newsItemId);

    expect($newsItem->public_token)->not->toBeNull();
    expect($newsItem->source)->toBeInstanceOf(NewsSource::class);
    expect($newsItem->source?->source_type?->value)->toBe('whatsapp');
    expect($newsItem->excerpt)->toBe('Resumo editorial da materia.');
    expect($newsItem->categories_raw)->toBe(['Seguranca', 'Policia']);
    expect($newsItem->aiMetadata?->city)->toBe('Tijucas');
    expect($newsItem->aiMetadata?->urgency?->value)->toBe('alta');

    $this->assertDatabaseHas('news_item_whatsapp_origins', [
        'news_item_id' => $newsItem->id,
        'bundle_id' => $bundleId,
        'inbound_event_id' => $event->id,
    ]);

    $this->assertDatabaseHas('whatsapp_bundle_promotion_snapshots', [
        'bundle_id' => $bundleId,
        'news_item_id' => $newsItem->id,
    ]);

    $this->assertDatabaseHas('whatsapp_groups', [
        'id' => $this->group->id,
        'news_source_id' => $newsItem->news_source_id,
    ]);
});

test('bundle promotion is idempotent and does not create a second news item', function () {
    Sanctum::actingAs($this->user);

    $event = createBundleTestEvent($this->group, [
        'message_id' => 'promote-idempotent',
        'text_message' => 'Texto do bundle idempotente',
    ]);

    $bundleResponse = $this->postJson('/api/v1/news-radar/whatsapp/bundles', [
        'group_fk' => $this->group->id,
        'title' => 'Bundle idempotente',
        'event_ids' => [$event->id],
    ]);

    $bundleId = $bundleResponse->json('data.id');
    $lockVersion = $bundleResponse->json('data.lock_version');

    $first = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/promote", [
        'lock_version' => $lockVersion,
    ])->assertOk();

    $second = $this->postJson("/api/v1/news-radar/whatsapp/bundles/{$bundleId}/promote", [
        'lock_version' => 1,
    ])->assertOk();

    expect($first->json('data.news_item.id'))->toBe($second->json('data.news_item.id'));
    expect($second->json('data.created'))->toBeFalse();
    expect(NewsItem::query()->count())->toBe(1);
});
