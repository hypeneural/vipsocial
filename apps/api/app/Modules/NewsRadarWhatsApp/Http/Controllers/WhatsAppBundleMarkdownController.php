<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Controllers;

use App\Modules\NewsRadarWhatsApp\Actions\BuildWhatsAppNewsBundleMarkdownAction;
use App\Modules\NewsRadarWhatsApp\Actions\CreateWhatsAppBundleMarkdownExportAction;
use App\Modules\NewsRadarWhatsApp\Actions\EnsureWhatsAppNewsGroupAccessAction;
use App\Modules\NewsRadarWhatsApp\Http\Requests\ExportWhatsAppBundleMarkdownRequest;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppBundleMarkdownExport;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class WhatsAppBundleMarkdownController extends BaseController
{
    public function __construct(
        private readonly EnsureWhatsAppNewsGroupAccessAction $ensureAccess,
        private readonly BuildWhatsAppNewsBundleMarkdownAction $buildMarkdown,
        private readonly CreateWhatsAppBundleMarkdownExportAction $createExport,
    ) {
    }

    public function preview(Request $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);
        $markdown = $this->buildMarkdown->execute($bundle);

        return $this->jsonSuccess([
            'bundle_id' => $bundle->id,
            'lock_version' => $bundle->lock_version,
            'markdown_text' => $markdown,
            'markdown_hash' => hash('sha256', $markdown),
        ], '');
    }

    public function export(ExportWhatsAppBundleMarkdownRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $export = $this->createExport->execute(
                $request->user(),
                $bundle,
                (int) $request->validated('lock_version'),
                (int) ($request->validated('expires_in_minutes') ?? 60)
            );

            return $this->jsonSuccess([
                'bundle_id' => $bundle->id,
                'export_id' => $export->id,
                'bundle_lock_version' => $export->bundle_lock_version,
                'markdown_hash' => $export->markdown_hash,
                'expires_at' => $export->expires_at?->toIso8601String(),
                'signed_url' => url("/api/v1/public/news-radar/whatsapp/markdown-exports/{$export->signed_token}"),
            ], 'Markdown exportado com sucesso');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_MARKDOWN_EXPORT_FAILED', 409);
        }
    }

    public function publicShow(string $token)
    {
        $export = WhatsAppBundleMarkdownExport::query()
            ->where('signed_token', $token)
            ->first();

        if (! $export) {
            return $this->jsonError('Exportacao nao encontrada', 'WHATSAPP_BUNDLE_MARKDOWN_NOT_FOUND', 404);
        }

        if ($export->expires_at->isPast()) {
            return $this->jsonError('Exportacao expirada', 'WHATSAPP_BUNDLE_MARKDOWN_EXPIRED', 410);
        }

        return response($export->markdown_text, 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Cache-Control' => 'private, max-age=60',
        ]);
    }

    private function findAccessibleBundle(int $userId, int $bundleId): WhatsAppNewsBundle
    {
        $bundle = WhatsAppNewsBundle::query()->findOrFail($bundleId);
        $this->ensureAccess->forBundle(\App\Models\User::query()->findOrFail($userId), $bundle);

        return $bundle;
    }
}
