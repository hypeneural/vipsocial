<?php

use App\Modules\NewsRadar\Http\Controllers\NewsItemController;
use App\Modules\NewsRadar\Http\Controllers\NewsSourceController;
use App\Modules\NewsRadar\Http\Controllers\SourceDiscoveryController;
use App\Modules\NewsRadar\Http\Controllers\NewsItemMarkdownController;
use Illuminate\Support\Facades\Route;

// ── Public News Markdown (no auth) ─────────────
Route::get('/public/news/{publicToken}/markdown', [NewsItemMarkdownController::class, 'show'])
    ->where('publicToken', '[0-9a-f\-]{36}')
    ->name('news-radar.public.markdown');

Route::middleware('auth:sanctum')->prefix('news-radar')->group(function () {

    // ── Source Discovery (Wizard) ─────────────────
    Route::post('/sources/discover', [SourceDiscoveryController::class, 'discover'])
        ->name('news-radar.sources.discover');
    Route::get('/sources/discover/{runId}/status', [SourceDiscoveryController::class, 'status'])
        ->name('news-radar.sources.discover.status');
    Route::post('/sources/preview', [SourceDiscoveryController::class, 'preview'])
        ->name('news-radar.sources.preview');
    Route::post('/sources/test-selector', [SourceDiscoveryController::class, 'testSelector'])
        ->name('news-radar.sources.test-selector');

    // ── Sources CRUD ──────────────────────────────
    Route::get('/sources', [NewsSourceController::class, 'index'])->name('news-radar.sources.index');
    Route::post('/sources', [NewsSourceController::class, 'store'])->name('news-radar.sources.store');
    Route::get('/sources/{id}', [NewsSourceController::class, 'show'])->name('news-radar.sources.show');
    Route::put('/sources/{id}', [NewsSourceController::class, 'update'])->name('news-radar.sources.update');
    Route::delete('/sources/{id}', [NewsSourceController::class, 'destroy'])->name('news-radar.sources.destroy');
    Route::post('/sources/{id}/sync', [NewsSourceController::class, 'sync'])->name('news-radar.sources.sync');
    Route::get('/sources/{id}/runs', [NewsSourceController::class, 'runs'])->name('news-radar.sources.runs');

    // ── News Items ────────────────────────────────
    Route::get('/items', [NewsItemController::class, 'index'])->name('news-radar.items.index');
    Route::get('/items/{id}', [NewsItemController::class, 'show'])->name('news-radar.items.show');
    Route::get('/items/{id}/related', [NewsItemController::class, 'related'])->name('news-radar.items.related');

    // ── Dashboard ─────────────────────────────────
    Route::get('/dashboard', [NewsItemController::class, 'dashboard'])->name('news-radar.dashboard');
});
