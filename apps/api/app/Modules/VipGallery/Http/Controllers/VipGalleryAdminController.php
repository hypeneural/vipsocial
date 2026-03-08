<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\VipGallery\Jobs\ProcessVipGalleryPhotoJob;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class VipGalleryAdminController extends BaseController
{
    public function reprocess(VipGalleryPhoto $photo, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        if ($photo->processing_status !== VipGalleryPhoto::STATUS_FAILED) {
            return $this->jsonError(
                'Somente fotos com status failed podem ser reprocessadas',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        if (! $mediaManager->pathExists($photo->original_image_path)) {
            return $this->jsonError(
                'Imagem original nao encontrada para reprocessamento',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $photo->forceFill([
            'processing_attempts' => ((int) $photo->processing_attempts) + 1,
            'last_processing_attempt_at' => now(),
            'processing_error' => null,
        ])->save();

        ProcessVipGalleryPhotoJob::dispatch($photo->id)
            ->onQueue((string) config('vip_gallery.queues.processing', 'vip-gallery-processing'));

        return $this->jsonSuccess([
            'queued' => true,
            'photo_id' => $photo->id,
        ], 'Reprocessamento enfileirado', 202);
    }
}
