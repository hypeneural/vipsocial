<?php

namespace App\Modules\NewsRadar\Services;

use Symfony\Component\DomCrawler\Crawler;

class BoilerplateCleanerService
{
    /** Global selectors always removed. */
    private const GLOBAL_REMOVE_SELECTORS = [
        'style', 'script', 'noscript', 'iframe[src*="facebook"]',
        '.sharedaddy', '.jp-relatedposts', '.yarpp-related',
        '.code-block', '.ads', '[id^="gam_"]',
        '.line-news', '.line-news-detailed', '#related-news',
        '.ocp-post-inline-placeholder',
        '.mpsc-ultimas-noticias-container',
    ];

    /** Global text patterns always removed (regex). */
    private const GLOBAL_REMOVE_PATTERNS = [
        '#(?:O post|The post)[\s\S]{0,500}?(?:apareceu primeiro em|first appeared on)[\s\S]{0,250}#iu',
        '#Clique aqui e fa\S*a parte do nosso grupo(?: no WhatsApp)?#iu',
        '#Clique aqui e siga tamb\S*m[\s\S]{0,120}?(Instagram|Facebook|WhatsApp)#iu',
        '#Comente e compartilhe#iu',
        '#Siga o .{0,100} nas redes sociais#iu',
        '#Receba as not\S*cias#iu',
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

        $this->removeSelectors($root, self::GLOBAL_REMOVE_SELECTORS);

        $sourceSelectors = $boilerplateRules['remove_selectors'] ?? [];
        if (!empty($sourceSelectors)) {
            $this->removeSelectors($root, $sourceSelectors);
        }

        $this->removeEmojiImages($root);

        $cleaned = $root->html();

        if (!empty($bodyStopPatterns)) {
            $cleaned = $this->applyBodyStopPatterns($cleaned, $bodyStopPatterns);
        }

        foreach (self::GLOBAL_REMOVE_PATTERNS as $pattern) {
            $cleaned = preg_replace($pattern, '', $cleaned);
        }

        $sourcePatterns = $boilerplateRules['remove_text_patterns'] ?? [];
        foreach ($sourcePatterns as $pattern) {
            $cleaned = preg_replace('#' . $pattern . '#iu', '', $cleaned);
        }

        $cleaned = $this->normalizeWhitespace($cleaned);

        return trim($cleaned);
    }

    /**
     * Clean short plain text fields like feed excerpts.
     */
    public function cleanText(string $text, array $sourcePatterns = []): string
    {
        $cleaned = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $cleaned = strip_tags($cleaned);
        $cleaned = str_replace("\xc2\xa0", ' ', $cleaned);

        foreach (self::GLOBAL_REMOVE_PATTERNS as $pattern) {
            $cleaned = preg_replace($pattern, '', $cleaned) ?? $cleaned;
        }

        foreach ($sourcePatterns as $pattern) {
            $cleaned = preg_replace('#' . $pattern . '#iu', '', $cleaned) ?? $cleaned;
        }

        $cleaned = preg_replace('/\s+/u', ' ', trim($cleaned)) ?? trim($cleaned);

        return trim($cleaned);
    }

    /**
     * Extract plain text from cleaned HTML.
     */
    public function toPlainText(string $html): string
    {
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace("\xc2\xa0", ' ', $text);
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
                // Invalid selector, skip.
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
            if ($pos === false) {
                continue;
            }

            $before = substr($html, 0, $pos);
            $lastTagOpen = strrpos($before, '<p');
            if ($lastTagOpen === false) {
                $lastTagOpen = strrpos($before, '<div');
            }

            $html = $lastTagOpen !== false
                ? substr($html, 0, $lastTagOpen)
                : $before;

            break;
        }

        return $html;
    }

    private function normalizeWhitespace(string $html): string
    {
        $html = preg_replace('#<p[^>]*>\s*(&nbsp;|\xC2\xA0)?\s*</p>#i', '', $html);
        $html = preg_replace('#(<br\s*/?>[\s\n]*){3,}#i', '<br><br>', $html);

        return $html;
    }
}
