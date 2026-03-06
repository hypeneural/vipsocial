<?php

use App\Modules\Social\Http\Controllers\SocialMetricsController;
use App\Modules\Social\Http\Controllers\SocialProfilesController;
use Illuminate\Support\Facades\Route;

Route::get('social/profiles/{id}/avatar', [SocialProfilesController::class, 'avatar']);

Route::middleware('auth:sanctum')->prefix('social')->group(function () {
    Route::get('/dashboard', [SocialMetricsController::class, 'dashboard']);
    Route::get('/profiles/metrics', [SocialMetricsController::class, 'profilesMetrics']);
    Route::get('/profiles/{id}/metrics', [SocialMetricsController::class, 'show']);

    Route::get('/profiles', [SocialProfilesController::class, 'index']);
    Route::post('/profiles', [SocialProfilesController::class, 'store']);
    Route::patch('/profiles/{id}', [SocialProfilesController::class, 'update']);
    Route::post('/profiles/{id}/sync', [SocialProfilesController::class, 'sync']);
});
