<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\VipGallery\Http\Resources\SlideshowResource;
use App\Modules\VipGallery\Models\VipGallerySlideshow;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SlideshowBootController extends BaseController
{
    public function boot(Request $request, string $slideshowCode): JsonResponse
    {
        return $this->respondWithSlideshow($request, $slideshowCode);
    }

    public function state(Request $request, string $slideshowCode): JsonResponse
    {
        return $this->respondWithSlideshow($request, $slideshowCode);
    }

    private function respondWithSlideshow(Request $request, string $slideshowCode): JsonResponse
    {
        $slideshow = VipGallerySlideshow::query()
            ->with('event')
            ->where('slideshow_code', $slideshowCode)
            ->firstOrFail();

        if (! $slideshow->event || ! $slideshow->isAvailable()) {
            return $this->jsonError(
                'O telão solicitado nao esta disponivel',
                'SLIDESHOW_UNAVAILABLE',
                410
            );
        }

        $photos = $slideshow->isPlayable()
            ? $slideshow->event->vipGalleryPhotos()
                ->slideshowVisible()
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit(max(1, (int) $slideshow->queue_limit))
                ->get()
            : new Collection();

        $slideshow->event->setRelation('vipGalleryPhotos', $photos);

        return $this->jsonSuccess((new SlideshowResource($slideshow))->resolve($request));
    }
}
