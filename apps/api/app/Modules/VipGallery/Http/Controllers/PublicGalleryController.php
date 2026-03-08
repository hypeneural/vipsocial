<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Http\Resources\GalleryDetailResource;
use App\Modules\VipGallery\Http\Resources\GalleryPhotoResource;
use App\Modules\VipGallery\Support\VipGalleryEventResolver;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Cursor;

class PublicGalleryController extends BaseController
{
    public function __construct(
        private readonly VipGalleryEventResolver $resolver
    ) {}

    public function show(Request $request, string $identifier): JsonResponse
    {
        $query = $this->baseGalleryQuery();

        if (ctype_digit($identifier)) {
            $query->where(function ($inner) use ($identifier) {
                $inner->where('id', (int) $identifier)
                    ->orWhere('gallery_slug', $identifier);
            });
        } else {
            $query->where('gallery_slug', $identifier);
        }

        $event = $query->firstOrFail();

        return $this->jsonSuccess((new GalleryDetailResource($event))->resolve($request));
    }

    public function photos(Request $request, string $identifier): JsonResponse
    {
        $event = $this->resolver->resolvePublic($identifier);
        $limit = min(max((int) $request->integer('limit', 20), 1), 30);

        if ($event->vip_gallery_status !== ExternalEvent::VIP_GALLERY_STATUS_ACTIVE) {
            return response()->json([
                'success' => true,
                'data' => [],
                'next_cursor' => null,
                'has_more' => false,
                'meta' => [
                    'next_cursor' => null,
                    'has_more' => false,
                ],
            ]);
        }

        $cursor = $request->filled('cursor')
            ? Cursor::fromEncoded((string) $request->query('cursor'))
            : null;

        $photos = $event->vipGalleryPhotos()
            ->publiclyVisible()
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'success' => true,
            'data' => GalleryPhotoResource::collection($photos->items())->resolve($request),
            'next_cursor' => $photos->nextCursor()?->encode(),
            'has_more' => $photos->hasMorePages(),
            'meta' => [
                'next_cursor' => $photos->nextCursor()?->encode(),
                'has_more' => $photos->hasMorePages(),
            ],
        ]);
    }

    private function baseGalleryQuery()
    {
        return ExternalEvent::query()
            ->where('is_vip_gallery', true)
            ->with([
                'vipGalleryBanners' => fn ($query) => $query->activeWindow()->orderBy('sort_order')->orderBy('id'),
            ])
            ->withCount([
                'vipGalleryPhotos as total_photos_count' => fn ($query) => $query->publiclyVisible(),
            ])
            ->withSum([
                'vipGalleryPhotos as total_downloads_count' => fn ($query) => $query->publiclyVisible(),
            ], 'downloads_count');
    }
}
