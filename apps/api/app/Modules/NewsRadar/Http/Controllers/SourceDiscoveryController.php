<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Models\SourceDiscoveryRun;
use App\Modules\NewsRadar\Services\FeedParserService;
use App\Modules\NewsRadar\Services\FeedQualityScorerService;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\ListingDiscoveryService;
use App\Modules\NewsRadar\Services\UrlNormalizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\DomCrawler\Crawler;

class SourceDiscoveryController extends Controller
{
    public function discover(
        Request $request,
        HttpFetchService $httpFetch,
        FeedParserService $feedParser,
        FeedQualityScorerService $feedScorer,
    ): JsonResponse {
        $validated = $request->validate([
            'url' => 'required|url',
        ]);

        $run = SourceDiscoveryRun::create([
            'requested_url' => $validated['url'],
            'status' => 'running',
            'started_at' => now(),
        ]);

        // Synchronous discovery (could be async via Job for long-running)
        try {
            $url = $validated['url'];
            $result = [];

            // 1. Try to find RSS feed
            $pageResult = $httpFetch->fetch($url);
            $feedUrl = null;

            if ($pageResult->success) {
                $feedUrl = $this->findFeedUrl($pageResult->body, $url);
            }

            if ($feedUrl) {
                $feedResult = $feedParser->parseFromUrl($feedUrl);
                if ($feedResult->success && $feedResult->count() > 0) {
                    $qualityScore = $feedScorer->score($feedResult->items);
                    $result['feed'] = [
                        'url' => $feedUrl,
                        'title' => $feedResult->feedTitle,
                        'items_count' => $feedResult->count(),
                        'quality' => $qualityScore->toArray(),
                        'suggested_fetch_detail_mode' => $feedScorer->suggestFetchDetailMode(
                            $qualityScore->profile,
                            $qualityScore->flags,
                            $qualityScore->fieldCoverage,
                        ),
                        'preview_items' => array_map(fn ($item) => [
                            'title' => $item->title,
                            'url' => $item->normalizedUrl,
                            'date' => $item->publishedAtRaw,
                            'author' => $item->authorRaw,
                            'has_body' => !empty($item->bodyHtml) && mb_strlen($item->bodyHtml) > 200,
                            'has_image' => !empty($item->heroImageUrl),
                        ], array_slice($feedResult->items, 0, 3)),
                    ];
                }
            }

            // 2. Try sitemap
            $sitemapUrl = $this->findSitemapUrl($url);
            if ($sitemapUrl) {
                $sitemapResult = $httpFetch->fetchXml($sitemapUrl);
                if ($sitemapResult->success) {
                    $result['sitemap'] = [
                        'url' => $sitemapUrl,
                        'detected' => true,
                    ];
                }
            }

            // 3. Basic page analysis
            if ($pageResult->success) {
                $result['page'] = [
                    'title' => $this->extractPageTitle($pageResult->body),
                    'has_feed' => !empty($feedUrl),
                    'detected_cms' => $this->detectCms($pageResult->body),
                ];
            }

            $run->update([
                'status' => 'completed',
                'finished_at' => now(),
                'result_json' => $result,
            ]);

            return response()->json([
                'run_id' => $run->id,
                'status' => 'completed',
                'result' => $result,
            ]);

        } catch (\Throwable $e) {
            $run->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'run_id' => $run->id,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function status(string $runId): JsonResponse
    {
        $run = SourceDiscoveryRun::findOrFail($runId);

        return response()->json([
            'run_id' => $run->id,
            'status' => $run->status,
            'result' => $run->result_json,
            'error' => $run->error_message,
            'started_at' => $run->started_at,
            'finished_at' => $run->finished_at,
        ]);
    }

    public function preview(
        Request $request,
        FeedParserService $feedParser,
        HttpFetchService $httpFetch,
        ListingDiscoveryService $listingDiscovery,
    ): JsonResponse {
        $validated = $request->validate([
            'mode' => 'required|in:feed,html_listing',
            'url' => 'required|url',
            'config' => 'nullable|array',
        ]);

        $mode = $validated['mode'];
        $url = $validated['url'];
        $config = $validated['config'] ?? [];

        $preview = [];

        if ($mode === 'feed') {
            $result = $feedParser->parseFromUrl($url);
            if ($result->success) {
                $preview = array_map(fn ($item) => [
                    'title' => $item->title,
                    'url' => $item->normalizedUrl,
                    'date' => $item->publishedAtRaw,
                    'author' => $item->authorRaw,
                    'excerpt' => $item->excerpt,
                    'image' => $item->heroImageUrl,
                ], array_slice($result->items, 0, 3));
            }
        } elseif ($mode === 'html_listing') {
            $config['listing_urls'] = [$url];
            $items = $listingDiscovery->discover($config, 0);
            $preview = array_map(fn ($item) => [
                'title' => $item->title,
                'url' => $item->normalizedUrl,
                'image' => $item->imageUrl,
                'excerpt' => $item->excerpt,
            ], array_slice($items, 0, 3));
        }

        return response()->json(['preview' => $preview]);
    }

    public function testSelector(
        Request $request,
        HttpFetchService $httpFetch,
    ): JsonResponse {
        $validated = $request->validate([
            'url' => 'required|url',
            'selector' => 'required|string',
            'run_id' => 'nullable|uuid',
        ]);

        $result = $httpFetch->fetch($validated['url']);
        if (!$result->success) {
            return response()->json(['error' => 'Failed to fetch URL'], 422);
        }

        try {
            $crawler = new Crawler($result->body);
            $matches = $crawler->filter($validated['selector']);

            $extracted = [];
            $matches->each(function (Crawler $node) use (&$extracted) {
                $extracted[] = [
                    'text' => mb_substr(trim($node->text('')), 0, 200),
                    'html' => mb_substr($node->html(), 0, 500),
                    'tag' => $node->nodeName(),
                ];
            });

            // Save snapshot if run_id provided
            if ($validated['run_id'] ?? null) {
                $run = SourceDiscoveryRun::find($validated['run_id']);
                $run?->addSelectorTestSnapshot($validated['url'], $validated['selector'], $extracted);
            }

            return response()->json([
                'selector' => $validated['selector'],
                'matches' => count($extracted),
                'results' => array_slice($extracted, 0, 10),
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Invalid selector: ' . $e->getMessage(),
            ], 422);
        }
    }

    // ── Private helpers ────────────────────────────

    private function findFeedUrl(string $html, string $baseUrl): ?string
    {
        try {
            $crawler = new Crawler($html);

            // Check <link> tags for RSS/Atom
            $feedLinks = $crawler->filter('link[type="application/rss+xml"], link[type="application/atom+xml"]');
            if ($feedLinks->count() > 0) {
                $href = $feedLinks->first()->attr('href');
                if ($href && !str_starts_with($href, 'http')) {
                    $href = rtrim($baseUrl, '/') . '/' . ltrim($href, '/');
                }
                return $href;
            }
        } catch (\Throwable) {
            // silent
        }

        // Fallback: try common feed paths
        $commonPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml'];
        foreach ($commonPaths as $path) {
            $feedUrl = rtrim($baseUrl, '/') . $path;
            // Just return the first common path as a suggestion
            return $feedUrl;
        }

        return null;
    }

    private function findSitemapUrl(string $baseUrl): string
    {
        return rtrim($baseUrl, '/') . '/sitemap.xml';
    }

    private function extractPageTitle(string $html): ?string
    {
        try {
            $crawler = new Crawler($html);
            $title = $crawler->filter('title');
            return $title->count() > 0 ? trim($title->first()->text('')) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function detectCms(string $html): ?string
    {
        if (str_contains($html, 'wp-content') || str_contains($html, 'WordPress')) {
            return 'wordpress';
        }
        if (str_contains($html, 'Joomla')) return 'joomla';
        if (str_contains($html, 'Drupal')) return 'drupal';
        if (str_contains($html, 'Blogger')) return 'blogger';
        return null;
    }
}
