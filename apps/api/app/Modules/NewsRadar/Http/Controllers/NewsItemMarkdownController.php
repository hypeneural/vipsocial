<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Models\NewsItem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class NewsItemMarkdownController extends Controller
{
    public function show(string $publicToken, Request $request): Response
    {
        $item = NewsItem::with(['source:id,name,homepage_url,source_type', 'aiMetadata'])
            ->where('public_token', $publicToken)
            ->whereNotNull('body_text')
            ->where('body_text', '!=', '')
            ->where('extraction_status', ExtractionStatus::Extracted)
            ->firstOrFail();

        $view = $request->query('view', 'raw');
        $md = $view === 'enriched'
            ? $this->buildEnrichedMarkdown($item)
            : $this->buildRawMarkdown($item);

        $etag = '"' . md5($item->updated_at->timestamp . $view) . '"';

        if ($request->header('If-None-Match') === $etag) {
            return response('', 304);
        }

        return response($md, 200, [
            'Content-Type'  => 'text/markdown; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300',
            'ETag'          => $etag,
            'Last-Modified' => $item->updated_at->toRfc7231String(),
            'X-Robots-Tag'  => 'noindex, nofollow',
        ]);
    }

    // ── Template raw (default) ─ para reescrita ─────────────

    private function buildRawMarkdown(NewsItem $item): string
    {
        $lines = [];

        $lines[] = $this->buildFrontmatter($item);
        $lines[] = '';
        $lines[] = '# ' . $this->sanitize($item->title);

        if ($item->subtitle) {
            $lines[] = '';
            $lines[] = '## ' . $this->sanitize($item->subtitle);
        }

        $lines[] = '';
        $lines[] = $this->buildMetaLine($item);
        $lines[] = '';
        $lines[] = '---';
        $lines[] = '';
        $lines[] = $this->sanitizeBody($item->body_text);
        $lines[] = '';

        return $this->normalizeLineBreaks(implode("\n", $lines));
    }

    // ── Template enriched ─ para análise/editorial ──────────

    private function buildEnrichedMarkdown(NewsItem $item): string
    {
        $lines = [];

        // Start with the raw content
        $lines[] = $this->buildRawMarkdown($item);

        $meta = $item->aiMetadata;
        if (! $meta) {
            return $this->normalizeLineBreaks(implode("\n", $lines));
        }

        $lines[] = '---';
        $lines[] = '';
        $lines[] = '## Análise I.A.';
        $lines[] = '';

        // Five Ws
        $fiveWs = $meta->five_ws ?? [];
        $wsLabels = [
            'who'   => 'Quem',
            'what'  => 'O quê',
            'where' => 'Onde',
            'when'  => 'Quando',
            'why'   => 'Por quê',
            'how'   => 'Como',
        ];

        foreach ($wsLabels as $key => $label) {
            $value = $this->normalizeAiValue($fiveWs[$key] ?? null);
            if ($value) {
                $lines[] = "- **{$label}:** {$value}";
            }
        }

        // Summary bullets
        $bullets = $meta->summary_bullets ?? [];
        if (! empty($bullets)) {
            $lines[] = '';
            $lines[] = '### Pontos-Chave';
            $lines[] = '';
            foreach ($bullets as $bullet) {
                $clean = trim($bullet);
                if ($clean) {
                    $lines[] = '- ' . $this->sanitize($clean);
                }
            }
        }

        $lines[] = '';

        return $this->normalizeLineBreaks(implode("\n", $lines));
    }

    // ── Helpers ─────────────────────────────────────────────

    private function buildFrontmatter(NewsItem $item): string
    {
        $fields = [];
        $fields[] = '---';
        $fields[] = 'source: ' . $this->yamlString($item->source?->name ?? 'Desconhecida');
        $fields[] = 'published_at: ' . $this->yamlString(
            $item->published_at_utc?->toIso8601String() ?? ''
        );
        $fields[] = 'original_url: ' . $this->yamlString($item->url);

        $categories = $item->categories_raw ?? [];
        if (! empty($categories)) {
            $fields[] = 'categories:';
            foreach ($categories as $cat) {
                $fields[] = '  - ' . $this->yamlString($cat);
            }
        }

        $fields[] = '---';

        return implode("\n", $fields);
    }

    private function buildMetaLine(NewsItem $item): string
    {
        $parts = [];

        $sourceName = $item->source?->name ?? 'Fonte desconhecida';
        $parts[] = "**Fonte:** {$this->sanitize($sourceName)}";

        if ($item->published_at_utc) {
            $parts[] = '**Publicada em:** ' . $item->published_at_utc->format('d/m/Y H:i');
        }

        $author = $item->author_normalized ?? $item->author_raw;
        if ($author) {
            $parts[] = '**Autor:** ' . $this->sanitize($author);
        }

        $city = $item->aiMetadata?->city;
        if ($city) {
            $parts[] = '**Cidade:** ' . $this->sanitize($city);
        }

        $urgency = $item->aiMetadata?->urgency?->value ?? null;
        if ($urgency) {
            $labels = ['baixa' => 'Baixa', 'media' => 'Média', 'alta' => 'Alta'];
            $parts[] = '**Urgência:** ' . ($labels[$urgency] ?? $urgency);
        }

        return implode(' · ', $parts);
    }

    private function sanitize(string $text): string
    {
        return strip_tags(trim($text));
    }

    private function sanitizeBody(string $body): string
    {
        $clean = strip_tags(trim($body));

        // Truncate absurdly long bodies
        $maxLen = 15000;
        if (mb_strlen($clean) > $maxLen) {
            $clean = mb_substr($clean, 0, $maxLen) . "\n\n> _(conteúdo truncado por exceder {$maxLen} caracteres)_";
        }

        return $clean;
    }

    private function normalizeLineBreaks(string $text): string
    {
        return str_replace("\r\n", "\n", $text);
    }

    private function yamlString(string $value): string
    {
        $value = trim($value);

        // Always quote to avoid YAML parsing issues with special chars
        $escaped = str_replace('"', '\\"', $value);

        return '"' . $escaped . '"';
    }

    private function normalizeAiValue(mixed $value): ?string
    {
        if (is_string($value)) {
            $trimmed = trim($value);
            return $trimmed ?: null;
        }

        if (is_array($value)) {
            $items = array_filter(array_map(fn ($v) => trim((string) $v), $value));
            $joined = implode(', ', $items);
            return $joined ?: null;
        }

        return null;
    }
}
