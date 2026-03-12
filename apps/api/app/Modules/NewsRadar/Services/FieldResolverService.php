<?php

namespace App\Modules\NewsRadar\Services;

class FieldResolverService
{
    public function __construct(
        private readonly DateParserService $dateParser,
    ) {}

    /**
     * Resolve all fields from multiple sources (listing, feed, article HTML).
     * Returns merged data with source audit trail.
     */
    public function resolveAll(
        ?ListingItem $listingData,
        ?FeedItemDto $feedData,
        ?ArticleExtractedData $articleData,
        array $config = []
    ): ResolvedFields {
        $audit = [];

        $title = $this->resolveWithAudit($audit, 'title', [
            ['source' => 'article_jsonld', 'value' => $articleData?->jsonLdRaw['headline'] ?? null],
            ['source' => 'article_og', 'value' => $articleData?->ogRaw['og:title'] ?? null],
            ['source' => 'article_html', 'value' => $articleData?->title],
            ['source' => 'feed', 'value' => $feedData?->title],
            ['source' => 'listing', 'value' => $listingData?->title],
        ]);

        $subtitle = $this->resolveWithAudit($audit, 'subtitle', [
            ['source' => 'article_meta', 'value' => $articleData?->ogRaw['og:description'] ?? null],
            ['source' => 'article_jsonld', 'value' => $articleData?->jsonLdRaw['description'] ?? null],
            ['source' => 'article_html', 'value' => $articleData?->subtitle],
            ['source' => 'feed', 'value' => $feedData?->excerpt],
        ]);

        $author = $this->resolveWithAudit($audit, 'author', [
            ['source' => 'feed_dc_creator', 'value' => $feedData?->authorRaw],
            ['source' => 'article_jsonld', 'value' => $articleData?->jsonLdRaw['author'] ?? null],
            ['source' => 'article_html', 'value' => $articleData?->author],
        ]);

        $heroImage = $this->resolveImageWithStrategy(
            $audit,
            $listingData,
            $feedData,
            $articleData,
            $config['image_extraction_strategy'] ?? 'og_first_then_body'
        );

        $resolvedBody = $this->resolveBodyWithAudit($audit, [
            [
                'source' => 'article_html',
                'html' => $articleData?->bodyHtml,
                'text' => $articleData?->bodyText,
            ],
            [
                'source' => 'feed_content_encoded',
                'html' => $feedData?->bodyHtml,
                'text' => null,
            ],
        ]);

        $bodyHtml = $resolvedBody['html'];
        $bodyText = $resolvedBody['text'];

        $excerpt = $this->resolveWithAudit($audit, 'excerpt', [
            ['source' => 'article_subtitle', 'value' => $subtitle],
            ['source' => 'feed_excerpt', 'value' => $feedData?->excerpt],
            ['source' => 'listing_excerpt', 'value' => $listingData?->excerpt],
        ]);

        // Date resolution
        $dateResult = $this->resolveDate($audit, $feedData, $articleData, $config);

        // Categories merge
        $categories = $this->resolveCategories($feedData, $articleData);

        // Completeness score
        $completeness = $this->calculateCompleteness($title, $bodyHtml, $heroImage, $author, $dateResult);

        return new ResolvedFields(
            title: $title,
            subtitle: $subtitle,
            authorRaw: $author,
            bodyHtml: $bodyHtml,
            bodyText: $bodyText,
            excerpt: $excerpt ? mb_substr($excerpt, 0, 500) : null,
            heroImageUrl: $heroImage,
            publishedAtRaw: $dateResult['raw'] ?? null,
            publishedAtParsed: $dateResult['parsed'] ?? null,
            publishedAtUtc: $dateResult['utc'] ?? null,
            publishedAtTimezone: $dateResult['timezone'] ?? null,
            publishedAtSource: $dateResult['source'] ?? null,
            categoriesRaw: $categories,
            extractionCompleteness: $completeness,
            fieldAudit: $audit,
        );
    }

    /**
     * Resolve a field from sources by priority order.
     */
    private function resolveWithAudit(array &$audit, string $field, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            $value = $candidate['value'] ?? null;
            if (!empty($value) && trim($value) !== '') {
                $audit[$field] = $candidate['source'];
                return trim($value);
            }
        }
        $audit[$field] = 'unresolved';
        return null;
    }

    /**
     * Resolve hero image based on configured strategy.
     */
    private function resolveImageWithStrategy(
        array &$audit,
        ?ListingItem $listing,
        ?FeedItemDto $feed,
        ?ArticleExtractedData $article,
        string $strategy
    ): ?string {
        $sources = match ($strategy) {
            'listing_first_then_og_then_body' => [
                ['source' => 'listing', 'value' => $listing?->imageUrl],
                ['source' => 'article_og', 'value' => $article?->ogRaw['og:image'] ?? null],
                ['source' => 'article_html', 'value' => $article?->heroImage],
                ['source' => 'feed_content', 'value' => $feed?->heroImageUrl],
            ],
            'og_first_then_body' => [
                ['source' => 'article_og', 'value' => $article?->ogRaw['og:image'] ?? null],
                ['source' => 'article_html', 'value' => $article?->heroImage],
                ['source' => 'feed_content', 'value' => $feed?->heroImageUrl],
                ['source' => 'listing', 'value' => $listing?->imageUrl],
            ],
            'body_only' => [
                ['source' => 'article_html', 'value' => $article?->heroImage],
            ],
            default => [
                ['source' => 'article_og', 'value' => $article?->ogRaw['og:image'] ?? null],
                ['source' => 'article_html', 'value' => $article?->heroImage],
                ['source' => 'feed_content', 'value' => $feed?->heroImageUrl],
            ],
        };

        return $this->resolveWithAudit($audit, 'hero_image', $sources);
    }

    private function resolveDate(array &$audit, ?FeedItemDto $feed, ?ArticleExtractedData $article, array $config): array
    {
        $candidates = [
            ['source' => 'article_jsonld', 'enum_source' => 'jsonld', 'value' => $article?->jsonLdRaw['datePublished'] ?? null],
            ['source' => 'article_time_tag', 'enum_source' => 'time_tag', 'value' => $article?->publishedAt],
            ['source' => 'article_og', 'enum_source' => 'og_tag', 'value' => $article?->ogRaw['article:published_time'] ?? null],
            ['source' => 'feed_iso_date', 'enum_source' => 'rss', 'value' => $feed?->publishedAtRaw],
        ];

        $timezone = $config['timezone_default'] ?? 'America/Sao_Paulo';
        $dateFormats = $config['date_formats'] ?? [];
        $preprocessors = $config['date_preprocessors'] ?? [];

        foreach ($candidates as $candidate) {
            $raw = $candidate['value'] ?? null;
            if (empty($raw)) continue;

            $result = $this->dateParser->parse($raw, $dateFormats, $timezone, $preprocessors, $candidate['source']);
            if ($result->wasSuccessful()) {
                $audit['published_at'] = $candidate['source'];
                return [
                    'raw' => $raw,
                    'parsed' => $result->parsed?->toIso8601String(),
                    'utc' => $result->utc?->toIso8601String(),
                    'timezone' => $result->timezone,
                    'source' => $candidate['enum_source'],
                ];
            }
        }

        $audit['published_at'] = 'unresolved';
        return [];
    }

    private function resolveCategories(?FeedItemDto $feed, ?ArticleExtractedData $article): array
    {
        $categories = [];

        if ($feed && !empty($feed->categoriesRaw)) {
            $categories = array_merge($categories, $feed->categoriesRaw);
        }

        if ($article && !empty($article->categories)) {
            $merged = is_array($article->categories)
                ? $article->categories
                : explode(',', $article->categories);
            $categories = array_merge($categories, $merged);
        }

        // Normalize: lowercase, trim, unique
        $categories = array_map(fn ($c) => mb_strtolower(trim($c)), $categories);
        return array_values(array_unique(array_filter($categories)));
    }

    private function calculateCompleteness(?string $title, ?string $body, ?string $image, ?string $author, array $dateResult): int
    {
        $score = 0;
        if (!empty($title)) $score += 20;
        if (!empty($body) && mb_strlen($body) > 200) $score += 30;
        if (!empty($image)) $score += 15;
        if (!empty($author)) $score += 10;
        if (!empty($dateResult['parsed'] ?? null)) $score += 15;
        if (!empty($body) && mb_strlen($body) > 1000) $score += 10;
        return min($score, 100);
    }

    private function resolveBodyWithAudit(array &$audit, array $candidates): array
    {
        $ranked = [];

        foreach ($candidates as $candidate) {
            $html = trim((string) ($candidate['html'] ?? ''));
            if ($html === '') {
                continue;
            }

            $text = $this->normalizeBodyText($candidate['text'] ?? null, $html);

            $ranked[] = [
                'source' => $candidate['source'] ?? 'unknown',
                'html' => $html,
                'text' => $text,
                'score' => $this->scoreBodyCandidate($html, $text),
            ];
        }

        if ($ranked === []) {
            $audit['body_html'] = 'unresolved';

            return [
                'html' => null,
                'text' => null,
            ];
        }

        usort($ranked, static fn (array $left, array $right): int => $right['score'] <=> $left['score']);
        $best = $ranked[0];

        $audit['body_html'] = $best['source'];
        $audit['body_html_score'] = $best['score'];

        return [
            'html' => $best['html'],
            'text' => $best['text'],
        ];
    }

    private function normalizeBodyText(?string $bodyText, string $bodyHtml): string
    {
        if (is_string($bodyText) && trim($bodyText) !== '') {
            $normalized = html_entity_decode($bodyText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $normalized = preg_replace('/\s+/u', ' ', trim($normalized));

            return $normalized ?: '';
        }

        $normalized = strip_tags($bodyHtml);
        $normalized = html_entity_decode($normalized, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $normalized = preg_replace('/\s+/u', ' ', trim($normalized));

        return $normalized ?: '';
    }

    private function scoreBodyCandidate(string $bodyHtml, string $bodyText): int
    {
        $htmlLower = mb_strtolower($bodyHtml, 'UTF-8');
        $textLength = mb_strlen($bodyText);
        $paragraphCount = preg_match_all('/<p\b/i', $bodyHtml) ?: 0;
        $anchorCount = preg_match_all('/<a\b/i', $bodyHtml) ?: 0;

        $score = 0;
        $score += min(90, (int) floor($textLength / 20));
        $score += min(18, $paragraphCount * 3);

        if ($textLength < 120) {
            $score -= 30;
        }

        if ($anchorCount > 0 && $paragraphCount === 0 && $textLength < 240) {
            $score -= 60;
        }

        if (str_contains($htmlLower, 'line-news')) {
            $score -= 45;
        }

        if (str_contains($htmlLower, 'code-block') || str_contains($htmlLower, 'ocp-post-inline-placeholder')) {
            $score -= 20;
        }

        if (str_contains($htmlLower, 'mpsc-ultimas-noticias') || str_contains($htmlLower, 'últimas notícias')) {
            $score -= 25;
        }

        if (str_contains($htmlLower, 'the post') || str_contains($htmlLower, 'first appeared on')) {
            $score -= 20;
        }

        return $score;
    }
}
