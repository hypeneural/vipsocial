<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NewsItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NewsItem::with(['source:id,name,source_type', 'aiMetadata:id,news_item_id,city,urgency,relevance_score,news_theme_id']);

        if ($request->filled('source_id')) {
            $query->where('news_source_id', $request->input('source_id'));
        }

        if ($request->filled('extraction_status')) {
            $query->where('extraction_status', $request->input('extraction_status'));
        }

        if ($request->filled('enrichment_status')) {
            $query->where('enrichment_status', $request->input('enrichment_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where('published_at_utc', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('published_at_utc', '<=', $request->input('date_to'));
        }

        if ($request->filled('city')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('city', $request->input('city')));
        }

        if ($request->filled('theme_id')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('news_theme_id', $request->input('theme_id')));
        }

        if ($request->filled('urgency')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('urgency', $request->input('urgency')));
        }

        // Delta polling for streaming: only items with id > after_id
        if ($request->filled('after_id')) {
            $query->where('id', '>', (int) $request->input('after_id'));
        }

        $query->orderByDesc('published_at_utc');

        $items = $query->paginate($request->input('per_page', 20));

        return response()->json($items);
    }

    public function show(int $id): JsonResponse
    {
        $item = NewsItem::with([
            'source:id,name,homepage_url,source_type',
            'aiMetadata',
            'aiLogs',
            'media',
            'rawItem:id,raw_payload,first_seen_at,seen_count',
        ])->findOrFail($id);

        return response()->json($item);
    }

    public function related(int $id): JsonResponse
    {
        $item = NewsItem::findOrFail($id);

        // Basic related: same source, recent, similar categories
        $related = NewsItem::where('news_source_id', $item->news_source_id)
            ->where('id', '!=', $item->id)
            ->where('published_at_utc', '>=', now()->subDays(7))
            ->orderByDesc('published_at_utc')
            ->limit(5)
            ->get(['id', 'title', 'excerpt', 'hero_image_url', 'published_at_utc']);

        return response()->json(['data' => $related]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $data = [
            'total_sources' => NewsSource::active()->count(),
            'total_items' => NewsItem::count(),
            'items_today' => NewsItem::where('created_at', '>=', now()->startOfDay())->count(),
            'items_this_week' => NewsItem::where('created_at', '>=', now()->startOfWeek())->count(),
            'sources_with_failures' => NewsSource::active()->where('consecutive_failures', '>', 0)->count(),
            'sources_locked' => NewsSource::where('sync_locked_until', '>', now())->count(),

            'by_extraction_status' => NewsItem::selectRaw('extraction_status, count(*) as count')
                ->groupBy('extraction_status')
                ->pluck('count', 'extraction_status'),

            'by_enrichment_status' => NewsItem::selectRaw('enrichment_status, count(*) as count')
                ->groupBy('enrichment_status')
                ->pluck('count', 'enrichment_status'),

            'by_source' => NewsItem::selectRaw('news_source_id, count(*) as count')
                ->with('source:id,name')
                ->groupBy('news_source_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),

            'failing_sources' => NewsSource::active()
                ->where('consecutive_failures', '>', 0)
                ->orderByDesc('consecutive_failures')
                ->limit(5)
                ->get(['id', 'name', 'consecutive_failures', 'last_sync_at']),
        ];

        return response()->json($data);
    }
}
