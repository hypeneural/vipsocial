<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryPhotoJob;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
            'default_logo_url' => $mediaManager->defaultLogoUrl(),
            'no_logo_sentinel' => $mediaManager->noLogoSentinel(),
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
}
