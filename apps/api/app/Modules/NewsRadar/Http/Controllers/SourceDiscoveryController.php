<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SourceDiscoveryController extends Controller
{
    public function discover(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'Source discover — not yet implemented'], 501);
    }

    public function status(string $runId): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'Discovery status — not yet implemented'], 501);
    }

    public function preview(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'Source preview — not yet implemented'], 501);
    }

    public function testSelector(Request $request): JsonResponse
    {
        // TODO: Phase 4
        return response()->json(['message' => 'Test selector — not yet implemented'], 501);
    }
}
