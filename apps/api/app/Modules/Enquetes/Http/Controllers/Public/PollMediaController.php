<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Models\PollOption;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PollMediaController
{
    public function optionImage(string $optionPublicId, ?string $conversion = null): BinaryFileResponse
    {
        $option = PollOption::query()
            ->where('public_id', $optionPublicId)
            ->firstOrFail();

        /** @var Media|null $media */
        $media = $option->getFirstMedia('option_image');

        abort_if($media === null, 404);

        $resolvedConversion = $this->resolveConversion($media, $conversion);
        $path = $resolvedConversion !== null ? $media->getPath($resolvedConversion) : $media->getPath();

        abort_unless(is_string($path) && is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => $media->mime_type ?: 'application/octet-stream',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    private function resolveConversion(Media $media, ?string $conversion): ?string
    {
        $requested = trim((string) $conversion);

        if ($requested === '' || $requested === 'original') {
            return null;
        }

        abort_unless(in_array($requested, ['thumb', 'web'], true), 404);

        if (method_exists($media, 'hasGeneratedConversion') && $media->hasGeneratedConversion($requested)) {
            return $requested;
        }

        return null;
    }
}
