<?php

namespace App\Modules\NewsRadar\Services;

use Symfony\Component\DomCrawler\Crawler;

class ArticleExtractorService
{
    public function __construct(
        private readonly BoilerplateCleanerService $boilerplateCleaner,
    ) {}

    /**
     * Extract article data from an HTML page using layered extraction (A→B→C→D).
     *
     * @return ArticleExtractedData
     */
    public function extract(string $html, array $articleExtractors = [], array $boilerplateRules = [], array $bodyStopPatterns = []): ArticleExtractedData
    {
        $crawler = new Crawler($html);

        // Layer A: JSON-LD (schema.org/NewsArticle)
        $jsonLd = $this->extractJsonLd($crawler);

        // Layer B: Open Graph meta tags
        $og = $this->extractOpenGraph($crawler);

        // Layer C: HTML semantic with CSS selectors from config
        $css = $this->extractByCssSelectors($crawler, $articleExtractors, $html);

        // Layer D: Clean body with BoilerplateCleanerService
        $bodyHtml = $css['body'] ?? $jsonLd['articleBody'] ?? null;
        if ($bodyHtml) {
            $bodyHtml = $this->boilerplateCleaner->clean($bodyHtml, $boilerplateRules, $bodyStopPatterns);
        }
        $bodyText = $bodyHtml ? $this->boilerplateCleaner->toPlainText($bodyHtml) : null;

        return new ArticleExtractedData(
            title: $css['title'] ?? $jsonLd['headline'] ?? $og['og:title'] ?? null,
            subtitle: $css['subtitle'] ?? $jsonLd['description'] ?? $og['og:description'] ?? null,
            author: $css['author'] ?? $jsonLd['author'] ?? $og['article:author'] ?? null,
            publishedAt: $css['published_at'] ?? $jsonLd['datePublished'] ?? $og['article:published_time'] ?? null,
            modifiedAt: $jsonLd['dateModified'] ?? $og['article:modified_time'] ?? null,
            heroImage: $css['image'] ?? $og['og:image'] ?? $jsonLd['image'] ?? null,
            bodyHtml: $bodyHtml,
            bodyText: $bodyText,
            categories: $this->normalizeCategories($css['categories'] ?? $jsonLd['keywords'] ?? []),
            jsonLdRaw: $jsonLd,
            ogRaw: $og,
        );
    }

    /**
     * Extract JSON-LD structured data.
     */
    private function extractJsonLd(Crawler $crawler): array
    {
        $data = [];

        try {
            $scripts = $crawler->filter('script[type="application/ld+json"]');
            $scripts->each(function (Crawler $script) use (&$data) {
                $json = json_decode($script->text(), true);
                if (!$json) return;

                // Handle @graph arrays
                $items = isset($json['@graph']) ? $json['@graph'] : [$json];

                foreach ($items as $item) {
                    $type = $item['@type'] ?? '';
                    if (in_array($type, ['NewsArticle', 'Article', 'BlogPosting', 'WebPage'])) {
                        $data['headline'] = $item['headline'] ?? $data['headline'] ?? null;
                        $data['description'] = $item['description'] ?? $data['description'] ?? null;
                        $data['datePublished'] = $item['datePublished'] ?? $data['datePublished'] ?? null;
                        $data['dateModified'] = $item['dateModified'] ?? $data['dateModified'] ?? null;
                        $data['articleBody'] = $item['articleBody'] ?? $data['articleBody'] ?? null;
                        $data['keywords'] = $item['keywords'] ?? $data['keywords'] ?? [];

                        // Author (can be string, object, or array of objects)
                        $author = $item['author'] ?? null;
                        if (is_array($author)) {
                            $data['author'] = $author['name'] ?? ($author[0]['name'] ?? null);
                        } elseif (is_string($author)) {
                            $data['author'] = $author;
                        }

                        // Image
                        $image = $item['image'] ?? null;
                        if (is_array($image)) {
                            $data['image'] = $image['url'] ?? ($image[0] ?? null);
                        } elseif (is_string($image)) {
                            $data['image'] = $image;
                        }
                    }
                }
            });
        } catch (\Throwable) {
            // silent
        }

        return $data;
    }

    /**
     * Extract Open Graph meta tags.
     */
    private function extractOpenGraph(Crawler $crawler): array
    {
        $data = [];
        $ogProperties = [
            'og:title', 'og:description', 'og:image', 'og:url',
            'article:published_time', 'article:modified_time', 'article:author',
            'article:section', 'article:tag',
        ];

        foreach ($ogProperties as $prop) {
            try {
                $meta = $crawler->filter("meta[property='{$prop}']");
                if ($meta->count() > 0) {
                    $content = $meta->first()->attr('content');
                    if ($content) {
                        $data[$prop] = $content;
                    }
                }
            } catch (\Throwable) {
                continue;
            }
        }

        // Also check name-based meta
        try {
            $descMeta = $crawler->filter("meta[name='description']");
            if ($descMeta->count() > 0 && !isset($data['og:description'])) {
                $data['og:description'] = $descMeta->first()->attr('content');
            }
        } catch (\Throwable) {
            // silent
        }

        return $data;
    }

    /**
     * Extract fields using configured CSS selectors.
     */
    private function extractByCssSelectors(Crawler $crawler, array $extractors, string $html): array
    {
        $data = [];

        foreach ($extractors as $field => $selectors) {
            if (!is_array($selectors)) continue;

            $value = null;
            foreach ($selectors as $selector) {
                try {
                    $found = $crawler->filter($selector);
                    if ($found->count() > 0) {
                        // Different extraction strategy per field
                        $value = match ($field) {
                            'title', 'subtitle', 'author' => trim($found->first()->text('')),
                            'published_at' => $found->first()->attr('datetime')
                                ?? $found->first()->attr('content')
                                ?? trim($found->first()->text('')),
                            'image' => $this->extractImageValue($found->first(), $html),
                            'body' => $found->first()->html(),
                            default => trim($found->first()->text('')),
                        };

                        if (!empty($value)) break;
                    }
                } catch (\Throwable) {
                    continue;
                }
            }

            if ($value) {
                $data[$field] = $value;
            }
        }

        return $data;
    }

    private function extractImageValue(Crawler $node, string $html): ?string
    {
        $directValue = $node->attr('content')
            ?? $node->attr('src')
            ?? $node->attr('href');

        if (!empty($directValue)) {
            return $directValue;
        }

        $inlineStyle = $node->attr('style') ?? '';
        if (preg_match('#url\((["\']?)([^)"\']+)\1\)#i', $inlineStyle, $matches)) {
            return $matches[2];
        }

        $selectors = [];
        $id = $node->attr('id');
        if (!empty($id)) {
            $selectors[] = '#' . preg_quote($id, '#');
        }

        $classAttr = $node->attr('class') ?? '';
        foreach (preg_split('/\s+/', trim($classAttr)) as $className) {
            if ($className !== '') {
                $selectors[] = '\.' . preg_quote($className, '#');
            }
        }

        foreach ($selectors as $selector) {
            $pattern = '#' . $selector . '[^{]*\{[^}]*background(?:-image)?:[^;]*url\((["\']?)([^)"\']+)\1\)#is';
            if (preg_match($pattern, $html, $matches)) {
                return $matches[2];
            }
        }

        return null;
    }

    private function normalizeCategories(array|string|null $categories): array
    {
        if (is_array($categories)) {
            return array_values(array_filter(array_map('trim', $categories)));
        }

        if (is_string($categories) && trim($categories) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $categories))));
        }

        return [];
    }
}

class ArticleExtractedData
{
    public function __construct(
        public readonly ?string $title,
        public readonly ?string $subtitle,
        public readonly ?string $author,
        public readonly ?string $publishedAt,
        public readonly ?string $modifiedAt,
        public readonly ?string $heroImage,
        public readonly ?string $bodyHtml,
        public readonly ?string $bodyText,
        public readonly array $categories,
        public readonly array $jsonLdRaw,
        public readonly array $ogRaw,
    ) {}

    public function completenessScore(): int
    {
        $score = 0;
        if ($this->title) $score += 20;
        if ($this->bodyHtml && mb_strlen($this->bodyHtml) > 200) $score += 30;
        if ($this->publishedAt) $score += 15;
        if ($this->heroImage) $score += 15;
        if ($this->author) $score += 10;
        if ($this->subtitle) $score += 5;
        if (!empty($this->categories)) $score += 5;
        return $score;
    }
}
