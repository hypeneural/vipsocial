<?php

use App\Modules\UserAiPrompts\Http\Controllers\UserAiPromptTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('user/ai-prompts')->group(function () {
    Route::get('/variables', [UserAiPromptTemplateController::class, 'variables'])
        ->name('user-ai-prompts.variables');
    Route::put('/reorder', [UserAiPromptTemplateController::class, 'reorder'])
        ->name('user-ai-prompts.reorder');
    Route::post('/starter', [UserAiPromptTemplateController::class, 'starter'])
        ->name('user-ai-prompts.starter');

    Route::get('/', [UserAiPromptTemplateController::class, 'index'])
        ->name('user-ai-prompts.index');
    Route::post('/', [UserAiPromptTemplateController::class, 'store'])
        ->name('user-ai-prompts.store');
    Route::get('/{id}', [UserAiPromptTemplateController::class, 'show'])
        ->whereNumber('id')
        ->name('user-ai-prompts.show');
    Route::put('/{id}', [UserAiPromptTemplateController::class, 'update'])
        ->whereNumber('id')
        ->name('user-ai-prompts.update');
    Route::delete('/{id}', [UserAiPromptTemplateController::class, 'destroy'])
        ->whereNumber('id')
        ->name('user-ai-prompts.destroy');
    Route::put('/{id}/favorite', [UserAiPromptTemplateController::class, 'favorite'])
        ->whereNumber('id')
        ->name('user-ai-prompts.favorite');
    Route::post('/{id}/track-use', [UserAiPromptTemplateController::class, 'trackUse'])
        ->whereNumber('id')
        ->name('user-ai-prompts.track-use');
});
