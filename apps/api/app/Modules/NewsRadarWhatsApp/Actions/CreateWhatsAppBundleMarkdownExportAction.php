<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppBundleMarkdownExport;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Support\Str;

class CreateWhatsAppBundleMarkdownExportAction
{
    public function __construct(
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
        private readonly BuildWhatsAppNewsBundleMarkdownAction $buildMarkdown,
    ) {
    }

    public function execute(User $user, WhatsAppNewsBundle $bundle, int $lockVersion, int $expiresInMinutes = 60): WhatsAppBundleMarkdownExport
    {
        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        $markdown = $this->buildMarkdown->execute($bundle);

        return WhatsAppBundleMarkdownExport::query()->create([
            'bundle_id' => $bundle->id,
            'bundle_lock_version' => $bundle->lock_version,
            'markdown_text' => $markdown,
            'markdown_hash' => hash('sha256', $markdown),
            'signed_token' => Str::random(64),
            'expires_at' => now()->addMinutes($expiresInMinutes),
            'created_by' => $user->getKey(),
        ]);
    }
}
