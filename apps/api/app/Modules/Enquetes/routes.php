<?php

use App\Modules\Enquetes\Http\Controllers\Admin\PollController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollMetricsController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollExportController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollModerationController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollOptionMediaController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollPlacementController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollSiteController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollSiteDomainController;
use App\Modules\Enquetes\Http\Controllers\Admin\PollVoteLogController;
use App\Modules\Enquetes\Http\Controllers\Public\WidgetBootController;
use App\Modules\Enquetes\Http\Controllers\Public\WidgetEventController;
use App\Modules\Enquetes\Http\Controllers\Public\WidgetResultController;
use App\Modules\Enquetes\Http\Controllers\Public\WidgetSessionController;
use App\Modules\Enquetes\Http\Controllers\Public\WidgetVoteController;
use Illuminate\Support\Facades\Route;

Route::prefix('public/enquetes')->group(function () {
    Route::get('/placements/{placementPublicId}/boot', [WidgetBootController::class, 'show'])
        ->middleware('throttle:' . (int) config('enquetes.rate_limits.boot', 60) . ',1');
    Route::post('/widget-sessions', [WidgetSessionController::class, 'store'])
        ->middleware('throttle:' . (int) config('enquetes.rate_limits.sessions', 120) . ',1');
    Route::get('/{pollPublicId}/results', [WidgetResultController::class, 'show'])
        ->middleware('throttle:' . (int) config('enquetes.rate_limits.boot', 60) . ',1');
    Route::post('/{pollPublicId}/vote', [WidgetVoteController::class, 'store'])
        ->middleware('throttle:' . (int) config('enquetes.rate_limits.vote', 20) . ',1');
    Route::post('/{pollPublicId}/events', [WidgetEventController::class, 'store'])
        ->middleware('throttle:' . (int) config('enquetes.rate_limits.events', 120) . ',1');
});

Route::middleware('auth:sanctum')->prefix('enquetes')->group(function () {
    Route::get('/dashboard/overview', [PollMetricsController::class, 'overview']);
    Route::get('/{id}/dashboard', [PollMetricsController::class, 'dashboard']);
    Route::get('/{id}/metrics/overview', [PollMetricsController::class, 'pollOverview']);
    Route::get('/{id}/metrics/timeseries', [PollMetricsController::class, 'timeseries']);
    Route::get('/{id}/metrics/options', [PollMetricsController::class, 'options']);
    Route::get('/{id}/metrics/placements', [PollMetricsController::class, 'placements']);
    Route::get('/{id}/metrics/locations', [PollMetricsController::class, 'locations']);
    Route::get('/{id}/metrics/providers', [PollMetricsController::class, 'providers']);
    Route::get('/{id}/metrics/devices', [PollMetricsController::class, 'devices']);
    Route::get('/{id}/metrics/browsers', [PollMetricsController::class, 'browsers']);

    Route::get('/{id}/vote-attempts', [PollVoteLogController::class, 'attempts']);
    Route::get('/{id}/votes', [PollVoteLogController::class, 'votes']);
    Route::get('/vote-attempts/{attemptId}', [PollVoteLogController::class, 'showAttempt']);
    Route::get('/votes/{voteId}', [PollVoteLogController::class, 'showVote']);

    Route::get('/sites', [PollSiteController::class, 'index']);
    Route::post('/sites', [PollSiteController::class, 'store']);
    Route::put('/sites/{id}', [PollSiteController::class, 'update']);
    Route::get('/sites/{id}/domains', [PollSiteDomainController::class, 'index']);
    Route::post('/sites/{id}/domains', [PollSiteDomainController::class, 'store']);
    Route::put('/domains/{id}', [PollSiteDomainController::class, 'update']);
    Route::delete('/domains/{id}', [PollSiteDomainController::class, 'destroy']);

    Route::post('/options/{id}/image', [PollOptionMediaController::class, 'store']);
    Route::delete('/options/{id}/image', [PollOptionMediaController::class, 'destroy']);

    Route::get('/', [PollController::class, 'index']);
    Route::post('/', [PollController::class, 'store']);
    Route::get('/{id}', [PollController::class, 'show']);
    Route::put('/{id}', [PollController::class, 'update']);
    Route::delete('/{id}', [PollController::class, 'destroy']);
    Route::patch('/{id}/status', [PollController::class, 'updateStatus']);
    Route::post('/{id}/duplicate', [PollController::class, 'duplicate']);
    Route::post('/{id}/pause', [PollController::class, 'pause']);
    Route::post('/{id}/close', [PollController::class, 'close']);
    Route::post('/{id}/reopen', [PollController::class, 'reopen']);
    Route::get('/{id}/placements', [PollPlacementController::class, 'index']);
    Route::post('/{id}/placements', [PollPlacementController::class, 'store']);
    Route::put('/placements/{placementId}', [PollPlacementController::class, 'update']);
    Route::patch('/placements/{placementId}/toggle', [PollPlacementController::class, 'toggle']);

    Route::post('/votes/{voteId}/invalidate', [PollModerationController::class, 'invalidateVote']);
    Route::post('/{id}/rebuild-snapshots', [PollModerationController::class, 'rebuildSnapshots']);

    Route::get('/{id}/export/votes.csv', [PollExportController::class, 'votesCsv']);
    Route::get('/{id}/export/vote-attempts.csv', [PollExportController::class, 'voteAttemptsCsv']);
    Route::get('/{id}/export/options-summary.csv', [PollExportController::class, 'optionsSummaryCsv']);
    Route::get('/{id}/export/placements-summary.csv', [PollExportController::class, 'placementsSummaryCsv']);
});
