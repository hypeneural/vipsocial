<?php

use App\Modules\WhatsApp\Http\Controllers\WhatsAppController;
use App\Modules\WhatsApp\Http\Controllers\WhatsAppGroupMetricsController;
use App\Modules\WhatsApp\Http\Controllers\WhatsAppGroupsController;
use App\Modules\WhatsApp\Http\Controllers\WhatsAppRaffleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('whatsapp')->group(function () {
    Route::get('/connection-state', [WhatsAppController::class, 'connectionState'])->name('whatsapp.connectionState');
    Route::get('/status', [WhatsAppController::class, 'status'])->name('whatsapp.status');
    Route::get('/qr-code/image', [WhatsAppController::class, 'qrCodeImage'])->name('whatsapp.qrcode.image');
    Route::get('/device', [WhatsAppController::class, 'deviceInfo'])->name('whatsapp.device');
    Route::get('/disconnect', [WhatsAppController::class, 'disconnect'])->name('whatsapp.disconnect');

    Route::get('/groups', [WhatsAppGroupsController::class, 'index'])->name('whatsapp.groups.index');
    Route::post('/groups', [WhatsAppGroupsController::class, 'store'])->name('whatsapp.groups.store');
    Route::patch('/groups/{groupId}', [WhatsAppGroupsController::class, 'update'])->name('whatsapp.groups.update');
    Route::post('/groups/{groupId}/sync', [WhatsAppGroupsController::class, 'sync'])->name('whatsapp.groups.sync');

    Route::get('/groups/{groupId}/metadata', [WhatsAppController::class, 'groupMetadata'])->name('whatsapp.groups.metadata');
    Route::get('/groups/{groupId}/light-metadata', [WhatsAppController::class, 'lightGroupMetadata'])->name('whatsapp.groups.lightMetadata');

    Route::get('/contacts', [WhatsAppController::class, 'contacts'])->name('whatsapp.contacts');
    Route::get('/chats', [WhatsAppController::class, 'chats'])->name('whatsapp.chats');
    Route::get('/groups/metrics/dashboard', [WhatsAppGroupMetricsController::class, 'dashboard'])->name('whatsapp.groups.metrics.dashboard');
    Route::get('/groups/metrics/overview', [WhatsAppGroupMetricsController::class, 'overview'])->name('whatsapp.groups.metrics.overview');
    Route::get('/groups/metrics/by-group', [WhatsAppGroupMetricsController::class, 'byGroup'])->name('whatsapp.groups.metrics.byGroup');
    Route::get('/groups/{groupId}/metrics', [WhatsAppGroupMetricsController::class, 'show'])->name('whatsapp.groups.metrics.show');

    Route::middleware('idempotent')->group(function () {
        Route::post('/send-text', [WhatsAppController::class, 'sendText'])->name('whatsapp.sendText');
        Route::post('/send-image', [WhatsAppController::class, 'sendImage'])->name('whatsapp.sendImage');
        Route::post('/send-link', [WhatsAppController::class, 'sendLink'])->name('whatsapp.sendLink');
    });

    Route::prefix('raffle')->middleware('throttle:raffle')->group(function () {
        Route::get('/draws', [WhatsAppRaffleController::class, 'index'])
            ->middleware('can:whatsapp.raffle.history')
            ->name('whatsapp.raffle.draws.index');

        Route::post('/draw', [WhatsAppRaffleController::class, 'draw'])
            ->middleware('can:whatsapp.raffle.draw')
            ->name('whatsapp.raffle.draw');

        Route::post('/draws/{draw}/reveal-phone', [WhatsAppRaffleController::class, 'revealPhone'])
            ->middleware(['throttle:raffle-reveal', 'can:whatsapp.raffle.reveal-phone'])
            ->name('whatsapp.raffle.draws.reveal-phone');
    });
});
