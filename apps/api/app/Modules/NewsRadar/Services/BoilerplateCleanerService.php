<?php

namespace App\Modules\NewsRadar\Services;

use Symfony\Component\DomCrawler\Crawler;

class BoilerplateCleanerService
{
    /** Global selectors always removed. */
    private const GLOBAL_REMOVE_SELECTORS = [
        'style', 'script', 'noscript', 'iframe[src*="facebook"]',
        '.sharedaddy', '.jp-relatedposts', '.yarpp-related',
    ];

    /** Global text patterns always removed (regex). */
    private const GLOBAL_REMOVE_PATTERNS = [
        '#O post .{0,200} apareceu primeiro em .{0,200}\.#iu',
        '#Clique aqui e fa[çc]a parte do nosso grupo#iu',
        '#Comente e compartilhe#iu',
        '#Siga o .{0,100} nas redes sociais#iu',
        '#Receba as not[íi]cias#iu',
    ];

    /** Emoji image domains to strip. */
    private const EMOJI_DOMAINS = ['s.w.org', 'twemoji.maxcdn.com'];

    /**
     * Clean HTML body from boilerplate, applying global + per-source rules.
     */
    public function clean(string $html, array $boilerplateRules = [], array $bodyStopPatterns = []): string
    {
        if (empty(trim($html))) {
            return '';
        }

        $crawler = new Crawler('<div id="__root__">' . $html . '</div>');
        $root = $crawler->filter('#__root__');

        if ($root->count() === 0) {
            return $html;
        }

        // 1. Remove global selectors
        $this->removeSelectors($root, self::GLOBAL_REMOVE_SELECTORS);

        // 2. Remove per-source selectors
        $sourceSelectors = $boilerplateRules['remove_selectors'] ?? [];
        if (!empty($sourceSelectors)) {
            $this->removeSelectors($root, $sourceSelectors);
        }

        // 3. Remove WordPress emoji images
        $this->removeEmojiImages($root);

        // Get the cleaned HTML
        $cleaned = $root->html();

        // 4. Apply body stop patterns (cut content after markers)
        if (!empty($bodyStopPatterns)) {
            $cleaned = $this->applyBodyStopPatterns($cleaned, $bodyStopPatterns);
        }

        // 5. Remove global text patterns
        foreach (self::GLOBAL_REMOVE_PATTERNS as $pattern) {
            $cleaned = preg_replace($pattern, '', $cleaned);
        }

        // 6. Remove per-source text patterns
        $sourcePatterns = $boilerplateRules['remove_text_patterns'] ?? [];
        foreach ($sourcePatterns as $pattern) {
            $cleaned = preg_replace('#' . $pattern . '#iu', '', $cleaned);
        }

        // 7. Normalize whitespace
        $cleaned = $this->normalizeWhitespace($cleaned);

        return trim($cleaned);
    }

    /**
     * Extract plain text from cleaned HTML.
     */
    public function toPlainText(string $html): string
    {
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    private function removeSelectors(Crawler $root, array $selectors): void
    {
        foreach ($selectors as $selector) {
            try {
                $root->filter($selector)->each(function (Crawler $node) {
                    $domNode = $node->getNode(0);
                    if ($domNode && $domNode->parentNode) {
                        $domNode->parentNode->removeChild($domNode);
                    }
                });
            } catch (\Throwable) {
                // Invalid selector, skip
            }
        }
    }

    private function removeEmojiImages(Crawler $root): void
    {
        $root->filter('img')->each(function (Crawler $img) {
            $src = $img->attr('src') ?? '';
            foreach (self::EMOJI_DOMAINS as $domain) {
                if (str_contains($src, $domain)) {
                    $domNode = $img->getNode(0);
                    if ($domNode && $domNode->parentNode) {
                        $domNode->parentNode->removeChild($domNode);
                    }
                    return;
                }
            }
        });
    }

    private function applyBodyStopPatterns(string $html, array $patterns): string
    {
        foreach ($patterns as $stopText) {
            $pos = mb_stripos($html, $stopText);
            if ($pos !== false) {
                // Find the start of the paragraph/tag containing the stop text
                $before = substr($html, 0, $pos);
                $lastTagOpen = strrpos($before, '<p');
                if ($lastTagOpen === false) {
                    $lastTagOpen = strrpos($before, '<div');
                }

                if ($lastTagOpen !== false) {
                    $html = substr($html, 0, $lastTagOpen);
                } else {
                    $html = $before;
                }
                break;
            }
        }

        return $html;
    }

    private function normalizeWhitespace(string $html): string
    {
        // Remove empty paragraphs
        $html = preg_replace('#<p[^>]*>\s*(&nbsp;|\xC2\xA0)?\s*</p>#i', '', $html);
        // Remove multiple <br> in sequence
        $html = preg_replace('#(<br\s*/?>[\s\n]*){3,}#i', '<br><br>', $html);

        return $html;
    }
}
