<?php

use App\Modules\Enquetes\Http\Controllers\Public\EmbedController;
use App\Modules\Enquetes\Http\Controllers\Public\PollMediaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Catch-All
|--------------------------------------------------------------------------
| Serve the React SPA index.html for all non-API routes.
| API routes are handled by api.php under /api/v1/* prefix.
| Static assets (JS, CSS, images) are served directly by the web server.
*/

Route::get('/media/enquetes/options/{optionPublicId}/{conversion?}', [PollMediaController::class, 'optionImage'])
    ->name('enquetes.option-media');
Route::get('/embed/enquetes/{placementPublicId}/loader.js', [EmbedController::class, 'loader'])
    ->name('enquetes.embed.loader');
Route::get('/embed/enquetes/{placementPublicId}', [EmbedController::class, 'show'])
    ->name('enquetes.embed.show');

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
