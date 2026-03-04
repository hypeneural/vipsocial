<?php

use App\Modules\Config\Http\Controllers\AuditLogController;
use App\Modules\Config\Http\Controllers\EquipamentoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Config Routes — /api/v1
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ── Equipment Categories ──────────────────────────
    Route::prefix('equipamentos/categorias')->group(function () {
        Route::get('/', [EquipamentoController::class, 'categories'])->name('equipamentos.categorias.index');
        Route::post('/', [EquipamentoController::class, 'storeCategory'])->name('equipamentos.categorias.store');
        Route::put('/{id}', [EquipamentoController::class, 'updateCategory'])->name('equipamentos.categorias.update');
        Route::delete('/{id}', [EquipamentoController::class, 'destroyCategory'])->name('equipamentos.categorias.destroy');
    });

    // ── Equipment Statuses ────────────────────────────
    Route::prefix('equipamentos/statuses')->group(function () {
        Route::get('/', [EquipamentoController::class, 'statuses'])->name('equipamentos.statuses.index');
        Route::post('/', [EquipamentoController::class, 'storeStatus'])->name('equipamentos.statuses.store');
        Route::put('/{id}', [EquipamentoController::class, 'updateStatus'])->name('equipamentos.statuses.update');
        Route::delete('/{id}', [EquipamentoController::class, 'destroyStatus'])->name('equipamentos.statuses.destroy');
    });

    // ── Equipment ─────────────────────────────────────
    Route::prefix('equipamentos')->group(function () {
        Route::get('/stats', [EquipamentoController::class, 'stats'])->name('equipamentos.stats');
        Route::get('/', [EquipamentoController::class, 'index'])->name('equipamentos.index');
        Route::post('/', [EquipamentoController::class, 'store'])->name('equipamentos.store');
        Route::get('/{id}', [EquipamentoController::class, 'show'])->name('equipamentos.show');
        Route::put('/{id}', [EquipamentoController::class, 'update'])->name('equipamentos.update');
        Route::delete('/{id}', [EquipamentoController::class, 'destroy'])->name('equipamentos.destroy');
        Route::patch('/{id}/status', [EquipamentoController::class, 'changeEquipmentStatus'])->name('equipamentos.updateStatus');
    });

    // ── Audit Logs ────────────────────────────────────────
    Route::prefix('audit')->group(function () {
        Route::get('/logs', [AuditLogController::class, 'index'])->name('audit.logs.index');
        Route::get('/logs/{id}', [AuditLogController::class, 'show'])->name('audit.logs.show');
        Route::get('/stats', [AuditLogController::class, 'stats'])->name('audit.stats');
        Route::get('/users', [AuditLogController::class, 'users'])->name('audit.users');
        Route::get('/export', [AuditLogController::class, 'export'])->name('audit.export');
    });
});
