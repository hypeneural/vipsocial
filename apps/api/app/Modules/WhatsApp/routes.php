<?php

use App\Modules\WhatsApp\Http\Controllers\WhatsAppController;
use App\Modules\WhatsApp\Http\Controllers\WhatsAppGroupsController;
use App\Modules\WhatsApp\Http\Controllers\WhatsAppGroupMetricsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('whatsapp')->group(function () {
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
});
