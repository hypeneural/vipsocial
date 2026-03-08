<?php

namespace App\Modules\VipGallery\Support;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class VipGalleryMediaManager
{
    public function downloadOriginal(string $sourceUrl, ExternalEvent $event, string $messageId): array
    {
        $response = Http::timeout((int) config('vip_gallery.images.download_timeout', 30))
            ->retry(2, 300)
            ->get($sourceUrl);

        if (! $response->successful()) {
            throw new RuntimeException('Falha ao baixar imagem original');
        }

        $binary = $response->body();

        if ($binary === '') {
            throw new RuntimeException('Imagem original vazia');
        }

        if (strlen($binary) > (int) config('vip_gallery.images.max_bytes', 15728640)) {
            throw new RuntimeException('Imagem acima do limite permitido');
        }

        $imageInfo = $this->detectImageInfo($binary);
        $mime = strtolower((string) ($imageInfo['mime'] ?? ''));

        $this->assertMimeAllowed($mime);

        $binary = $this->normalizeJpegOrientation($binary, $mime);
        $imageInfo = $this->detectImageInfo($binary);
        $path = $this->buildPath($event->id, 'originals', $messageId, $this->extensionFromMime($mime));

        $this->storage()->put($path, $binary);

        return [
            'path' => $path,
            'width' => (int) ($imageInfo[0] ?? 0),
            'height' => (int) ($imageInfo[1] ?? 0),
            'mime' => $mime,
        ];
    }

    public function createProcessedImage(VipGalleryPhoto $photo, ExternalEvent $event): string
    {
        if (! $photo->original_image_path || ! $this->pathExists($photo->original_image_path)) {
            throw new RuntimeException('Imagem original nao localizada para processamento');
        }

        if (
            ! function_exists('imagecreatefromstring')
            || ! function_exists('imagecopyresampled')
            || ! function_exists('imagejpeg')
        ) {
            throw new RuntimeException('GD nativo indisponivel para processamento');
        }

        $originalBinary = $this->storage()->get($photo->original_image_path);
        $imageInfo = $this->detectImageInfo($originalBinary);
        $mime = strtolower((string) ($imageInfo['mime'] ?? ''));

        $this->assertMimeAllowed($mime);

        $original = @imagecreatefromstring($originalBinary);

        if (! $original) {
            throw new RuntimeException('Falha ao abrir imagem original com GD');
        }

        $output = null;
        $logo = null;
        $resizedLogo = null;

        try {
            $width = imagesx($original);
            $height = imagesy($original);
            $output = imagecreatetruecolor($width, $height);

            if (! $output) {
                throw new RuntimeException('Falha ao criar canvas de processamento');
            }

            $this->prepareTransparentCanvas($output, $width, $height);
            imagecopy($output, $original, 0, 0, 0, 0, $width, $height);

            $logo = $this->loadLogoImage($event);

            if ($logo) {
                [$resizedLogo, $logoWidth, $logoHeight] = $this->resizeLogo(
                    $logo,
                    $width,
                    $height,
                    (int) ($event->logo_size_percent ?: config('vip_gallery.images.logo_size_percent_default', 15))
                );

                imagealphablending($output, true);
                imagecopy(
                    $output,
                    $resizedLogo,
                    $this->logoDestinationX($width, $logoWidth),
                    $this->logoDestinationY($height, $logoHeight),
                    0,
                    0,
                    $logoWidth,
                    $logoHeight
                );
            }

            $processedPath = $this->buildPath($event->id, 'processed', $photo->zapi_message_id, 'jpg');
            $this->storage()->put($processedPath, $this->encodeJpeg($output));

            return $processedPath;
        } finally {
            if ($resizedLogo) {
                imagedestroy($resizedLogo);
            }

            if ($logo) {
                imagedestroy($logo);
            }

            if ($output) {
                imagedestroy($output);
            }

            imagedestroy($original);
        }
    }

    public function deletePhotoFiles(VipGalleryPhoto $photo): void
    {
        foreach (array_unique(array_filter([
            $photo->original_image_path,
            $photo->processed_image_path,
        ])) as $path) {
            if ($this->storage()->exists($path)) {
                $this->storage()->delete($path);
            }
        }
    }

    public function pathExists(?string $path): bool
    {
        return is_string($path) && $path !== '' && $this->storage()->exists($path);
    }

    public function publicUrl(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }

        $url = $this->storage()->url($path);

        if (Str::startsWith($url, ['http://', 'https://'])) {
            return $url;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($url, '/');
    }

    public function publicGalleryUrl(ExternalEvent $event): ?string
    {
        if (! $event->gallery_slug) {
            return null;
        }

        $baseUrl = rtrim((string) config('vip_gallery.public.frontend_base_url', 'https://www.coberturavip.com.br'), '/');

        return $baseUrl.'/'.$event->gallery_slug;
    }

    public function defaultLogoPath(): string
    {
        return trim((string) config('vip_gallery.images.default_logo_path', ''), '/');
    }

    public function defaultLogoUrl(): ?string
    {
        $path = $this->defaultLogoPath();

        if ($path === '' || ! $this->pathExists($path)) {
            return null;
        }

        return $this->publicUrl($path);
    }

    public function noLogoSentinel(): string
    {
        return (string) config('vip_gallery.images.no_logo_sentinel', '__none__');
    }

    public function isNoLogoPath(?string $path): bool
    {
        return is_string($path) && trim($path) === $this->noLogoSentinel();
    }

    public function storeUploadedLogo(UploadedFile $file, ?int $eventId = null): array
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());

        if ($extension !== 'png') {
            throw new RuntimeException('A logo personalizada deve ser enviada em PNG');
        }

        $baseDir = trim((string) config('vip_gallery.base_dir', 'vip-gallery'), '/');
        $folder = $eventId
            ? "{$baseDir}/logos/events/{$eventId}"
            : "{$baseDir}/logos/uploads/".now()->format('Y/m');
        $fileName = Str::uuid()->toString().'.png';
        $path = "{$folder}/{$fileName}";

        $this->storage()->put($path, (string) file_get_contents($file->getRealPath()));

        return [
            'path' => $path,
            'url' => $this->publicUrl($path),
        ];
    }

    private function buildPath(int $eventId, string $segment, string $messageId, string $extension): string
    {
        $fileName = preg_replace('/[^A-Za-z0-9_-]+/', '-', $messageId) ?: uniqid('vip-gallery-', true);
        $baseDir = trim((string) config('vip_gallery.base_dir', 'vip-gallery'), '/');

        return "{$baseDir}/events/{$eventId}/{$segment}/{$fileName}.{$extension}";
    }

    private function detectImageInfo(string $binary): array
    {
        $imageInfo = @getimagesizefromstring($binary);

        if (! is_array($imageInfo)) {
            throw new RuntimeException('Arquivo recebido nao e uma imagem valida');
        }

        return $imageInfo;
    }

    private function encodeJpeg($image): string
    {
        ob_start();
        imagejpeg($image, null, (int) config('vip_gallery.images.jpeg_quality', 90));

        return (string) ob_get_clean();
    }

    private function extensionFromMime(string $mime): string
    {
        return match (strtolower($mime)) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };
    }

    private function assertMimeAllowed(string $mime): void
    {
        $allowedMimes = config('vip_gallery.images.allowed_mimes', [
            'image/jpeg',
            'image/png',
            'image/webp',
        ]);

        if (! in_array($mime, $allowedMimes, true)) {
            throw new RuntimeException('Tipo de imagem nao suportado');
        }
    }

    private function normalizeJpegOrientation(string $binary, string $mime): string
    {
        if (
            $mime !== 'image/jpeg'
            || ! function_exists('exif_read_data')
            || ! function_exists('imagerotate')
            || ! function_exists('imagecreatefromstring')
            || ! function_exists('imagejpeg')
        ) {
            return $binary;
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'vip-gallery-exif-');

        if ($tempFile === false || file_put_contents($tempFile, $binary) === false) {
            return $binary;
        }

        try {
            $orientation = (int) ((@exif_read_data($tempFile)['Orientation'] ?? 1));
        } finally {
            @unlink($tempFile);
        }

        if (! in_array($orientation, [3, 6, 8], true)) {
            return $binary;
        }

        $image = @imagecreatefromstring($binary);

        if (! $image) {
            return $binary;
        }

        $normalizedImage = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => $image,
        };

        if (! $normalizedImage) {
            imagedestroy($image);

            return $binary;
        }

        if ($normalizedImage !== $image) {
            imagedestroy($image);
        }

        ob_start();
        imagejpeg($normalizedImage, null, (int) config('vip_gallery.images.jpeg_quality', 90));
        $normalizedBinary = (string) ob_get_clean();
        imagedestroy($normalizedImage);

        return $normalizedBinary !== '' ? $normalizedBinary : $binary;
    }

    private function loadLogoImage(ExternalEvent $event)
    {
        $logoPath = $this->resolveLogoPath($event);

        if (! $logoPath || ! $this->pathExists($logoPath)) {
            return null;
        }

        $logoBinary = $this->storage()->get($logoPath);
        $logoInfo = @getimagesizefromstring($logoBinary);

        if (! is_array($logoInfo) || strtolower((string) ($logoInfo['mime'] ?? '')) !== 'image/png') {
            return null;
        }

        $logo = @imagecreatefromstring($logoBinary);

        return $logo ?: null;
    }

    private function resolveLogoPath(ExternalEvent $event): ?string
    {
        $configuredPath = trim((string) ($event->custom_logo_path ?? ''));

        if ($configuredPath === $this->noLogoSentinel()) {
            return null;
        }

        if ($configuredPath !== '') {
            return $configuredPath;
        }

        $defaultPath = $this->defaultLogoPath();

        return $defaultPath !== '' ? $defaultPath : null;
    }

    private function resizeLogo($logo, int $imageWidth, int $imageHeight, int $requestedPercent): array
    {
        $logoWidth = max(1, imagesx($logo));
        $logoHeight = max(1, imagesy($logo));
        $logoSizePercent = min(
            max($requestedPercent, (int) config('vip_gallery.images.logo_size_percent_min', 5)),
            (int) config('vip_gallery.images.logo_size_percent_max', 30)
        );
        $maxWidth = max(1, $imageWidth - ($this->logoMarginRight() * 2));
        $maxHeight = max(1, $imageHeight - ($this->logoMarginBottom() * 2));
        $targetWidth = max(1, (int) round($imageWidth * ($logoSizePercent / 100)));
        $scale = min(
            $targetWidth / $logoWidth,
            $maxWidth / $logoWidth,
            $maxHeight / $logoHeight
        );

        $targetLogoWidth = max(1, (int) floor($logoWidth * $scale));
        $targetLogoHeight = max(1, (int) floor($logoHeight * $scale));
        $resizedLogo = imagecreatetruecolor($targetLogoWidth, $targetLogoHeight);

        if (! $resizedLogo) {
            throw new RuntimeException('Falha ao redimensionar a logo');
        }

        $this->prepareTransparentCanvas($resizedLogo, $targetLogoWidth, $targetLogoHeight);
        imagecopyresampled(
            $resizedLogo,
            $logo,
            0,
            0,
            0,
            0,
            $targetLogoWidth,
            $targetLogoHeight,
            $logoWidth,
            $logoHeight
        );

        return [$resizedLogo, $targetLogoWidth, $targetLogoHeight];
    }

    private function prepareTransparentCanvas($image, int $width, int $height): void
    {
        imagealphablending($image, false);
        imagesavealpha($image, true);

        $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
        imagefilledrectangle($image, 0, 0, $width, $height, $transparent);
    }

    private function logoDestinationX(int $imageWidth, int $logoWidth): int
    {
        return max(0, $imageWidth - $logoWidth - $this->logoMarginRight());
    }

    private function logoDestinationY(int $imageHeight, int $logoHeight): int
    {
        return max(0, $imageHeight - $logoHeight - $this->logoMarginBottom());
    }

    private function logoMarginRight(): int
    {
        return max(0, (int) config('vip_gallery.images.logo_margin_right_px', 24));
    }

    private function logoMarginBottom(): int
    {
        return max(0, (int) config('vip_gallery.images.logo_margin_bottom_px', 24));
    }

    private function storage(): Filesystem
    {
        return Storage::disk($this->disk());
    }

    private function disk(): string
    {
        return 'public';
    }
}
