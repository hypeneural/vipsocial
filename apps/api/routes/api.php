<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (Global)
|--------------------------------------------------------------------------
|
| Rotas globais da API que não pertencem a nenhum módulo específico.
| As rotas dos módulos são registradas automaticamente via ModuleServiceProvider.
| Prefixo: /api (sem /v1 — cada módulo define seu próprio prefixo v1)
|
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});
