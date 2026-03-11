<?php

namespace App\Modules\NewsRadar\Jobs;

use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\FetchDetailMode;
use App\Modules\NewsRadar\Enums\RawItemStatus;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemMedia;
use App\Modules\NewsRadar\Models\NewsRawItem;
use App\Modules\NewsRadar\Services\ArticleExtractorService;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FieldResolverService;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\ListingItem;
use App\Modules\NewsRadar\Services\ResolvedFields;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessNewsItemJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly int $newsRawItemId,
    ) {
        $this->queue = 'news-radar';
    }

    public function handle(
        ArticleExtractorService $articleExtractor,
        FieldResolverService $fieldResolver,
        HttpFetchService $httpFetch,
    ): void {
        $rawItem = NewsRawItem::with('source')->findOrFail($this->newsRawItemId);
        $source = $rawItem->source;
        $config = $source->crawling_config ?? [];

        // 1. Mark as processing
        $rawItem->markProcessing();

        try {
            $fetchDetailMode = $source->fetch_detail_mode;

            // 2. Build feed/listing data from raw_payload
            $feedData = $this->buildFeedData($rawItem);
            $listingData = $this->buildListingData($rawItem);
            $articleData = null;
            $contentSource = ContentSource::FeedOnly;

            // 3. Determine if we need to fetch the article HTML
            $shouldFetch = match ($fetchDetailMode) {
                FetchDetailMode::Never => false,
                FetchDetailMode::Always => true,
                FetchDetailMode::WhenIncomplete => $this->isIncomplete($feedData, $listingData),
            };

            // 4. Fetch article HTML if needed
            if ($shouldFetch) {
                $result = $httpFetch->fetch($rawItem->normalized_url);
                if ($result->success) {
                    $articleData = $articleExtractor->extract(
                        $result->body,
                        $config['article_extractors'] ?? [],
                        $config['boilerplate_rules'] ?? [],
                        $config['body_stop_text_patterns'] ?? [],
                    );
                    $contentSource = $feedData ? ContentSource::FeedPlusHtml : ContentSource::HtmlOnly;
                }
            }

            // 5. Resolve all fields using FieldResolverService
            $resolved = $fieldResolver->resolveAll($listingData, $feedData, $articleData, [
                'timezone_default' => $source->timezone_default,
                'date_formats' => $source->date_formats ?? $config['date_formats'] ?? [],
                'date_preprocessors' => $config['date_preprocessors'] ?? [],
                'image_extraction_strategy' => $config['image_extraction_strategy'] ?? 'og_first_then_body',
            ]);

            // 6. Create NewsItem
            $newsItem = $this->createNewsItem($rawItem, $source->id, $resolved, $contentSource);

            // 7. Save hero image as media
            if ($resolved->heroImageUrl) {
                NewsItemMedia::create([
                    'news_item_id' => $newsItem->id,
                    'type' => 'hero',
                    'url' => $resolved->heroImageUrl,
                    'position' => 0,
                ]);
            }

            // 8. Mark raw item as promoted
            $rawItem->markPromoted();

            // 9. Dispatch AI classification (Phase 5)
            // ClassifyNewsItemJob::dispatch($newsItem->id)->onQueue('news-radar-ai');

        } catch (\Throwable $e) {
            $rawItem->markFailed(mb_substr($e->getMessage(), 0, 2000));

            // Re-throw to let Laravel handle retries
            if ($rawItem->fetch_attempts < $this->tries) {
                throw $e;
            }
        }
    }

    private function buildFeedData(NewsRawItem $rawItem): ?FeedItemDto
    {
        $payload = $rawItem->raw_payload;
        if (empty($payload) || !isset($payload['title'])) {
            return null;
        }

        return new FeedItemDto(
            title: $payload['title'] ?? '',
            rawUrl: $rawItem->raw_url,
            normalizedUrl: $rawItem->normalized_url,
            urlHash: $rawItem->url_hash,
            guid: $rawItem->guid,
            authorRaw: $payload['author'] ?? null,
            publishedAtRaw: $payload['pubDate'] ?? null,
            bodyHtml: $payload['content'] ?? null,
            excerpt: $payload['description'] ?? null,
            categoriesRaw: $payload['categories'] ?? [],
            heroImageUrl: null,
            rawPayload: $payload,
        );
    }

    private function buildListingData(NewsRawItem $rawItem): ?ListingItem
    {
        $payload = $rawItem->raw_payload;
        if (empty($payload) || !isset($payload['listing_image'])) {
            return null;
        }

        return new ListingItem(
            rawUrl: $rawItem->raw_url,
            normalizedUrl: $rawItem->normalized_url,
            urlHash: $rawItem->url_hash,
            title: $rawItem->title_raw,
            imageUrl: $payload['listing_image'] ?? null,
            excerpt: $payload['listing_excerpt'] ?? null,
        );
    }

    private function isIncomplete(?FeedItemDto $feedData, ?ListingItem $listingData): bool
    {
        if (!$feedData) return true;

        $hasBody = !empty($feedData->bodyHtml) && mb_strlen($feedData->bodyHtml) > 200;
        $hasImage = !empty($feedData->heroImageUrl) || !empty($listingData?->imageUrl);
        $hasAuthor = !empty($feedData->authorRaw);

        return !$hasBody || !$hasImage || !$hasAuthor;
    }

    private function createNewsItem(NewsRawItem $rawItem, int $sourceId, ResolvedFields $resolved, ContentSource $contentSource): NewsItem
    {
        return NewsItem::create([
            'news_source_id' => $sourceId,
            'news_raw_item_id' => $rawItem->id,
            'url' => $rawItem->normalized_url,
            'url_hash' => $rawItem->url_hash,
            'raw_url' => $rawItem->raw_url,
            'guid' => $rawItem->guid,
            'title' => $resolved->title ?? $rawItem->title_raw ?? 'Sem título',
            'subtitle' => $resolved->subtitle,
            'author_raw' => $resolved->authorRaw,
            'author_normalized' => $this->normalizeAuthor($resolved->authorRaw),
            'body_html' => $resolved->bodyHtml,
            'body_text' => $resolved->bodyText,
            'excerpt' => $resolved->excerpt,
            'hero_image_url' => $resolved->heroImageUrl,
            'categories_raw' => $resolved->categoriesRaw,
            'published_at_raw' => $resolved->publishedAtRaw,
            'published_at_parsed' => $resolved->publishedAtParsed,
            'published_at_utc' => $resolved->publishedAtUtc,
            'published_at_timezone' => $resolved->publishedAtTimezone,
            'published_at_source' => $resolved->publishedAtSource,
            'extraction_completeness' => $resolved->extractionCompleteness,
            'content_source' => $contentSource,
            'extraction_status' => ExtractionStatus::Extracted,
            'enrichment_status' => 'none',
        ]);
    }

    private function normalizeAuthor(?string $raw): ?string
    {
        if (empty($raw)) return null;

        $normalized = trim($raw);
        // Remove common prefixes like "Por ", "By "
        $normalized = preg_replace('/^(Por|By|De|Autor:)\s*/iu', '', $normalized);
        return mb_convert_case($normalized, MB_CASE_TITLE, 'UTF-8');
    }
}
