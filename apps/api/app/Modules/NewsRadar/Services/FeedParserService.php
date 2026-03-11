<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Support\ImageUrlHeuristics;
use SimplePie\SimplePie;
use Symfony\Component\DomCrawler\Crawler;

class FeedParserService
{
    public function __construct(
        private readonly UrlNormalizerService $urlNormalizer,
        private readonly HttpFetchService $httpFetch,
        private readonly BoilerplateCleanerService $boilerplateCleaner,
    ) {}

    /**
     * Parse an RSS/Atom feed from URL or raw XML.
     *
     * @return FeedParseResult
     */
    public function parseFromUrl(string $feedUrl): FeedParseResult
    {
        $prefetched = $this->httpFetch->fetchXml($feedUrl);
        if ($prefetched->success && trim($prefetched->body) !== '') {
            $prefetchedResult = $this->parseFromString($prefetched->body, $feedUrl);
            if ($prefetchedResult->success) {
                return $prefetchedResult;
            }
        }

        $feed = new SimplePie();
        $feed->set_feed_url($feedUrl);
        $feed->enable_cache(false);
        $feed->set_timeout(20);
        $feed->set_useragent('VIPSocial-NewsRadar/1.0 (+https://vipsocial.com.br)');
        $feed->init();

        if ($feed->error()) {
            return new FeedParseResult(
                success: false,
                items: [],
                feedTitle: null,
                feedUrl: $feedUrl,
                error: $prefetched->success
                    ? $feed->error()
                    : trim(implode(' | ', array_filter([$prefetched->error, $feed->error()]))),
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
        $feed->set_raw_data($this->sanitizeXml($xml));
        $feed->enable_cache(false);
        $feed->set_timeout(20);
        $feed->set_useragent('VIPSocial-NewsRadar/1.0 (+https://vipsocial.com.br)');
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
            $excerpt = $this->resolveExcerpt($feedItem);
            $categories = $this->resolveCategories($feedItem);

            $items[] = new FeedItemDto(
                title: html_entity_decode($feedItem->get_title() ?? '', ENT_QUOTES, 'UTF-8'),
                rawUrl: $rawUrl,
                normalizedUrl: $urlData['normalized_url'],
                urlHash: $urlData['url_hash'],
                guid: $feedItem->get_id(false),
                authorRaw: $author,
                publishedAtRaw: $feedItem->get_date('c'),
                bodyHtml: $bodyHtml,
                excerpt: $excerpt,
                categoriesRaw: $categories,
                heroImageUrl: $heroImage,
                rawPayload: $this->buildRawPayload($feedItem, $author, $bodyHtml, $excerpt, $categories, $heroImage),
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
            $text = $this->boilerplateCleaner->cleanText($description);

            return $text !== '' ? mb_substr($text, 0, 500) : null;
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

                foreach ($emojiDomains as $domain) {
                    if (str_contains($src, $domain)) {
                        return;
                    }
                }

                $srcset = $img->attr('srcset') ?? '';
                if ($srcset) {
                    preg_match_all('/(\S+)\s+(\d+)w/', $srcset, $matches);
                    if (!empty($matches[2])) {
                        $maxIdx = array_search(max($matches[2]), $matches[2]);
                        $src = $matches[1][$maxIdx];
                        $width = (int) $matches[2][$maxIdx];
                        $height = (int) ($img->attr('height') ?? 0);
                        $style = $img->attr('style');
                        $src = ImageUrlHeuristics::sanitize($src, $width, $height, $style);
                        if ($src === null) {
                            return;
                        }

                        if ($width > $bestWidth) {
                            $bestWidth = $width;
                            $bestImage = $src;
                        }

                        return;
                    }
                }

                $height = (int) ($img->attr('height') ?? 0);
                $width = (int) ($img->attr('width') ?? 0);
                $style = $img->attr('style');
                $src = ImageUrlHeuristics::sanitize($src, $width, $height, $style);
                if ($src === null) {
                    return;
                }

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

    private function buildRawPayload(
        \SimplePie\Item $item,
        ?string $author,
        ?string $bodyHtml,
        ?string $excerpt,
        array $categories,
        ?string $heroImage,
    ): array {
        return [
            'title' => $item->get_title(),
            'link' => $item->get_link(),
            'guid' => $item->get_id(false),
            'pubDate' => $item->get_date('c'),
            'author' => $author,
            'content' => $bodyHtml,
            'description' => $excerpt,
            'categories' => $categories,
            'hero_image_url' => $heroImage,
        ];
    }

    private function sanitizeXml(string $xml): string
    {
        $sanitized = preg_replace('/^\xEF\xBB\xBF/', '', $xml) ?? $xml;
        $sanitized = preg_replace('/[^\x09\x0A\x0D\x20-\x{D7FF}\x{E000}-\x{FFFD}]/u', '', $sanitized) ?? $sanitized;

        $rootStart = null;
        foreach (['<rss', '<feed', '<rdf:RDF'] as $candidate) {
            $position = stripos($sanitized, $candidate);
            if ($position !== false && ($rootStart === null || $position < $rootStart)) {
                $rootStart = $position;
            }
        }

        if ($rootStart !== null && $rootStart > 0) {
            $sanitized = substr($sanitized, $rootStart);
        }

        foreach (['</rss>', '</feed>', '</rdf:RDF>'] as $closingTag) {
            $position = stripos($sanitized, $closingTag);
            if ($position !== false) {
                $sanitized = substr($sanitized, 0, $position + strlen($closingTag));
                break;
            }
        }

        return trim($sanitized);
    }
}
