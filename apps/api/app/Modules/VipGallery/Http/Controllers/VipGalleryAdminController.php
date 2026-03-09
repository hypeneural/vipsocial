<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\Externas\Models\EventActivityLog;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Http\Resources\GalleryBannerResource;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryPhotoJob;
use App\Modules\VipGallery\Models\VipGalleryBanner;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use ZipArchive;

class VipGalleryAdminController extends BaseController
{
    public function options(VipGalleryMediaManager $mediaManager): JsonResponse
    {
        $groups = collect(config('vip_gallery.groups', []))
            ->map(fn (array $group) => [
                'value' => (string) ($group['id'] ?? ''),
                'label' => (string) ($group['label'] ?? ''),
            ])
            ->filter(fn (array $group) => $group['value'] !== '' && $group['label'] !== '')
            ->values();

        return $this->jsonSuccess([
            'groups' => $groups,
            'statuses' => [
                ['value' => ExternalEvent::VIP_GALLERY_STATUS_DRAFT, 'label' => 'Rascunho'],
                ['value' => ExternalEvent::VIP_GALLERY_STATUS_ACTIVE, 'label' => 'Ativa'],
                ['value' => ExternalEvent::VIP_GALLERY_STATUS_PAUSED, 'label' => 'Pausada'],
                ['value' => ExternalEvent::VIP_GALLERY_STATUS_ARCHIVED, 'label' => 'Arquivada'],
            ],
            'default_delete_keywords' => (string) config('vip_gallery.delete.default_keywords', 'Deletar,Apagar,Excluir'),
            'default_pause_keywords' => (string) config('vip_gallery.pause.default_keywords', 'Parar,Pausar'),
            'default_logo_url' => $mediaManager->defaultLogoUrl(),
            'no_logo_sentinel' => $mediaManager->noLogoSentinel(),
            'banner_guidelines' => [
                'rendered_width' => (int) config('vip_gallery.images.banner_rendered_width', 744),
                'rendered_height' => (int) config('vip_gallery.images.banner_rendered_height', 144),
                'ratio_label' => (string) config('vip_gallery.images.banner_ratio_label', '31:6'),
            ],
            'logo_defaults' => [
                'anchor' => (string) config('vip_gallery.images.logo_position', 'bottom_center'),
                'size_percent' => (int) config('vip_gallery.images.logo_size_percent_default', 12),
                'min_size_percent' => (int) config('vip_gallery.images.logo_size_percent_min', 5),
                'max_size_percent' => (int) config('vip_gallery.images.logo_size_percent_max', 25),
                'safe_area_percent' => (float) config('vip_gallery.images.logo_safe_area_percent', 2),
                'offset_percent' => (float) config('vip_gallery.images.logo_offset_percent_default', 3),
                'anchors' => array_values(config('vip_gallery.images.logo_anchors', [])),
            ],
        ]);
    }

    public function logs(Request $request): JsonResponse
    {
        $groupsById = collect(config('vip_gallery.groups', []))
            ->mapWithKeys(fn (array $group) => [(string) ($group['id'] ?? '') => (string) ($group['label'] ?? '')])
            ->filter();

        $eventsByGroupId = ExternalEvent::query()
            ->where('is_vip_gallery', true)
            ->get(['id', 'titulo', 'whatsapp_group_id'])
            ->keyBy('whatsapp_group_id');

        $logs = VipGalleryWebhookLog::query()
            ->with([
                'photo:id,external_event_id,processing_status,sender_name,participant_phone',
                'photo.event:id,titulo',
            ])
            ->when($request->filled('routing_status'), fn ($query) => $query->where('routing_status', $request->string('routing_status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));

                $query->where(function ($nested) use ($search) {
                    $nested
                        ->where('message_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('error_message', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id')
            ->limit((int) min(max((int) $request->integer('limit', 100), 10), 200))
            ->get()
            ->map(function (VipGalleryWebhookLog $log) use ($eventsByGroupId, $groupsById) {
                $event = $log->photo?->event ?: $eventsByGroupId->get((string) $log->phone);

                return [
                    'id' => $log->id,
                    'message_id' => $log->message_id,
                    'phone' => $log->phone,
                    'group_label' => $groupsById->get((string) $log->phone),
                    'detected_type' => $log->detected_type,
                    'routing_status' => $log->routing_status,
                    'error_message' => $log->error_message,
                    'created_at' => optional($log->created_at)?->toIso8601String(),
                    'event_id' => $event?->id,
                    'event_title' => $event?->titulo,
                    'photo_id' => $log->photo?->id,
                    'photo_processing_status' => $log->photo?->processing_status,
                    'sender_name' => $log->photo?->sender_name,
                    'participant_phone' => $log->photo?->participant_phone,
                ];
            })
            ->values();

        $summary = [
            'total_logs' => (int) VipGalleryWebhookLog::query()->count(),
            'received_logs' => (int) VipGalleryWebhookLog::query()->where('routing_status', 'received')->count(),
            'queued_logs' => (int) VipGalleryWebhookLog::query()->whereIn('routing_status', ['queued_ingest', 'queued_delete'])->count(),
            'published_logs' => (int) VipGalleryWebhookLog::query()->where('routing_status', 'published')->count(),
            'failed_logs' => (int) VipGalleryWebhookLog::query()->where('routing_status', 'failed')->count(),
            'total_photos' => (int) VipGalleryPhoto::query()->count(),
            'photos_processed' => (int) VipGalleryPhoto::query()->where('processing_status', VipGalleryPhoto::STATUS_PROCESSED)->count(),
            'photos_failed' => (int) VipGalleryPhoto::query()->where('processing_status', VipGalleryPhoto::STATUS_FAILED)->count(),
            'pending_jobs' => $this->countPendingJobs(),
            'pending_webhook_jobs' => $this->countPendingJobs((string) config('vip_gallery.queues.webhook', 'vip-gallery-webhook')),
            'pending_processing_jobs' => $this->countPendingJobs((string) config('vip_gallery.queues.processing', 'vip-gallery-processing')),
            'failed_jobs' => $this->countFailedJobs(),
        ];

        $queues = $this->queueBreakdown();
        $rootCause = null;

        if (($summary['pending_webhook_jobs'] ?? 0) > 0) {
            $rootCause = 'A fila vip-gallery-webhook possui itens pendentes sem consumo. Enquanto isso ocorrer, os webhooks ficam em received e as fotos nao entram na galeria.';
        }

        return $this->jsonSuccess([
            'summary' => $summary,
            'queues' => $queues,
            'root_cause' => $rootCause,
            'logs' => $logs,
        ]);
    }

    public function updateEventStatus(Request $request, ExternalEvent $event): JsonResponse
    {
        if (! $event->is_vip_gallery) {
            return $this->jsonError(
                'O evento informado nao possui Cobertura VIP ativa',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $validated = $request->validate([
            'vip_gallery_status' => ['required', Rule::in(ExternalEvent::vipGalleryStatuses())],
        ]);

        $previousStatus = (string) $event->vip_gallery_status;
        $nextStatus = (string) $validated['vip_gallery_status'];

        $event->forceFill([
            'vip_gallery_status' => $nextStatus,
        ])->save();

        if ($previousStatus !== $nextStatus) {
            EventActivityLog::log(
                $event->id,
                'vip_gallery_status_updated',
                sprintf('Status da Cobertura VIP alterado de %s para %s.', $previousStatus, $nextStatus),
                [
                    'Status da galeria VIP' => [
                        'de' => $previousStatus,
                        'para' => $nextStatus,
                    ],
                ]
            );
        }

        return $this->jsonSuccess([
            'event_id' => $event->id,
            'vip_gallery_status' => $nextStatus,
        ], 'Status da Cobertura VIP atualizado com sucesso');
    }

    public function uploadLogo(Request $request, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        $maxKilobytes = (int) ceil(((int) config('vip_gallery.images.logo_max_bytes', 2097152)) / 1024);

        $validated = $request->validate([
            'logo' => ['required', 'file', 'mimes:png', "max:{$maxKilobytes}"],
            'event_id' => ['nullable', 'integer', 'exists:external_events,id'],
        ]);

        $stored = $mediaManager->storeUploadedLogo(
            $validated['logo'],
            isset($validated['event_id']) ? (int) $validated['event_id'] : null
        );

        return $this->jsonSuccess($stored, 'Logo enviada com sucesso', 201);
    }

    public function uploadBanners(Request $request, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        $maxKilobytes = (int) ceil(((int) config('vip_gallery.images.banner_max_bytes', 5242880)) / 1024);

        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:external_events,id'],
            'banners' => ['required', 'array', 'min:1'],
            'banners.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$maxKilobytes}"],
        ]);

        $event = ExternalEvent::query()->findOrFail((int) $validated['event_id']);

        if (! $event->is_vip_gallery) {
            return $this->jsonError(
                'O evento precisa estar com a Cobertura VIP ativada para receber banners',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $nextSortOrder = (int) VipGalleryBanner::query()
            ->where('external_event_id', $event->id)
            ->max('sort_order');

        $banners = collect($validated['banners'])
            ->map(function ($file, int $index) use ($event, $mediaManager, $nextSortOrder) {
                $stored = $mediaManager->storeUploadedBanner($file, $event->id);

                return VipGalleryBanner::query()->create([
                    'external_event_id' => $event->id,
                    'image_path' => $stored['path'],
                    'width' => $stored['width'],
                    'height' => $stored['height'],
                    'alt_text' => sprintf('%s - Banner %d', $event->titulo, $nextSortOrder + $index + 1),
                    'sort_order' => $nextSortOrder + $index + 1,
                    'is_active' => true,
                ]);
            })
            ->values();

        return $this->jsonSuccess([
            'banners' => GalleryBannerResource::collection($banners)->resolve($request),
        ], 'Banners enviados com sucesso', 201);
    }

    public function destroyBanner(VipGalleryBanner $banner, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        $mediaManager->deletePath($banner->image_path);
        $banner->delete();

        return $this->jsonDeleted('Banner removido com sucesso');
    }

    public function reorderBanners(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:external_events,id'],
            'banner_ids' => ['required', 'array', 'min:1'],
            'banner_ids.*' => ['required', 'integer', 'distinct', 'exists:vip_gallery_banners,id'],
        ]);

        $eventId = (int) $validated['event_id'];
        $orderedIds = array_values(array_map('intval', $validated['banner_ids']));
        $banners = VipGalleryBanner::query()
            ->where('external_event_id', $eventId)
            ->whereIn('id', $orderedIds)
            ->get()
            ->keyBy('id');

        if ($banners->count() !== count($orderedIds)) {
            return $this->jsonError(
                'Um ou mais banners informados nao pertencem ao evento selecionado',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        DB::transaction(function () use ($orderedIds, $banners) {
            foreach ($orderedIds as $index => $bannerId) {
                $banner = $banners->get($bannerId);
                $banner?->forceFill([
                    'sort_order' => $index + 1,
                ])->save();
            }
        });

        $orderedBanners = VipGalleryBanner::query()
            ->where('external_event_id', $eventId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->jsonSuccess([
            'banners' => GalleryBannerResource::collection($orderedBanners)->resolve($request),
        ], 'Ordem dos banners atualizada com sucesso');
    }

    public function downloadAll(ExternalEvent $event, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        if (! $event->is_vip_gallery) {
            return $this->jsonError(
                'O evento informado nao possui Cobertura VIP ativa',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $photos = VipGalleryPhoto::query()
            ->where('external_event_id', $event->id)
            ->publiclyVisible()
            ->orderBy('published_at')
            ->orderBy('id')
            ->get();

        if ($photos->isEmpty()) {
            return $this->jsonError(
                'Nao existem fotos publicas para compactar neste evento',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $slug = trim((string) ($event->gallery_slug ?: Str::slug($event->titulo)));
        $fileName = sprintf('%s-%s.zip', $slug !== '' ? $slug : 'cobertura-vip', now()->format('Ymd-His'));
        $relativePath = trim((string) config('vip_gallery.base_dir', 'vip-gallery'), '/')."/exports/events/{$event->id}/{$fileName}";
        $absolutePath = Storage::disk('public')->path($relativePath);
        $directory = dirname($absolutePath);

        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }

        $zip = new ZipArchive();
        $opened = $zip->open($absolutePath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($opened !== true) {
            return $this->jsonError(
                'Nao foi possivel iniciar a compactacao das fotos',
                'INTERNAL_SERVER_ERROR',
                500
            );
        }

        $addedFiles = 0;

        foreach ($photos as $index => $photo) {
            $publicPath = $photo->publicImagePath();

            if (! is_string($publicPath) || $publicPath === '' || ! Storage::disk('public')->exists($publicPath)) {
                continue;
            }

            $sourcePath = Storage::disk('public')->path($publicPath);
            $extension = pathinfo($sourcePath, PATHINFO_EXTENSION) ?: 'jpg';
            $entryName = sprintf(
                '%04d-%s.%s',
                $index + 1,
                preg_replace('/[^A-Za-z0-9_-]+/', '-', $photo->zapi_message_id) ?: 'foto',
                $extension
            );

            if ($zip->addFile($sourcePath, $entryName)) {
                $addedFiles++;
            }
        }

        $zip->close();

        if ($addedFiles === 0) {
            @unlink($absolutePath);

            return $this->jsonError(
                'Nenhum arquivo valido foi encontrado para gerar o ZIP deste evento',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        return $this->jsonSuccess([
            'download_url' => $mediaManager->publicUrl($relativePath),
            'file_name' => $fileName,
            'total_files' => $addedFiles,
            'generated_at' => now()->toIso8601String(),
        ], 'Arquivo ZIP gerado com sucesso');
    }

    public function eventPhotos(ExternalEvent $event): JsonResponse
    {
        if (! $event->is_vip_gallery) {
            return $this->jsonError(
                'O evento informado nao possui Cobertura VIP ativa',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $photos = VipGalleryPhoto::query()
            ->where('external_event_id', $event->id)
            ->orderByDesc(DB::raw('COALESCE(received_at, published_at, created_at)'))
            ->orderByDesc('id')
            ->get();
        $timeline = $this->buildEventPhotoTimeline($event->id);

        return $this->jsonSuccess([
            'event_id' => $event->id,
            'event_title' => $event->titulo,
            'total_photos' => $photos->count(),
            'active_photos' => $photos->where('is_approved', true)->count(),
            'inactive_photos' => $photos->where('is_approved', false)->count(),
            'first_photo_sent_at' => $timeline['first_photo_sent_at'],
            'last_photo_sent_at' => $timeline['last_photo_sent_at'],
            'participants' => $this->buildParticipantSummary($event->id),
            'photos' => $photos->map(fn (VipGalleryPhoto $photo) => [
                'id' => $photo->id,
                'zapi_message_id' => $photo->zapi_message_id,
                'sender_name' => $photo->sender_name,
                'participant_phone' => $photo->participant_phone,
                'caption' => $photo->caption,
                'processing_status' => $photo->processing_status,
                'is_approved' => (bool) $photo->is_approved,
                'downloads_count' => (int) $photo->downloads_count,
                'width' => $photo->width,
                'height' => $photo->height,
                'received_at' => optional($photo->received_at)?->toIso8601String(),
                'published_at' => optional($photo->published_at)?->toIso8601String(),
                'created_at' => optional($photo->created_at)?->toIso8601String(),
                'image_url' => $photo->publicImageUrl(),
            ])->values(),
        ]);
    }

    public function updatePhotoApproval(Request $request, VipGalleryPhoto $photo): JsonResponse
    {
        $validated = $request->validate([
            'is_approved' => ['required', 'boolean'],
        ]);

        $previousState = (bool) $photo->is_approved;
        $nextState = (bool) $validated['is_approved'];

        $photo->forceFill([
            'is_approved' => $nextState,
        ])->save();

        EventActivityLog::log(
            $photo->external_event_id,
            'vip_gallery_photo_visibility_updated',
            sprintf(
                'Foto %s da Cobertura VIP foi %s.',
                $photo->zapi_message_id,
                $nextState ? 'reativada' : 'desativada'
            ),
            [
                'Visibilidade da foto' => [
                    'de' => $previousState ? 'Ativa' : 'Desativada',
                    'para' => $nextState ? 'Ativa' : 'Desativada',
                ],
                'Participante' => [
                    'de' => trim((string) ($photo->sender_name ?: $photo->participant_phone)),
                    'para' => trim((string) ($photo->sender_name ?: $photo->participant_phone)),
                ],
            ]
        );

        return $this->jsonSuccess([
            'photo_id' => $photo->id,
            'is_approved' => $nextState,
        ], $nextState ? 'Foto reativada com sucesso' : 'Foto desativada com sucesso');
    }

    public function destroyCoverage(ExternalEvent $event, VipGalleryMediaManager $mediaManager): JsonResponse
    {
        if (! $event->is_vip_gallery) {
            return $this->jsonError(
                'O evento informado nao possui Cobertura VIP ativa',
                'UNPROCESSABLE_ENTITY',
                422
            );
        }

        $photos = VipGalleryPhoto::query()
            ->where('external_event_id', $event->id)
            ->get();
        $banners = VipGalleryBanner::query()
            ->where('external_event_id', $event->id)
            ->get();
        $photoIds = $photos->pluck('id')->all();
        $deletedPhotos = $photos->count();
        $deletedBanners = $banners->count();
        $previousStatus = (string) $event->vip_gallery_status;
        $previousCustomLogoPath = is_string($event->custom_logo_path) ? $event->custom_logo_path : null;
        $baseDir = trim((string) config('vip_gallery.base_dir', 'vip-gallery'), '/');

        DB::transaction(function () use ($event, $photoIds, $deletedPhotos, $deletedBanners, $previousStatus) {
            if (! empty($photoIds)) {
                VipGalleryWebhookLog::query()
                    ->whereIn('vip_gallery_photo_id', $photoIds)
                    ->update([
                        'vip_gallery_photo_id' => null,
                    ]);
            }

            VipGalleryPhoto::query()
                ->where('external_event_id', $event->id)
                ->forceDelete();

            VipGalleryBanner::query()
                ->where('external_event_id', $event->id)
                ->delete();

            $event->forceFill([
                'is_vip_gallery' => false,
                'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_DRAFT,
                'whatsapp_group_id' => null,
                'gallery_slug' => null,
                'custom_logo_path' => null,
                'logo_size_percent' => (int) config('vip_gallery.images.logo_size_percent_default', 12),
                'logo_anchor' => (string) config('vip_gallery.images.logo_position', 'bottom_center'),
                'logo_offset_x_percent' => (float) config('vip_gallery.images.logo_offset_percent_default', 3),
                'logo_offset_y_percent' => (float) config('vip_gallery.images.logo_offset_percent_default', 3),
                'views_count' => 0,
                'allow_pause_command' => false,
                'allow_delete_command' => false,
                'pause_command_keyword' => (string) config('vip_gallery.pause.default_keywords', 'Parar,Pausar'),
                'delete_command_keyword' => (string) config('vip_gallery.delete.default_keywords', 'Deletar,Apagar,Excluir'),
            ])->save();

            EventActivityLog::log(
                $event->id,
                'vip_gallery_deleted',
                sprintf(
                    'Cobertura VIP removida definitivamente. %d foto(s) e %d banner(s) foram apagados.',
                    $deletedPhotos,
                    $deletedBanners
                ),
                [
                    'Cobertura VIP' => [
                        'de' => 'Ativa',
                        'para' => 'Removida',
                    ],
                    'Status da galeria' => [
                        'de' => $previousStatus,
                        'para' => ExternalEvent::VIP_GALLERY_STATUS_DRAFT,
                    ],
                    'Fotos removidas' => [
                        'de' => (string) $deletedPhotos,
                        'para' => '0',
                    ],
                    'Banners removidos' => [
                        'de' => (string) $deletedBanners,
                        'para' => '0',
                    ],
                ]
            );
        });

        foreach ($photos as $photo) {
            $mediaManager->deletePath($photo->original_image_path);
            $mediaManager->deletePath($photo->processed_image_path);
        }

        foreach ($banners as $banner) {
            $mediaManager->deletePath($banner->image_path);
        }

        if (
            is_string($previousCustomLogoPath)
            && $previousCustomLogoPath !== ''
            && ! $mediaManager->isNoLogoPath($previousCustomLogoPath)
        ) {
            $mediaManager->deletePath($previousCustomLogoPath);
        }

        Storage::disk('public')->deleteDirectory("{$baseDir}/events/{$event->id}");
        Storage::disk('public')->deleteDirectory("{$baseDir}/banners/events/{$event->id}");
        Storage::disk('public')->deleteDirectory("{$baseDir}/logos/events/{$event->id}");
        Storage::disk('public')->deleteDirectory("{$baseDir}/exports/events/{$event->id}");

        return $this->jsonSuccess([
            'event_id' => $event->id,
            'deleted_photos' => $deletedPhotos,
            'deleted_banners' => $deletedBanners,
        ], 'Cobertura VIP removida com sucesso');
    }

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

    private function countPendingJobs(?string $queue = null): int
    {
        if (! Schema::hasTable('jobs')) {
            return 0;
        }

        return (int) DB::table('jobs')
            ->when($queue, fn ($query) => $query->where('queue', $queue))
            ->count();
    }

    private function countFailedJobs(): int
    {
        if (! Schema::hasTable('failed_jobs')) {
            return 0;
        }

        return (int) DB::table('failed_jobs')
            ->whereIn('queue', [
                (string) config('vip_gallery.queues.webhook', 'vip-gallery-webhook'),
                (string) config('vip_gallery.queues.processing', 'vip-gallery-processing'),
                (string) config('vip_gallery.queues.ack', 'vip-gallery-ack'),
            ])
            ->count();
    }

    private function queueBreakdown(): array
    {
        if (! Schema::hasTable('jobs')) {
            return [];
        }

        return DB::table('jobs')
            ->select('queue', DB::raw('COUNT(*) as pending'))
            ->whereIn('queue', [
                (string) config('vip_gallery.queues.webhook', 'vip-gallery-webhook'),
                (string) config('vip_gallery.queues.processing', 'vip-gallery-processing'),
                (string) config('vip_gallery.queues.ack', 'vip-gallery-ack'),
            ])
            ->groupBy('queue')
            ->orderBy('queue')
            ->get()
            ->map(fn ($row) => [
                'queue' => (string) $row->queue,
                'pending' => (int) $row->pending,
            ])
            ->values()
            ->all();
    }

    private function buildParticipantSummary(int $eventId): array
    {
        return VipGalleryPhoto::query()
            ->select([
                'participant_phone',
                'sender_name',
                DB::raw('COUNT(*) as total_photos'),
            ])
            ->where('external_event_id', $eventId)
            ->groupBy('participant_phone', 'sender_name')
            ->orderByDesc('total_photos')
            ->orderBy('sender_name')
            ->get()
            ->map(fn ($row) => [
                'participant_phone' => $row->participant_phone,
                'sender_name' => $row->sender_name,
                'total_photos' => (int) $row->total_photos,
            ])
            ->values()
            ->all();
    }

    private function buildEventPhotoTimeline(int $eventId): array
    {
        $timeline = VipGalleryPhoto::query()
            ->select([
                DB::raw('MIN(COALESCE(received_at, published_at, created_at)) as first_photo_sent_at'),
                DB::raw('MAX(COALESCE(received_at, published_at, created_at)) as last_photo_sent_at'),
            ])
            ->where('external_event_id', $eventId)
            ->first();

        return [
            'first_photo_sent_at' => isset($timeline?->first_photo_sent_at)
                ? \Illuminate\Support\Carbon::parse((string) $timeline->first_photo_sent_at)->toIso8601String()
                : null,
            'last_photo_sent_at' => isset($timeline?->last_photo_sent_at)
                ? \Illuminate\Support\Carbon::parse((string) $timeline->last_photo_sent_at)->toIso8601String()
                : null,
        ];
    }
}
