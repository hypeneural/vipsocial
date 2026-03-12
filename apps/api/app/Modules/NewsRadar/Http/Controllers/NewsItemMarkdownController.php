<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Models\NewsItem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class NewsItemMarkdownController extends Controller
{
    public function preflight(): Response
    {
        return response('', 204, $this->publicCorsHeaders());
    }

    public function show(string $publicToken, Request $request): Response
    {
        $item = $this->findPublicItem($publicToken);

        abort_if($item === null, 404);

        return $this->markdownResponse($item, $request, 'text/markdown; charset=UTF-8');
    }

    public function showDocument(string $publicToken, Request $request): Response
    {
        $item = $this->findPublicItem($publicToken);

        if ($item === null) {
            return response("Not found\n", 404, [
                'Content-Type' => 'text/plain; charset=UTF-8',
                'X-Robots-Tag' => 'noindex, nofollow',
                ...$this->publicCorsHeaders(),
            ]);
        }

        return $this->markdownResponse($item, $request, 'text/plain; charset=UTF-8');
    }

    private function markdownResponse(NewsItem $item, Request $request, string $contentType): Response
    {
        $view = $request->query('view', 'raw');
        $markdown = $view === 'enriched'
            ? $this->buildEnrichedMarkdown($item)
            : $this->buildRawMarkdown($item);

        $etag = '"' . md5($item->updated_at->timestamp . $view . $contentType) . '"';

        if ($request->header('If-None-Match') === $etag) {
            return response('', 304, $this->publicCorsHeaders());
        }

        return response($markdown, 200, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=300',
            'ETag' => $etag,
            'Last-Modified' => $item->updated_at->toRfc7231String(),
            'X-Robots-Tag' => 'noindex, nofollow',
            ...$this->publicCorsHeaders(),
        ]);
    }

    private function findPublicItem(string $publicToken): ?NewsItem
    {
        return NewsItem::with(['source:id,name,homepage_url,source_type', 'aiMetadata'])
            ->where('public_token', $publicToken)
            ->whereNotNull('body_text')
            ->where('body_text', '!=', '')
            ->where('extraction_status', ExtractionStatus::Extracted)
            ->first();
    }

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

    private function buildEnrichedMarkdown(NewsItem $item): string
    {
        $lines = [];
        $lines[] = $this->buildRawMarkdown($item);

        $meta = $item->aiMetadata;
        if (! $meta) {
            return $this->normalizeLineBreaks(implode("\n", $lines));
        }

        $lines[] = '---';
        $lines[] = '';
        $lines[] = '## Análise I.A.';
        $lines[] = '';

        $fiveWs = $meta->five_ws ?? [];
        $labels = [
            'who' => 'Quem',
            'what' => 'O quê',
            'where' => 'Onde',
            'when' => 'Quando',
            'why' => 'Por quê',
            'how' => 'Como',
        ];

        foreach ($labels as $key => $label) {
            $value = $this->normalizeAiValue($fiveWs[$key] ?? null);
            if ($value) {
                $lines[] = "- **{$label}:** {$value}";
            }
        }

        $bullets = $meta->summary_bullets ?? [];
        if (! empty($bullets)) {
            $lines[] = '';
            $lines[] = '### Pontos-Chave';
            $lines[] = '';
            foreach ($bullets as $bullet) {
                $clean = trim($bullet);
                if ($clean !== '') {
                    $lines[] = '- ' . $this->sanitize($clean);
                }
            }
        }

        $lines[] = '';

        return $this->normalizeLineBreaks(implode("\n", $lines));
    }

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
            foreach ($categories as $category) {
                $fields[] = '  - ' . $this->yamlString($category);
            }
        }

        $fields[] = '---';

        return implode("\n", $fields);
    }

    private function buildMetaLine(NewsItem $item): string
    {
        $parts = [];

        $sourceName = $item->source?->name ?? 'Fonte desconhecida';
        $parts[] = '**Fonte:** ' . $this->sanitize($sourceName);

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
        $escaped = str_replace('"', '\\"', $value);

        return '"' . $escaped . '"';
    }

    private function normalizeAiValue(mixed $value): ?string
    {
        if (is_string($value)) {
            $trimmed = trim($value);

            return $trimmed !== '' ? $trimmed : null;
        }

        if (is_array($value)) {
            $items = array_filter(array_map(
                static fn ($item) => trim((string) $item),
                $value
            ));

            $joined = implode(', ', $items);

            return $joined !== '' ? $joined : null;
        }

        return null;
    }

    private function publicCorsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Origin, Content-Type, Accept, Cache-Control, If-Modified-Since, If-None-Match',
            'Access-Control-Expose-Headers' => 'Content-Type, Cache-Control, ETag, Last-Modified, X-Request-Id, X-Trace-Id',
            'Access-Control-Max-Age' => '86400',
        ];
    }
}
