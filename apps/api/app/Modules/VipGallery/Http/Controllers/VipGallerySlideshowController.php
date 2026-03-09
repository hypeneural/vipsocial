<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\Externas\Models\EventActivityLog;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGallerySlideshow;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Modules\VipGallery\Support\VipGallerySlideshowBroadcaster;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class VipGallerySlideshowController extends BaseController
{
    public function show(ExternalEvent $event): JsonResponse
    {
        $this->ensureVipGalleryEvent($event);

        $slideshow = $event->vipGallerySlideshow()->first();

        return $this->jsonSuccess([
            'exists' => $slideshow !== null,
            'slideshow' => $this->slideshowPayload($event, $slideshow),
            'meta' => $this->metaPayload(),
        ]);
    }

    public function update(
        Request $request,
        ExternalEvent $event,
        VipGallerySlideshowBroadcaster $broadcaster
    ): JsonResponse {
        $this->ensureVipGalleryEvent($event);

        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(VipGallerySlideshow::statuses())],
            'layout' => ['sometimes', Rule::in(VipGallerySlideshow::layouts())],
            'interval_ms' => ['sometimes', 'integer', 'min:3000', 'max:60000'],
            'queue_limit' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'show_neon' => ['sometimes', 'boolean'],
            'show_sender_credit' => ['sometimes', 'boolean'],
            'neon_text' => ['nullable', 'string', 'max:120'],
            'instructions_text' => ['nullable', 'string', 'max:1000'],
            'expires_at' => ['nullable', 'date'],
            'background_url' => ['nullable', 'string', 'max:2048'],
            'partner_logo_path' => ['nullable', 'string', 'max:2048'],
        ]);

        $slideshow = $this->firstOrCreateSlideshow($event);
        $before = $this->slideshowPayload($event, $slideshow);

        $slideshow->fill($validated);

        if (array_key_exists('is_enabled', $validated) && (bool) $validated['is_enabled'] && ! array_key_exists('status', $validated)) {
            $slideshow->status = $event->isVipGalleryActive()
                ? VipGallerySlideshow::STATUS_ACTIVE
                : VipGallerySlideshow::STATUS_DRAFT;
        }

        $slideshow->save();
        $slideshow->refresh();

        $after = $this->slideshowPayload($event, $slideshow);

        EventActivityLog::log(
            $event->id,
            'vip_gallery_slideshow_updated',
            'Configuracoes do telao/slideshow atualizadas.',
            [
                'Slideshow' => [
                    'de' => $before,
                    'para' => $after,
                ],
            ]
        );

        $statusChanged = ($before['status'] ?? null) !== ($after['status'] ?? null);

        if ($statusChanged) {
            $broadcaster->broadcastStatusChanged($slideshow, 'settings_updated');
        }

        if (in_array($slideshow->publicStatus(), [VipGallerySlideshow::STATUS_ARCHIVED, VipGallerySlideshow::STATUS_EXPIRED], true)) {
            $broadcaster->broadcastExpired($slideshow, $slideshow->status);
        } elseif ($slideshow->is_enabled) {
            $broadcaster->broadcastSettingsUpdated($slideshow);
        }

        return $this->jsonSuccess([
            'exists' => true,
            'slideshow' => $after,
            'meta' => $this->metaPayload(),
        ], 'Configuracoes do telao atualizadas com sucesso');
    }

    public function uploadBackground(
        Request $request,
        ExternalEvent $event,
        VipGalleryMediaManager $mediaManager,
        VipGallerySlideshowBroadcaster $broadcaster
    ): JsonResponse {
        $this->ensureVipGalleryEvent($event);

        $maxKilobytes = (int) ceil(((int) config('vip_gallery.images.banner_max_bytes', 5242880)) / 1024);

        $validated = $request->validate([
            'background' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$maxKilobytes}"],
        ]);

        $slideshow = $this->firstOrCreateSlideshow($event);
        $previousPath = $slideshow->background_url;
        $stored = $mediaManager->storeUploadedSlideshowBackground($validated['background'], $event->id);

        $slideshow->forceFill([
            'background_url' => $stored['url'],
        ])->save();

        $this->deletePublicAssetByUrl($mediaManager, $previousPath);

        EventActivityLog::log(
            $event->id,
            'vip_gallery_slideshow_background_updated',
            'Background do telao atualizado.',
            null
        );

        $broadcaster->broadcastSettingsUpdated($slideshow);

        return $this->jsonSuccess([
            'slideshow' => $this->slideshowPayload($event, $slideshow->fresh()),
        ], 'Background do telao enviado com sucesso');
    }

    public function uploadPartnerLogo(
        Request $request,
        ExternalEvent $event,
        VipGalleryMediaManager $mediaManager,
        VipGallerySlideshowBroadcaster $broadcaster
    ): JsonResponse {
        $this->ensureVipGalleryEvent($event);

        $maxKilobytes = (int) ceil(((int) config('vip_gallery.images.banner_max_bytes', 5242880)) / 1024);

        $validated = $request->validate([
            'partner_logo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$maxKilobytes}"],
        ]);

        $slideshow = $this->firstOrCreateSlideshow($event);
        $previousPath = $slideshow->partner_logo_path;
        $stored = $mediaManager->storeUploadedSlideshowPartnerLogo($validated['partner_logo'], $event->id);

        $slideshow->forceFill([
            'partner_logo_path' => $stored['path'],
        ])->save();

        if (is_string($previousPath) && $previousPath !== '') {
            $mediaManager->deletePath($previousPath);
        }

        EventActivityLog::log(
            $event->id,
            'vip_gallery_slideshow_partner_logo_updated',
            'Logo do parceiro do telao atualizada.',
            null
        );

        $broadcaster->broadcastSettingsUpdated($slideshow);

        return $this->jsonSuccess([
            'slideshow' => $this->slideshowPayload($event, $slideshow->fresh()),
        ], 'Logo do parceiro enviada com sucesso');
    }

    public function expire(
        Request $request,
        ExternalEvent $event,
        VipGallerySlideshowBroadcaster $broadcaster
    ): JsonResponse {
        $this->ensureVipGalleryEvent($event);

        $validated = $request->validate([
            'expires_at' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:50'],
        ]);

        $slideshow = $this->firstOrCreateSlideshow($event);
        $expiredAt = isset($validated['expires_at']) ? Carbon::parse($validated['expires_at']) : now();

        $slideshow->forceFill([
            'status' => VipGallerySlideshow::STATUS_EXPIRED,
            'expires_at' => $expiredAt,
        ])->save();

        EventActivityLog::log(
            $event->id,
            'vip_gallery_slideshow_expired',
            'Telao/slideshow encerrado.',
            [
                'Expirado em' => [
                    'de' => null,
                    'para' => $expiredAt->toIso8601String(),
                ],
            ]
        );

        $broadcaster->broadcastStatusChanged($slideshow, (string) ($validated['reason'] ?? 'expired'));
        $broadcaster->broadcastExpired($slideshow, (string) ($validated['reason'] ?? 'expired'));

        return $this->jsonSuccess([
            'slideshow' => $this->slideshowPayload($event, $slideshow->fresh()),
        ], 'Telao encerrado com sucesso');
    }

    public function reset(
        ExternalEvent $event,
        VipGalleryMediaManager $mediaManager,
        VipGallerySlideshowBroadcaster $broadcaster
    ): JsonResponse {
        $this->ensureVipGalleryEvent($event);

        $slideshow = $this->firstOrCreateSlideshow($event);
        $previousBackground = $slideshow->background_url;
        $previousPartnerLogoPath = $slideshow->partner_logo_path;

        $slideshow->forceFill([
            'layout' => (string) config('vip_gallery.slideshow.default_layout', VipGallerySlideshow::LAYOUT_AUTO),
            'interval_ms' => (int) config('vip_gallery.slideshow.default_interval_ms', 10000),
            'queue_limit' => (int) config('vip_gallery.slideshow.default_queue_limit', 100),
            'background_url' => null,
            'partner_logo_path' => null,
            'show_neon' => (bool) config('vip_gallery.slideshow.default_show_neon', true),
            'show_sender_credit' => (bool) config('vip_gallery.slideshow.default_show_sender_credit', false),
            'neon_text' => (string) config('vip_gallery.slideshow.default_neon_text', ''),
            'instructions_text' => (string) config('vip_gallery.slideshow.default_instructions_text', ''),
            'expires_at' => null,
        ])->save();

        $this->deletePublicAssetByUrl($mediaManager, $previousBackground);

        if (is_string($previousPartnerLogoPath) && $previousPartnerLogoPath !== '') {
            $mediaManager->deletePath($previousPartnerLogoPath);
        }

        EventActivityLog::log(
            $event->id,
            'vip_gallery_slideshow_reset',
            'Configuracoes do telao resetadas para o padrao.',
            null
        );

        $broadcaster->broadcastSettingsUpdated($slideshow);

        return $this->jsonSuccess([
            'slideshow' => $this->slideshowPayload($event, $slideshow->fresh()),
            'meta' => $this->metaPayload(),
        ], 'Configuracoes do telao resetadas com sucesso');
    }

    private function ensureVipGalleryEvent(ExternalEvent $event): void
    {
        if (! $event->is_vip_gallery) {
            throw ValidationException::withMessages([
                'event' => ['O evento informado nao possui Cobertura VIP ativa.'],
            ]);
        }
    }

    private function firstOrCreateSlideshow(ExternalEvent $event): VipGallerySlideshow
    {
        return VipGallerySlideshow::query()->firstOrCreate(
            ['external_event_id' => $event->id],
            [
                'is_enabled' => false,
                'status' => $event->isVipGalleryActive()
                    ? VipGallerySlideshow::STATUS_ACTIVE
                    : VipGallerySlideshow::STATUS_DRAFT,
                'layout' => (string) config('vip_gallery.slideshow.default_layout', VipGallerySlideshow::LAYOUT_AUTO),
                'interval_ms' => (int) config('vip_gallery.slideshow.default_interval_ms', 10000),
                'queue_limit' => (int) config('vip_gallery.slideshow.default_queue_limit', 100),
                'show_neon' => (bool) config('vip_gallery.slideshow.default_show_neon', true),
                'show_sender_credit' => (bool) config('vip_gallery.slideshow.default_show_sender_credit', false),
                'neon_text' => (string) config('vip_gallery.slideshow.default_neon_text', ''),
                'instructions_text' => (string) config('vip_gallery.slideshow.default_instructions_text', ''),
            ]
        );
    }

    private function slideshowPayload(ExternalEvent $event, ?VipGallerySlideshow $slideshow): array
    {
        $mediaManager = app(VipGalleryMediaManager::class);

        return [
            'id' => $slideshow?->id,
            'external_event_id' => $event->id,
            'slideshow_code' => $slideshow?->slideshow_code,
            'public_url' => $slideshow?->publicUrl(),
            'is_enabled' => (bool) ($slideshow?->is_enabled ?? false),
            'status' => (string) ($slideshow?->publicStatus() ?? VipGallerySlideshow::STATUS_DISABLED),
            'layout' => (string) ($slideshow?->layout ?? config('vip_gallery.slideshow.default_layout', VipGallerySlideshow::LAYOUT_AUTO)),
            'interval_ms' => (int) ($slideshow?->interval_ms ?? config('vip_gallery.slideshow.default_interval_ms', 10000)),
            'queue_limit' => (int) ($slideshow?->queue_limit ?? config('vip_gallery.slideshow.default_queue_limit', 100)),
            'background_url' => $slideshow?->background_url,
            'partner_logo_path' => $slideshow?->partner_logo_path,
            'partner_logo_url' => $slideshow?->partner_logo_path ? $mediaManager->publicUrl($slideshow->partner_logo_path) : null,
            'show_neon' => (bool) ($slideshow?->show_neon ?? config('vip_gallery.slideshow.default_show_neon', true)),
            'show_sender_credit' => (bool) ($slideshow?->show_sender_credit ?? config('vip_gallery.slideshow.default_show_sender_credit', false)),
            'neon_text' => (string) ($slideshow?->neon_text ?? config('vip_gallery.slideshow.default_neon_text', '')),
            'instructions_text' => (string) ($slideshow?->instructions_text ?? config('vip_gallery.slideshow.default_instructions_text', '')),
            'expires_at' => optional($slideshow?->expires_at)?->toIso8601String(),
        ];
    }

    private function metaPayload(): array
    {
        return [
            'statuses' => collect(VipGallerySlideshow::statuses())
                ->map(fn (string $status) => ['value' => $status, 'label' => ucfirst($status)])
                ->values(),
            'layouts' => collect(VipGallerySlideshow::layouts())
                ->map(fn (string $layout) => ['value' => $layout, 'label' => $this->layoutLabel($layout)])
                ->values(),
        ];
    }

    private function layoutLabel(string $layout): string
    {
        return match ($layout) {
            VipGallerySlideshow::LAYOUT_AUTO => 'Automatico',
            VipGallerySlideshow::LAYOUT_POLAROID => 'Polaroid',
            VipGallerySlideshow::LAYOUT_FULLSCREEN => 'Tela cheia',
            VipGallerySlideshow::LAYOUT_SPLIT => 'Dividido',
            VipGallerySlideshow::LAYOUT_CINEMATIC => 'Cinematico',
            default => ucfirst($layout),
        };
    }

    private function deletePublicAssetByUrl(VipGalleryMediaManager $mediaManager, ?string $url): void
    {
        if (! is_string($url) || trim($url) === '') {
            return;
        }

        $prefix = rtrim((string) config('app.url'), '/').'/storage/';

        if (! str_starts_with($url, $prefix)) {
            return;
        }

        $relativePath = ltrim(substr($url, strlen($prefix)), '/');

        if ($relativePath !== '') {
            $mediaManager->deletePath($relativePath);
        }
    }
}
