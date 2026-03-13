<?php

use App\Modules\NewsRadarWhatsApp\Http\Controllers\WhatsAppNewsGroupsController;
use App\Modules\NewsRadarWhatsApp\Http\Controllers\WhatsAppNewsBundlesController;
use App\Modules\NewsRadarWhatsApp\Http\Controllers\WhatsAppBundleMarkdownController;
use App\Modules\NewsRadarWhatsApp\Http\Controllers\WhatsAppTimelineController;
use Illuminate\Support\Facades\Route;

Route::get('/public/news-radar/whatsapp/markdown-exports/{token}.md', [WhatsAppBundleMarkdownController::class, 'publicShow'])
    ->name('news-radar.whatsapp.markdown.public');
Route::get('/public/news-radar/whatsapp/markdown-exports/{token}', [WhatsAppBundleMarkdownController::class, 'publicShow']);

Route::middleware('auth:sanctum')->prefix('news-radar/whatsapp')->group(function () {
    Route::get('/groups', [WhatsAppNewsGroupsController::class, 'index'])->name('news-radar.whatsapp.groups.index');
    Route::put('/groups/preferences', [WhatsAppNewsGroupsController::class, 'updatePreferences'])->name('news-radar.whatsapp.groups.preferences');
    Route::get('/groups/{groupFk}/summary', [WhatsAppNewsGroupsController::class, 'summary'])->name('news-radar.whatsapp.groups.summary');
    Route::post('/groups/{groupFk}/mark-as-read', [WhatsAppNewsGroupsController::class, 'markAsRead'])->name('news-radar.whatsapp.groups.mark-as-read');
    Route::get('/groups/{groupFk}/timeline', [WhatsAppTimelineController::class, 'groupTimeline'])->name('news-radar.whatsapp.groups.timeline');

    Route::get('/events/{id}', [WhatsAppTimelineController::class, 'show'])->whereNumber('id')->name('news-radar.whatsapp.events.show');
    Route::post('/events/{id}/ignore', [WhatsAppTimelineController::class, 'ignore'])->whereNumber('id')->name('news-radar.whatsapp.events.ignore');
    Route::post('/events/{id}/unignore', [WhatsAppTimelineController::class, 'unignore'])->whereNumber('id')->name('news-radar.whatsapp.events.unignore');
    Route::post('/events/{id}/star', [WhatsAppTimelineController::class, 'star'])->whereNumber('id')->name('news-radar.whatsapp.events.star');
    Route::post('/events/{id}/unstar', [WhatsAppTimelineController::class, 'unstar'])->whereNumber('id')->name('news-radar.whatsapp.events.unstar');
    Route::post('/events/{id}/mark-reviewed', [WhatsAppTimelineController::class, 'markReviewed'])->whereNumber('id')->name('news-radar.whatsapp.events.mark-reviewed');

    Route::get('/bundles', [WhatsAppNewsBundlesController::class, 'index'])->name('news-radar.whatsapp.bundles.index');
    Route::post('/bundles', [WhatsAppNewsBundlesController::class, 'store'])->name('news-radar.whatsapp.bundles.store');
    Route::get('/bundles/{id}', [WhatsAppNewsBundlesController::class, 'show'])->whereNumber('id')->name('news-radar.whatsapp.bundles.show');
    Route::put('/bundles/{id}', [WhatsAppNewsBundlesController::class, 'update'])->whereNumber('id')->name('news-radar.whatsapp.bundles.update');
    Route::post('/bundles/{id}/items', [WhatsAppNewsBundlesController::class, 'addItems'])->whereNumber('id')->name('news-radar.whatsapp.bundles.items.add');
    Route::delete('/bundles/{id}/items/{eventId}', [WhatsAppNewsBundlesController::class, 'removeItem'])->whereNumber('id')->whereNumber('eventId')->name('news-radar.whatsapp.bundles.items.remove');
    Route::put('/bundles/{id}/star', [WhatsAppNewsBundlesController::class, 'setStar'])->whereNumber('id')->name('news-radar.whatsapp.bundles.star');
    Route::post('/bundles/{id}/archive', [WhatsAppNewsBundlesController::class, 'archive'])->whereNumber('id')->name('news-radar.whatsapp.bundles.archive');
    Route::post('/bundles/{id}/reopen', [WhatsAppNewsBundlesController::class, 'reopen'])->whereNumber('id')->name('news-radar.whatsapp.bundles.reopen');
    Route::post('/bundles/{id}/duplicate', [WhatsAppNewsBundlesController::class, 'duplicate'])->whereNumber('id')->name('news-radar.whatsapp.bundles.duplicate');
    Route::post('/bundles/{id}/promote', [WhatsAppNewsBundlesController::class, 'promote'])->whereNumber('id')->name('news-radar.whatsapp.bundles.promote');
    Route::get('/bundles/{id}/markdown-preview', [WhatsAppBundleMarkdownController::class, 'preview'])->whereNumber('id')->name('news-radar.whatsapp.bundles.markdown-preview');
    Route::post('/bundles/{id}/markdown-export', [WhatsAppBundleMarkdownController::class, 'export'])->whereNumber('id')->name('news-radar.whatsapp.bundles.markdown-export');
});
