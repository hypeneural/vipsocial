<?php

use App\Modules\VipGallery\Http\Controllers\GalleryTrackingController;
use App\Modules\VipGallery\Http\Controllers\PublicGalleryController;
use App\Modules\VipGallery\Http\Controllers\SlideshowBootController;
use App\Modules\VipGallery\Http\Controllers\VipGalleryAdminController;
use App\Modules\VipGallery\Http\Controllers\VipGallerySlideshowController;
use App\Modules\VipGallery\Http\Controllers\ZApiGalleryWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhook/zapi/gallery', [ZApiGalleryWebhookController::class, 'store']);

Route::middleware('auth:sanctum')->prefix('vip-gallery')->group(function () {
    Route::get('/options', [VipGalleryAdminController::class, 'options']);
    Route::get('/logs', [VipGalleryAdminController::class, 'logs']);
    Route::patch('/events/{event}/status', [VipGalleryAdminController::class, 'updateEventStatus'])
        ->whereNumber('event');
    Route::get('/events/{event}/photos', [VipGalleryAdminController::class, 'eventPhotos'])
        ->whereNumber('event');
    Route::delete('/events/{event}/coverage', [VipGalleryAdminController::class, 'destroyCoverage'])
        ->whereNumber('event');
    Route::post('/logos/upload', [VipGalleryAdminController::class, 'uploadLogo']);
    Route::post('/banners/upload', [VipGalleryAdminController::class, 'uploadBanners']);
    Route::patch('/banners/reorder', [VipGalleryAdminController::class, 'reorderBanners']);
    Route::delete('/banners/{banner}', [VipGalleryAdminController::class, 'destroyBanner'])
        ->whereNumber('banner');
    Route::patch('/photos/{photo}/approval', [VipGalleryAdminController::class, 'updatePhotoApproval'])
        ->whereNumber('photo');
    Route::patch('/photos/{photo}/slideshow', [VipGalleryAdminController::class, 'updatePhotoSlideshowMetadata'])
        ->whereNumber('photo');
    Route::post('/photos/{photo}/reprocess', [VipGalleryAdminController::class, 'reprocess'])
        ->whereNumber('photo');
    Route::post('/events/{event}/download-all', [VipGalleryAdminController::class, 'downloadAll'])
        ->whereNumber('event');
    Route::get('/events/{event}/slideshow', [VipGallerySlideshowController::class, 'show'])
        ->whereNumber('event');
    Route::patch('/events/{event}/slideshow', [VipGallerySlideshowController::class, 'update'])
        ->whereNumber('event');
    Route::post('/events/{event}/slideshow/background', [VipGallerySlideshowController::class, 'uploadBackground'])
        ->whereNumber('event');
    Route::post('/events/{event}/slideshow/partner-logo', [VipGallerySlideshowController::class, 'uploadPartnerLogo'])
        ->whereNumber('event');
    Route::post('/events/{event}/slideshow/expire', [VipGallerySlideshowController::class, 'expire'])
        ->whereNumber('event');
    Route::post('/events/{event}/slideshow/reset', [VipGallerySlideshowController::class, 'reset'])
        ->whereNumber('event');
});

Route::prefix('gallery')->group(function () {
    Route::post('/track/view', [GalleryTrackingController::class, 'trackView'])
        ->middleware('throttle:vip-gallery-view');
    Route::post('/photos/{photo}/download', [GalleryTrackingController::class, 'trackDownload'])
        ->whereNumber('photo')
        ->middleware('throttle:vip-gallery-download');

    Route::get('/', [PublicGalleryController::class, 'index']);
    Route::get('/{identifier}/photos', [PublicGalleryController::class, 'photos']);
    Route::get('/{identifier}', [PublicGalleryController::class, 'show']);
});

Route::prefix('slideshow')->group(function () {
    Route::get('/{slideshowCode}/boot', [SlideshowBootController::class, 'boot']);
    Route::get('/{slideshowCode}/state', [SlideshowBootController::class, 'state']);
});
