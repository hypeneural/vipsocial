<?php

use App\Modules\Enquetes\Http\Controllers\Public\EmbedController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Catch-All
|--------------------------------------------------------------------------
| Serve the React SPA index.html for all non-API routes.
| API routes are handled by api.php under /api/v1/* prefix.
| Static assets (JS, CSS, images) are served directly by the web server.
*/

Route::get('/embed/enquetes/{placementPublicId}', [EmbedController::class, 'show']);

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Content-Type' => 'text/html',
        ]);
    }

    return response()->json([
        'message' => 'Frontend not built. Run: cd apps/web && pnpm build',
    ], 404);
})->where('any', '^(?!api).*$');
