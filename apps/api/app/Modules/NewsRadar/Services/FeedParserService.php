<?php

namespace App\Modules\NewsRadar\Services;

use SimplePie\SimplePie;
use Symfony\Component\DomCrawler\Crawler;

class FeedParserService
{
    public function __construct(
        private readonly UrlNormalizerService $urlNormalizer,
    ) {}

    /**
     * Parse an RSS/Atom feed from URL or raw XML.
     *
     * @return FeedParseResult
     */
    public function parseFromUrl(string $feedUrl): FeedParseResult
    {
        $feed = new SimplePie();
        $feed->set_feed_url($feedUrl);
        $feed->enable_cache(false);
        $feed->init();

        if ($feed->error()) {
            return new FeedParseResult(
                success: false,
                items: [],
                feedTitle: null,
                feedUrl: $feedUrl,
                error: $feed->error(),
            );
        }

        return $this->buildResult($feed, $feedUrl);
    }

    /**
     * Parse from raw XML string.
     */
    public function parseFromString(string $xml, string $feedUrl = ''): FeedParseResult
    {
        $feed = new SimplePie();
        $feed->set_raw_data($xml);
        $feed->enable_cache(false);
        $feed->init();

        if ($feed->error()) {
            return new FeedParseResult(
                success: false,
                items: [],
                feedTitle: null,
                feedUrl: $feedUrl,
                error: $feed->error(),
            );
        }

        return $this->buildResult($feed, $feedUrl);
    }

    private function buildResult(SimplePie $feed, string $feedUrl): FeedParseResult
    {
        $items = [];

        foreach ($feed->get_items() as $feedItem) {
            $rawUrl = $feedItem->get_link() ?? '';
            $urlData = $this->urlNormalizer->normalizeAndHash($rawUrl);

            $author = $this->resolveAuthor($feedItem);
            $bodyHtml = $this->resolveBody($feedItem);
            $heroImage = $this->extractHeroImage($bodyHtml);

            $items[] = new FeedItemDto(
                title: html_entity_decode($feedItem->get_title() ?? '', ENT_QUOTES, 'UTF-8'),
                rawUrl: $rawUrl,
                normalizedUrl: $urlData['normalized_url'],
                urlHash: $urlData['url_hash'],
                guid: $feedItem->get_id(false),
                authorRaw: $author,
                publishedAtRaw: $feedItem->get_date('c'),
                bodyHtml: $bodyHtml,
                excerpt: $this->resolveExcerpt($feedItem),
                categoriesRaw: $this->resolveCategories($feedItem),
                heroImageUrl: $heroImage,
                rawPayload: $this->buildRawPayload($feedItem),
            );
        }

        return new FeedParseResult(
            success: true,
            items: $items,
            feedTitle: $feed->get_title(),
            feedUrl: $feedUrl,
            error: null,
        );
    }

    private function resolveAuthor(\SimplePie\Item $item): ?string
    {
        // Priority: dc:creator > creator > author
        $author = $item->get_author();
        return $author ? $author->get_name() : null;
    }

    private function resolveBody(\SimplePie\Item $item): ?string
    {
        // Priority: content:encoded > content > description
        $content = $item->get_content();
        return !empty($content) ? $content : null;
    }

    private function resolveExcerpt(\SimplePie\Item $item): ?string
    {
        $description = $item->get_description();
        if ($description) {
            $text = strip_tags($description);
            $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
            return mb_substr(trim($text), 0, 500);
        }
        return null;
    }

    private function resolveCategories(\SimplePie\Item $item): array
    {
        $categories = [];
        $cats = $item->get_categories();
        if ($cats) {
            foreach ($cats as $cat) {
                $label = $cat->get_label();
                if ($label) {
                    $categories[] = trim($label);
                }
            }
        }
        return array_unique($categories);
    }

    private function extractHeroImage(?string $html): ?string
    {
        if (empty($html)) {
            return null;
        }

        $emojiDomains = ['s.w.org', 'twemoji.maxcdn.com'];

        try {
            $crawler = new Crawler($html);
            $images = $crawler->filter('img');

            $bestImage = null;
            $bestWidth = 0;

            $images->each(function (Crawler $img) use (&$bestImage, &$bestWidth, $emojiDomains) {
                $src = $img->attr('src') ?? '';

                // Skip emoji images
                foreach ($emojiDomains as $domain) {
                    if (str_contains($src, $domain)) {
                        return;
                    }
                }

                // Check srcset for larger images
                $srcset = $img->attr('srcset') ?? '';
                if ($srcset) {
                    preg_match_all('/(\S+)\s+(\d+)w/', $srcset, $matches);
                    if (!empty($matches[2])) {
                        $maxIdx = array_search(max($matches[2]), $matches[2]);
                        $src = $matches[1][$maxIdx];
                        $width = (int) $matches[2][$maxIdx];
                        if ($width > $bestWidth) {
                            $bestWidth = $width;
                            $bestImage = $src;
                        }
                        return;
                    }
                }

                $width = (int) ($img->attr('width') ?? 0);
                if ($width > $bestWidth || $bestImage === null) {
                    $bestWidth = $width;
                    $bestImage = $src;
                }
            });

            return $bestImage;
        } catch (\Throwable) {
            return null;
        }
    }

    private function buildRawPayload(\SimplePie\Item $item): array
    {
        return [
            'title' => $item->get_title(),
            'link' => $item->get_link(),
            'guid' => $item->get_id(false),
            'pubDate' => $item->get_date('c'),
            'author' => $item->get_author()?->get_name(),
            'content' => $item->get_content(),
            'description' => $item->get_description(),
            'categories' => $this->resolveCategories($item),
        ];
    }
}

class FeedParseResult
{
    public function __construct(
        public readonly bool $success,
        public readonly array $items,
        public readonly ?string $feedTitle,
        public readonly string $feedUrl,
        public readonly ?string $error,
    ) {}

    public function count(): int
    {
        return count($this->items);
    }
}

class FeedItemDto
{
    public function __construct(
        public readonly string $title,
        public readonly string $rawUrl,
        public readonly string $normalizedUrl,
        public readonly string $urlHash,
        public readonly ?string $guid,
        public readonly ?string $authorRaw,
        public readonly ?string $publishedAtRaw,
        public readonly ?string $bodyHtml,
        public readonly ?string $excerpt,
        public readonly array $categoriesRaw,
        public readonly ?string $heroImageUrl,
        public readonly array $rawPayload,
    ) {}
}
