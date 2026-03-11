<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NewsSourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // TODO: Phase 4 — Implement with QueryBuilder filters
        return response()->json(['message' => 'NewsSource index — not yet implemented'], 501);
    }

    public function store(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsSource store — not yet implemented'], 501);
    }

    public function show(int $id): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsSource show — not yet implemented'], 501);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsSource update — not yet implemented'], 501);
    }

    public function destroy(int $id): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsSource destroy — not yet implemented'], 501);
    }

    public function sync(int $id): JsonResponse
    {
        // TODO: Phase 3
        return response()->json(['message' => 'NewsSource sync — not yet implemented'], 501);
    }

    public function runs(int $id): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'NewsSource runs — not yet implemented'], 501);
    }
}
