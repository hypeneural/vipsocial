<?php

use App\Modules\Alertas\Http\Controllers\AlertController;
use App\Modules\Alertas\Http\Controllers\AlertDashboardController;
use App\Modules\Alertas\Http\Controllers\AlertDestinationController;
use App\Modules\Alertas\Http\Controllers\AlertLogController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('alertas')->group(function () {
    Route::get('/dashboard/stats', [AlertDashboardController::class, 'stats']);
    Route::get('/dashboard/next-firings', [AlertDashboardController::class, 'nextFirings']);
    Route::get('/dashboard/recent-logs', [AlertDashboardController::class, 'recentLogs']);
    Route::get('/logs', [AlertLogController::class, 'index']);
    Route::get('/dispatch-runs/{id}', [AlertLogController::class, 'showRun']);

    Route::get('/destinos', [AlertDestinationController::class, 'index']);
    Route::get('/destinos/{id}', [AlertDestinationController::class, 'show']);
    Route::post('/destinos', [AlertDestinationController::class, 'store']);
    Route::put('/destinos/{id}', [AlertDestinationController::class, 'update']);
    Route::delete('/destinos/{id}', [AlertDestinationController::class, 'destroy']);
    Route::patch('/destinos/{id}/toggle', [AlertDestinationController::class, 'toggle']);

    Route::get('/', [AlertController::class, 'index']);
    Route::get('/{id}', [AlertController::class, 'show']);
    Route::post('/', [AlertController::class, 'store']);
    Route::put('/{id}', [AlertController::class, 'update']);
    Route::delete('/{id}', [AlertController::class, 'destroy']);
    Route::patch('/{id}/toggle', [AlertController::class, 'toggle']);
    Route::post('/{id}/duplicate', [AlertController::class, 'duplicate']);
    Route::get('/{id}/logs', [AlertLogController::class, 'byAlert']);

    Route::middleware('idempotent')->group(function () {
        Route::post('/{id}/send', [AlertController::class, 'send']);
        Route::post('/logs/{logId}/retry', [AlertLogController::class, 'retry']);
    });
});
