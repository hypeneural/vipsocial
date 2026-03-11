<?php

namespace App\Modules\NewsRadar\Services;

use Symfony\Component\DomCrawler\Crawler;

class SitemapParserService
{
    public function __construct(
        private readonly HttpFetchService $httpFetch,
        private readonly UrlNormalizerService $urlNormalizer,
    ) {}

    /**
     * Parse a sitemap URL (auto-detects index vs simple vs news sitemap).
     *
     * @return SitemapItem[]
     */
    public function parse(
        string $sitemapUrl,
        array $articlePatterns = [],
        array $ignorePatterns = [],
        int $maxUrls = 500
    ): array {
        $result = $this->httpFetch->fetchXml($sitemapUrl);

        if (!$result->success) {
            return [];
        }

        return $this->parseXml($result->body, $articlePatterns, $ignorePatterns, $maxUrls);
    }

    /**
     * Parse raw XML content.
     *
     * @return SitemapItem[]
     */
    public function parseXml(
        string $xml,
        array $articlePatterns = [],
        array $ignorePatterns = [],
        int $maxUrls = 500
    ): array {
        $items = [];

        try {
            $xmlObj = new \SimpleXMLElement($xml);
        } catch (\Throwable) {
            return [];
        }

        // Register namespaces
        $namespaces = $xmlObj->getNamespaces(true);

        // Detect type: sitemap index vs urlset
        if (isset($xmlObj->sitemap)) {
            // Sitemap Index — recurse into child sitemaps
            foreach ($xmlObj->sitemap as $sitemap) {
                $childUrl = (string) $sitemap->loc;
                if (empty($childUrl)) continue;

                $childItems = $this->parse($childUrl, $articlePatterns, $ignorePatterns, $maxUrls - count($items));
                $items = array_merge($items, $childItems);

                if (count($items) >= $maxUrls) break;
            }
        } elseif (isset($xmlObj->url)) {
            // Standard urlset or News Sitemap
            $hasNews = isset($namespaces['news']);

            foreach ($xmlObj->url as $urlNode) {
                if (count($items) >= $maxUrls) break;

                $loc = (string) $urlNode->loc;
                if (empty($loc)) continue;

                // Apply URL filters
                if (!empty($ignorePatterns) && $this->urlNormalizer->matchesPatterns($loc, $ignorePatterns)) {
                    continue;
                }
                if (!empty($articlePatterns) && !$this->urlNormalizer->matchesPatterns($loc, $articlePatterns)) {
                    continue;
                }

                $urlData = $this->urlNormalizer->normalizeAndHash($loc);
                $lastmod = isset($urlNode->lastmod) ? (string) $urlNode->lastmod : null;

                // News Sitemap fields
                $title = null;
                $publicationDate = null;
                $keywords = null;

                if ($hasNews) {
                    $newsNode = $urlNode->children($namespaces['news']);
                    if (isset($newsNode->news)) {
                        $title = isset($newsNode->news->title) ? (string) $newsNode->news->title : null;
                        $publicationDate = isset($newsNode->news->publication_date) ? (string) $newsNode->news->publication_date : null;
                        $keywords = isset($newsNode->news->keywords) ? (string) $newsNode->news->keywords : null;
                    }
                }

                $items[] = new SitemapItem(
                    rawUrl: $loc,
                    normalizedUrl: $urlData['normalized_url'],
                    urlHash: $urlData['url_hash'],
                    lastmod: $lastmod,
                    title: $title,
                    publicationDate: $publicationDate,
                    keywords: $keywords,
                );
            }
        }

        // Sort by lastmod/publicationDate (most recent first)
        usort($items, function (SitemapItem $a, SitemapItem $b) {
            $dateA = $a->publicationDate ?? $a->lastmod ?? '';
            $dateB = $b->publicationDate ?? $b->lastmod ?? '';
            return strcmp($dateB, $dateA);
        });

        return $items;
    }
}

class SitemapItem
{
    public function __construct(
        public readonly string $rawUrl,
        public readonly string $normalizedUrl,
        public readonly string $urlHash,
        public readonly ?string $lastmod,
        public readonly ?string $title,
        public readonly ?string $publicationDate,
        public readonly ?string $keywords,
    ) {}
}
