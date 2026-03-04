<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Externas\Http\Controllers\ExternaController;

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('externas')->group(function () {
        // ── Categories ─────────────────────────
        Route::get('/categorias', [ExternaController::class, 'categories'])->name('externas.categorias.index');
        Route::post('/categorias', [ExternaController::class, 'storeCategory'])->name('externas.categorias.store');
        Route::put('/categorias/{id}', [ExternaController::class, 'updateCategory'])->name('externas.categorias.update');
        Route::delete('/categorias/{id}', [ExternaController::class, 'destroyCategory'])->name('externas.categorias.destroy');

        // ── Statuses ───────────────────────────
        Route::get('/statuses', [ExternaController::class, 'statuses'])->name('externas.statuses.index');
        Route::post('/statuses', [ExternaController::class, 'storeStatus'])->name('externas.statuses.store');
        Route::put('/statuses/{id}', [ExternaController::class, 'updateEventStatus'])->name('externas.statuses.update');
        Route::delete('/statuses/{id}', [ExternaController::class, 'destroyStatus'])->name('externas.statuses.destroy');

        // ── Equipment Availability ──────────────
        Route::get('/equipamentos/disponibilidade', [ExternaController::class, 'equipmentAvailability'])->name('externas.equipamentos.disponibilidade');
        Route::get('/equipamentos/{id}/agenda', [ExternaController::class, 'equipmentSchedule'])->name('externas.equipamentos.agenda');

        // ── Stats & Upcoming ───────────────────
        Route::get('/stats', [ExternaController::class, 'stats'])->name('externas.stats');
        Route::get('/proximos/{days?}', [ExternaController::class, 'upcoming'])->name('externas.upcoming');

        // ── Events CRUD ────────────────────────
        Route::get('/', [ExternaController::class, 'index'])->name('externas.index');
        Route::post('/', [ExternaController::class, 'store'])->name('externas.store');
        Route::get('/{id}', [ExternaController::class, 'show'])->name('externas.show');
        Route::put('/{id}', [ExternaController::class, 'update'])->name('externas.update');
        Route::delete('/{id}', [ExternaController::class, 'destroy'])->name('externas.destroy');
        Route::patch('/{id}/status', [ExternaController::class, 'changeStatus'])->name('externas.changeStatus');
        Route::patch('/{id}/checklist', [ExternaController::class, 'updateChecklist'])->name('externas.updateChecklist');
        Route::get('/{id}/logs', [ExternaController::class, 'logs'])->name('externas.logs');
    });
});
