<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\MediaType;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Enums\Urgency;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsItemMedia;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadarWhatsApp\Models\NewsItemWhatsAppOrigin;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppBundlePromotionSnapshot;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class PromoteWhatsAppBundleToNewsItemAction
{
    public function __construct(
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
        private readonly EnsureWhatsAppNewsSourceAction $ensureNewsSource,
    ) {
    }

    public function execute(User $user, WhatsAppNewsBundle $bundle, int $lockVersion): array
    {
        $bundle->loadMissing(['group', 'items.event.media']);

        if ($bundle->promoted_news_item_id) {
            $newsItem = NewsItem::query()->with(['source', 'aiMetadata', 'media'])->findOrFail($bundle->promoted_news_item_id);

            return [
                'bundle' => $bundle->fresh(['group', 'items.event.media']),
                'news_item' => $newsItem,
                'created' => false,
            ];
        }

        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        if (! in_array($bundle->status, [
            WhatsAppNewsBundle::STATUS_OPEN,
            WhatsAppNewsBundle::STATUS_REVIEWING,
            WhatsAppNewsBundle::STATUS_READY,
        ], true)) {
            throw new RuntimeException('O agrupamento editorial nao pode ser promovido a partir do estado atual.');
        }

        return DB::transaction(function () use ($user, $bundle): array {
            /** @var NewsSource $source */
            $source = $this->ensureNewsSource->execute($bundle->group);
            $fallbacks = $this->resolveFallbacks($bundle);
            $publishedAt = $bundle->last_message_at ?: $bundle->first_message_at ?: now();

            $url = sprintf('internal://whatsapp-bundle/%d/news-item', $bundle->id);

            $newsItem = NewsItem::query()->create([
                'news_source_id' => $source->id,
                'url' => $url,
                'url_hash' => hash('sha256', $url),
                'raw_url' => $url,
                'guid' => sprintf('whatsapp-bundle:%d', $bundle->id),
                'title' => $fallbacks['title'],
                'subtitle' => $bundle->subheadline_draft,
                'author_raw' => $bundle->primary_sender_name,
                'author_normalized' => $bundle->primary_sender_name,
                'body_html' => nl2br(e($fallbacks['body_text'])),
                'body_text' => $fallbacks['body_text'],
                'excerpt' => $fallbacks['excerpt'],
                'hero_image_url' => $fallbacks['hero_image_url'],
                'categories_raw' => $fallbacks['categories_raw'],
                'published_at_raw' => $publishedAt->toIso8601String(),
                'published_at_parsed' => $publishedAt,
                'published_at_utc' => $publishedAt->clone()->utc(),
                'published_at_timezone' => config('app.timezone', 'America/Sao_Paulo'),
                'published_at_source' => PublishedAtSource::Manual,
                'extraction_completeness' => 100,
                'content_source' => ContentSource::HtmlOnly,
                'extraction_status' => ExtractionStatus::Extracted,
                'enrichment_status' => EnrichmentStatus::None,
            ]);

            if ($fallbacks['hero_image_url']) {
                NewsItemMedia::query()->create([
                    'news_item_id' => $newsItem->id,
                    'type' => MediaType::Hero,
                    'url' => $fallbacks['hero_image_url'],
                    'position' => 0,
                ]);
            }

            NewsItemAiMetadata::query()->updateOrCreate(
                ['news_item_id' => $newsItem->id],
                [
                    'city' => $bundle->city,
                    'urgency' => $this->normalizeUrgency($bundle->urgency),
                    'summary_bullets' => $bundle->summary ? [$bundle->summary] : null,
                    'enrichment_level' => 'none',
                ]
            );

            foreach ($bundle->items as $item) {
                NewsItemWhatsAppOrigin::query()->create([
                    'news_item_id' => $newsItem->id,
                    'bundle_id' => $bundle->id,
                    'inbound_event_id' => $item->inbound_event_id,
                ]);
            }

            WhatsAppBundlePromotionSnapshot::query()->create([
                'bundle_id' => $bundle->id,
                'news_item_id' => $newsItem->id,
                'bundle_lock_version' => $bundle->lock_version,
                'snapshot_json' => $this->buildPromotionSnapshot($bundle, $newsItem, $user, $fallbacks),
                'created_by' => $user->getKey(),
            ]);

            $bundle->forceFill([
                'status' => WhatsAppNewsBundle::STATUS_PROMOTED,
                'promoted_at' => now(),
                'promoted_news_item_id' => $newsItem->id,
                'updated_by' => $user->getKey(),
                'lock_version' => $bundle->lock_version + 1,
            ])->save();

            return [
                'bundle' => $bundle->fresh(['group', 'items.event.media']),
                'news_item' => $newsItem->fresh(['source', 'aiMetadata', 'media']),
                'created' => true,
            ];
        });
    }

    private function resolveFallbacks(WhatsAppNewsBundle $bundle): array
    {
        $orderedItems = $bundle->items->sortBy('sort_order')->values();
        $events = $orderedItems->pluck('event')->filter();
        $textEvents = $events->filter(fn ($event) => filled($event->text_message))->values();

        $titleSource = $bundle->title
            ?: $bundle->headline_draft
            ?: $textEvents->first()?->text_message
            ?: sprintf('Grupo %s - %s', $bundle->group?->name ?: 'WhatsApp', ($bundle->last_message_at ?: now())->format('d/m/Y H:i'));

        $excerptSource = $bundle->summary
            ?: $bundle->lead_draft
            ?: trim($textEvents->take(3)->pluck('text_message')->implode(' '));

        $bodyLines = [];
        if ($bundle->title) {
            $bodyLines[] = $bundle->title;
            $bodyLines[] = '';
        }
        if ($bundle->summary) {
            $bodyLines[] = $bundle->summary;
            $bodyLines[] = '';
        }

        foreach ($orderedItems as $item) {
            $event = $item->event;

            if (! $event) {
                continue;
            }

            $line = sprintf(
                '[%s] %s',
                $event->sent_at?->format('d/m/Y H:i') ?? 'sem data',
                $event->sender_name ?: 'Remetente nao identificado'
            );
            $bodyLines[] = $line;

            if ($event->text_message) {
                $bodyLines[] = $event->text_message;
            }

            if ($event->link_url) {
                $bodyLines[] = 'Link: ' . $event->link_url;
            }

            $bodyLines[] = '';
        }

        $categories = is_array($bundle->categories_json) ? array_values(array_filter($bundle->categories_json)) : [];
        if ($categories === [] && $bundle->category) {
            $categories = [$bundle->category];
        }

        $coverUrl = $this->resolveCoverUrl($bundle);

        return [
            'title' => Str::limit(trim((string) $titleSource), 255, ''),
            'excerpt' => trim((string) $excerptSource) ?: null,
            'body_text' => trim(implode("\n", $bodyLines)),
            'categories_raw' => $categories,
            'hero_image_url' => $coverUrl,
            'fallbacks_used' => [
                'title' => $bundle->title ? 'bundle.title'
                    : ($bundle->headline_draft ? 'bundle.headline_draft'
                    : ($textEvents->first()?->text_message ? 'first_text_event' : 'generic_group_date')),
                'excerpt' => $bundle->summary ? 'bundle.summary'
                    : ($bundle->lead_draft ? 'bundle.lead_draft' : 'first_text_events_concat'),
                'cover' => $bundle->cover_media_id ? 'bundle.cover_media_id'
                    : ($coverUrl ? 'first_valid_bundle_image' : 'none'),
            ],
        ];
    }

    private function resolveCoverUrl(WhatsAppNewsBundle $bundle): ?string
    {
        $media = null;

        if ($bundle->cover_media_id) {
            $media = $bundle->items
                ->flatMap(fn (WhatsAppNewsBundleItem $item) => $item->event?->media ?? [])
                ->firstWhere('id', $bundle->cover_media_id);
        }

        if (! $media) {
            $media = $bundle->items
                ->flatMap(fn (WhatsAppNewsBundleItem $item) => $item->event?->media ?? [])
                ->first(fn ($item) => $item->kind === 'image');
        }

        if (! $media) {
            return null;
        }

        if ($media->storage_disk && $media->storage_path && $media->storage_visibility === 'public') {
            try {
                return Storage::disk($media->storage_disk)->url($media->storage_path);
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    private function normalizeUrgency(?string $urgency): ?Urgency
    {
        if (! $urgency) {
            return null;
        }

        return Urgency::tryFrom(mb_strtolower(trim($urgency)));
    }

    private function buildPromotionSnapshot(WhatsAppNewsBundle $bundle, NewsItem $newsItem, User $user, array $fallbacks): array
    {
        return [
            'bundle' => [
                'id' => $bundle->id,
                'title' => $bundle->title,
                'summary' => $bundle->summary,
                'city' => $bundle->city,
                'urgency' => $bundle->urgency,
                'category' => $bundle->category,
                'categories_json' => $bundle->categories_json,
                'status' => $bundle->status,
            ],
            'news_item' => [
                'id' => $newsItem->id,
                'title' => $newsItem->title,
                'excerpt' => $newsItem->excerpt,
                'hero_image_url' => $newsItem->hero_image_url,
            ],
            'ordered_events' => $bundle->items
                ->sortBy('sort_order')
                ->values()
                ->map(fn (WhatsAppNewsBundleItem $item) => [
                    'sort_order' => $item->sort_order,
                    'event_id' => $item->inbound_event_id,
                    'message_id' => $item->event?->message_id,
                    'message_kind' => $item->event?->message_kind,
                    'sender_name' => $item->event?->sender_name,
                    'sent_at' => $item->event?->sent_at?->toIso8601String(),
                    'text_message' => $item->event?->text_message,
                ])->all(),
            'media' => $bundle->items
                ->flatMap(fn (WhatsAppNewsBundleItem $item) => $item->event?->media ?? [])
                ->map(fn ($media) => [
                    'id' => $media->id,
                    'kind' => $media->kind,
                    'storage_disk' => $media->storage_disk,
                    'storage_path' => $media->storage_path,
                    'mime_type' => $media->mime_type,
                    'width' => $media->width,
                    'height' => $media->height,
                ])->values()->all(),
            'bundle_lock_version' => $bundle->lock_version,
            'promoted_by' => [
                'user_id' => $user->getKey(),
                'name' => $user->name,
            ],
            'fallbacks_used' => $fallbacks['fallbacks_used'],
        ];
    }
}
