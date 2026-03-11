<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NewsItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsItem index — not yet implemented'], 501);
    }

    public function show(int $id): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsItem show — not yet implemented'], 501);
    }

    public function related(int $id): JsonResponse
    {
        // TODO: Phase 5 (embeddings)
        return response()->json(['message' => 'NewsItem related — not yet implemented'], 501);
    }

    public function dashboard(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsRadar dashboard — not yet implemented'], 501);
    }
}
