<?php

use App\Modules\Pessoas\Http\Controllers\ColaboradorController;
use App\Modules\Pessoas\Http\Controllers\PermissaoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Pessoas Routes — /api/v1
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ── Permissões ────────────────────────────────────────
    Route::prefix('pessoas/permissoes')->group(function () {
        Route::get('/', [PermissaoController::class, 'index'])->name('pessoas.permissoes.index');

        // Role CRUD
        Route::post('/roles', [PermissaoController::class, 'storeRole'])->name('pessoas.permissoes.roles.store');

        // User-level permission overrides (static routes BEFORE {role})
        Route::get('/users/{id}/permissions', [PermissaoController::class, 'userPermissions'])->name('pessoas.permissoes.user');
        Route::put('/users/{id}/permissions', [PermissaoController::class, 'updateUserPermissions'])->name('pessoas.permissoes.user.update');

        // Dynamic role routes
        Route::get('/{role}', [PermissaoController::class, 'show'])->name('pessoas.permissoes.show');
        Route::put('/{role}', [PermissaoController::class, 'update'])->name('pessoas.permissoes.update');
        Route::patch('/{role}', [PermissaoController::class, 'updateRole'])->name('pessoas.permissoes.roles.update');
        Route::delete('/{role}', [PermissaoController::class, 'destroyRole'])->name('pessoas.permissoes.roles.destroy');
        Route::get('/{role}/users', [PermissaoController::class, 'roleUsers'])->name('pessoas.permissoes.roles.users');
    });

    // ── Colaboradores ────────────────────────────────────
    Route::prefix('pessoas/colaboradores')->group(function () {
        Route::get('/', [ColaboradorController::class, 'index'])->name('pessoas.colaboradores.index');
        Route::post('/', [ColaboradorController::class, 'store'])->name('pessoas.colaboradores.store');
        Route::get('/stats', [ColaboradorController::class, 'stats'])->name('pessoas.colaboradores.stats');
        Route::get('/aniversarios', [ColaboradorController::class, 'aniversarios'])->name('pessoas.colaboradores.aniversarios');
        Route::get('/{id}', [ColaboradorController::class, 'show'])->name('pessoas.colaboradores.show');
        Route::put('/{id}', [ColaboradorController::class, 'update'])->name('pessoas.colaboradores.update');
        Route::delete('/{id}', [ColaboradorController::class, 'destroy'])->name('pessoas.colaboradores.destroy');
    });
});
