<?php

use App\Modules\Roteiros\Http\Controllers\CategoriaController;
use App\Modules\Roteiros\Http\Controllers\GavetaController;
use App\Modules\Roteiros\Http\Controllers\RoteiroController;
use App\Modules\Roteiros\Http\Controllers\StatusMateriaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Roteiros Routes — /api/v1
|--------------------------------------------------------------------------
| Golden Module 🏆 — Use este padrão para todos os módulos futuros.
*/

Route::middleware('auth:sanctum')->group(function () {

    // ── Roteiros ─────────────────────────────────────────
    Route::prefix('roteiros')->group(function () {
        Route::get('/', [RoteiroController::class, 'index'])->name('roteiros.index');
        Route::post('/', [RoteiroController::class, 'store'])->name('roteiros.store');

        // Audit logs — MUST come before {id} wildcard
        Route::get('/logs-by-date', [RoteiroController::class, 'logsByDate'])->name('roteiros.logsByDate');

        Route::get('/{id}', [RoteiroController::class, 'show'])->name('roteiros.show');
        Route::put('/{id}', [RoteiroController::class, 'update'])->name('roteiros.update');
        Route::delete('/{id}', [RoteiroController::class, 'destroy'])->name('roteiros.destroy');
        Route::post('/{id}/duplicate', [RoteiroController::class, 'duplicate'])->name('roteiros.duplicate');

        // Find or create roteiro for a date (auto-generates 12 empty matérias)
        Route::post('/find-or-create', [RoteiroController::class, 'findOrCreate'])->name('roteiros.findOrCreate');

        // Matérias (nested) — reorder MUST come before {materiaId} wildcard
        Route::put('/{roteiroId}/materias/reorder', [RoteiroController::class, 'reorderMaterias'])->name('roteiros.materias.reorder');
        Route::post('/{roteiroId}/materias', [RoteiroController::class, 'addMateria'])->name('roteiros.materias.store');
        Route::get('/{roteiroId}/materias/{materiaId}/logs', [RoteiroController::class, 'materiaLogs'])->name('roteiros.materias.logs');
        Route::put('/{roteiroId}/materias/{materiaId}', [RoteiroController::class, 'updateMateria'])->name('roteiros.materias.update');
        Route::delete('/{roteiroId}/materias/{materiaId}', [RoteiroController::class, 'deleteMateria'])->name('roteiros.materias.destroy');
    });

    // ── Categorias ───────────────────────────────────────
    Route::prefix('categorias')->group(function () {
        Route::get('/', [CategoriaController::class, 'index'])->name('categorias.index');
        Route::post('/', [CategoriaController::class, 'store'])->name('categorias.store');
        Route::get('/{id}', [CategoriaController::class, 'show'])->name('categorias.show');
        Route::put('/{id}', [CategoriaController::class, 'update'])->name('categorias.update');
        Route::delete('/{id}', [CategoriaController::class, 'destroy'])->name('categorias.destroy');
    });

    // ── Status Matérias ─────────────────────────────────
    Route::prefix('status-materias')->group(function () {
        Route::get('/', [StatusMateriaController::class, 'index'])->name('status-materias.index');
        Route::post('/', [StatusMateriaController::class, 'store'])->name('status-materias.store');
        Route::get('/{id}', [StatusMateriaController::class, 'show'])->name('status-materias.show');
        Route::put('/{id}', [StatusMateriaController::class, 'update'])->name('status-materias.update');
        Route::delete('/{id}', [StatusMateriaController::class, 'destroy'])->name('status-materias.destroy');
    });

    // ── Gavetas ──────────────────────────────────────────
    Route::prefix('gavetas')->group(function () {
        Route::get('/', [GavetaController::class, 'index'])->name('gavetas.index');
        Route::post('/', [GavetaController::class, 'store'])->name('gavetas.store');
        Route::get('/{id}/logs', [GavetaController::class, 'logs'])->name('gavetas.logs');
        Route::get('/{id}', [GavetaController::class, 'show'])->name('gavetas.show');
        Route::put('/{id}', [GavetaController::class, 'update'])->name('gavetas.update');
        Route::delete('/{id}', [GavetaController::class, 'destroy'])->name('gavetas.destroy');
    });
});
