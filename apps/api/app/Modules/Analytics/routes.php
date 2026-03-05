<?php

use App\Modules\Analytics\Http\Controllers\AnalyticsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('analytics')->group(function () {
    Route::get('/overview', [AnalyticsController::class, 'overview'])->name('analytics.overview');
    Route::get('/kpis', [AnalyticsController::class, 'kpis'])->name('analytics.kpis');
    Route::get('/top-pages', [AnalyticsController::class, 'topPages'])->name('analytics.topPages');
    Route::get('/cities', [AnalyticsController::class, 'cities'])->name('analytics.cities');
    Route::get('/acquisition', [AnalyticsController::class, 'acquisition'])->name('analytics.acquisition');
    Route::get('/realtime', [AnalyticsController::class, 'realtime'])->name('analytics.realtime');
    Route::get('/timeseries', [AnalyticsController::class, 'timeseries'])->name('analytics.timeseries');
});
