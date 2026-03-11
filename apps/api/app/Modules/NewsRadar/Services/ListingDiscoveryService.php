<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Models\NewsRawItem;
use Symfony\Component\DomCrawler\Crawler;

class ListingDiscoveryService
{
    public function __construct(
        private readonly HttpFetchService $httpFetch,
        private readonly UrlNormalizerService $urlNormalizer,
    ) {}

    /**
     * Discover article URLs from HTML listing pages with pagination support.
     *
     * @return ListingItem[]
     */
    public function discover(array $config, int $newsSourceId): array
    {
        $listingUrls = $config['listing_urls'] ?? [];
        $relativeBase = $config['relative_url_base'] ?? null;
        $maxPages = $config['listing_max_pages'] ?? 3;
        $stopWhenKnown = $config['stop_when_seen_known_urls'] ?? true;
        $maxKnownBeforeStop = $config['max_known_urls_before_stop'] ?? 10;

        $articlePatterns = $config['article_url_patterns'] ?? [];
        $ignorePatterns = $config['ignore_url_patterns'] ?? [];

        $allItems = [];
        $seenUrls = [];

        foreach ($listingUrls as $listingUrl) {
            $currentUrl = $listingUrl;
            $pagesProcessed = 0;
            $knownUrlCount = 0;

            while ($currentUrl && $pagesProcessed < $maxPages) {
                $result = $this->httpFetch->fetch($currentUrl);
                if (!$result->success) break;

                $pageItems = $this->extractItemsFromPage($result->body, $config, $relativeBase);

                foreach ($pageItems as $item) {
                    // Deduplicate within this run
                    if (isset($seenUrls[$item->urlHash])) continue;
                    $seenUrls[$item->urlHash] = true;

                    // Apply URL filters
                    if (!empty($ignorePatterns) && $this->urlNormalizer->matchesPatterns($item->normalizedUrl, $ignorePatterns)) {
                        continue;
                    }
                    if (!empty($articlePatterns) && !$this->urlNormalizer->matchesPatterns($item->normalizedUrl, $articlePatterns)) {
                        continue;
                    }

                    // Smart stop: check if URL already exists in DB
                    if ($stopWhenKnown) {
                        $exists = NewsRawItem::where('news_source_id', $newsSourceId)
                            ->where('url_hash', $item->urlHash)
                            ->exists();
                        if ($exists) {
                            $knownUrlCount++;
                            if ($knownUrlCount >= $maxKnownBeforeStop) {
                                return $allItems; // Stop early — we've hit known territory
                            }
                            continue; // Skip this one but keep checking
                        }
                    }

                    $allItems[] = $item;
                }

                $pagesProcessed++;

                // Find next page link
                $currentUrl = $this->findNextPageUrl($result->body, $config, $relativeBase);
            }
        }

        return $allItems;
    }

    /**
     * Extract items from a single listing page.
     *
     * @return ListingItem[]
     */
    private function extractItemsFromPage(string $html, array $config, ?string $relativeBase): array
    {
        $items = [];

        try {
            $crawler = new Crawler($html);
        } catch (\Throwable) {
            return [];
        }

        // Find container
        $container = null;
        foreach ($config['listing_container_selectors'] ?? ['body'] as $selector) {
            try {
                $found = $crawler->filter($selector);
                if ($found->count() > 0) {
                    $container = $found->first();
                    break;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        if (!$container) return [];

        // Extract cards
        $cardSelectors = $config['listing_item_selectors'] ?? ['article', '.post', '.card'];
        $cards = collect();

        foreach ($cardSelectors as $selector) {
            try {
                $found = $container->filter($selector);
                if ($found->count() > 0) {
                    $found->each(function (Crawler $node) use (&$cards) {
                        $cards->push($node);
                    });
                    break; // Use first matching selector
                }
            } catch (\Throwable) {
                continue;
            }
        }

        foreach ($cards as $card) {
            $item = $this->extractFromCard($card, $config, $relativeBase);
            if ($item) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private function extractFromCard(Crawler $card, array $config, ?string $relativeBase): ?ListingItem
    {
        // Extract link
        $link = $this->extractField($card, $config['listing_link_selectors'] ?? ['a'], 'href');
        if (!$link) return null;

        // Resolve relative URL
        $urlData = $this->urlNormalizer->normalizeAndHash($link, $relativeBase);

        // Extract optional fields
        $title = $this->extractField($card, $config['listing_title_selectors'] ?? ['h2', 'h1'], 'text');
        $image = $this->extractField($card, $config['listing_image_selectors'] ?? ['img'], 'src');
        $excerpt = $this->extractField($card, $config['listing_excerpt_selectors'] ?? [], 'text');

        // Resolve relative image URL
        if ($image && $relativeBase && !preg_match('#^https?://#i', $image)) {
            $image = rtrim($relativeBase, '/') . '/' . ltrim($image, '/');
        }

        return new ListingItem(
            rawUrl: $link,
            normalizedUrl: $urlData['normalized_url'],
            urlHash: $urlData['url_hash'],
            title: $title,
            imageUrl: $image,
            excerpt: $excerpt,
        );
    }

    private function extractField(Crawler $node, array $selectors, string $attr): ?string
    {
        foreach ($selectors as $selector) {
            try {
                $found = $node->filter($selector);
                if ($found->count() > 0) {
                    $value = match ($attr) {
                        'text' => trim($found->first()->text('')),
                        'href' => $found->first()->attr('href'),
                        'src' => $found->first()->attr('src'),
                        default => $found->first()->attr($attr),
                    };

                    if (!empty($value)) return $value;
                }
            } catch (\Throwable) {
                continue;
            }
        }
        return null;
    }

    private function findNextPageUrl(string $html, array $config, ?string $relativeBase): ?string
    {
        $selectors = $config['next_page_selectors'] ?? [];
        if (empty($selectors)) return null;

        try {
            $crawler = new Crawler($html);
            foreach ($selectors as $selector) {
                $link = $crawler->filter($selector);
                if ($link->count() > 0) {
                    $href = $link->first()->attr('href');
                    if ($href) {
                        if ($relativeBase && !preg_match('#^https?://#i', $href)) {
                            return rtrim($relativeBase, '/') . '/' . ltrim($href, '/');
                        }
                        return $href;
                    }
                }
            }
        } catch (\Throwable) {
            // ignore
        }

        return null;
    }
}

class ListingItem
{
    public function __construct(
        public readonly string $rawUrl,
        public readonly string $normalizedUrl,
        public readonly string $urlHash,
        public readonly ?string $title,
        public readonly ?string $imageUrl,
        public readonly ?string $excerpt,
    ) {}
}
