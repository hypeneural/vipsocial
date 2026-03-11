<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Jobs\FetchNewsSourceJob;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsSourceRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class NewsSourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NewsSource::query();

        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('source_type')) {
            $query->where('source_type', $request->input('source_type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('homepage_url', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('failing')) {
            $query->where('consecutive_failures', '>', 0);
        }

        $sortField = $request->input('sort', 'name');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'last_sync_at', 'success_rate', 'consecutive_failures', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $sources = $query->paginate($request->input('per_page', 20));

        return response()->json($sources);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'homepage_url' => 'required|url|unique:news_sources,homepage_url',
            'source_type' => ['required', Rule::in(['portal', 'prefeitura', 'blog', 'agencia', 'whatsapp'])],
            'discovery_mode' => ['required', Rule::in(['auto', 'feed', 'sitemap', 'html_listing'])],
            'fetch_detail_mode' => [Rule::in(['never', 'when_incomplete', 'always'])],
            'feed_quality_profile' => ['nullable', Rule::in(['full', 'partial', 'teaser_only'])],
            'source_preset' => 'nullable|string|max:100',
            'crawling_config' => 'nullable|array',
            'throttle_config' => 'nullable|array',
            'timezone_default' => 'nullable|string|max:50',
            'date_formats' => 'nullable|array',
            'render_js_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $validated['fetch_detail_mode'] = $validated['fetch_detail_mode'] ?? 'when_incomplete';
        $validated['active'] = true;
        $validated['next_sync_at'] = now();

        $source = NewsSource::create($validated);

        return response()->json($source, 201);
    }

    public function show(int $id): JsonResponse
    {
        $source = NewsSource::findOrFail($id);
        $source->load(['runs' => fn ($q) => $q->limit(10)]);

        $source->loadCount(['items', 'rawItems']);

        return response()->json($source);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $source = NewsSource::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'homepage_url' => ['url', Rule::unique('news_sources')->ignore($source->id)],
            'active' => 'boolean',
            'source_type' => [Rule::in(['portal', 'prefeitura', 'blog', 'agencia', 'whatsapp'])],
            'discovery_mode' => [Rule::in(['auto', 'feed', 'sitemap', 'html_listing'])],
            'fetch_detail_mode' => [Rule::in(['never', 'when_incomplete', 'always'])],
            'feed_quality_profile' => ['nullable', Rule::in(['full', 'partial', 'teaser_only'])],
            'source_preset' => 'nullable|string|max:100',
            'crawling_config' => 'nullable|array',
            'throttle_config' => 'nullable|array',
            'timezone_default' => 'string|max:50',
            'date_formats' => 'nullable|array',
            'render_js_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $source->update($validated);

        return response()->json($source);
    }

    public function destroy(int $id): JsonResponse
    {
        $source = NewsSource::findOrFail($id);
        $source->delete(); // Soft delete

        return response()->json(['message' => 'Source deactivated.']);
    }

    public function sync(int $id): JsonResponse
    {
        $source = NewsSource::findOrFail($id);

        if (!$source->active) {
            return response()->json(['message' => 'Source is not active.'], 422);
        }

        if ($source->isLocked()) {
            return response()->json(['message' => 'Source is currently being synced.'], 409);
        }

        FetchNewsSourceJob::dispatch($source->id);

        return response()->json(['message' => 'Sync job dispatched.', 'source_id' => $source->id]);
    }

    public function runs(int $id): JsonResponse
    {
        $source = NewsSource::findOrFail($id);

        $runs = NewsSourceRun::where('news_source_id', $source->id)
            ->orderByDesc('started_at')
            ->paginate(20);

        return response()->json($runs);
    }
}
