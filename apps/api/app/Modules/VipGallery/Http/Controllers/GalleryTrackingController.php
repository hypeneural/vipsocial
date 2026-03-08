<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Support\VipGalleryEventResolver;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GalleryTrackingController extends BaseController
{
    public function __construct(
        private readonly VipGalleryEventResolver $resolver
    ) {}

    public function trackView(Request $request)
    {
        $validated = $request->validate([
            'identifier' => ['required', 'string', 'max:160'],
        ]);

        $event = $this->resolver->resolvePublic($validated['identifier']);
        $key = 'vip-gallery:view:'.$event->id.':'.sha1(($request->ip() ?? 'ip').'|'.($request->userAgent() ?? 'ua'));

        if (Cache::add($key, true, now()->addMinutes((int) config('vip_gallery.tracking.view_dedupe_minutes', 30)))) {
            $event->increment('views_count');
        }

        return response()->noContent();
    }

    public function trackDownload(Request $request, VipGalleryPhoto $photo)
    {
        abort_unless(
            $photo->is_approved
            && in_array($photo->processing_status, [VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL, VipGalleryPhoto::STATUS_PROCESSED], true),
            404
        );

        $key = 'vip-gallery:download:'.$photo->id.':'.sha1(($request->ip() ?? 'ip').'|'.($request->userAgent() ?? 'ua'));

        if (Cache::add($key, true, now()->addMinutes((int) config('vip_gallery.tracking.download_dedupe_minutes', 30)))) {
            $photo->increment('downloads_count');
        }

        return response()->noContent();
    }
}
