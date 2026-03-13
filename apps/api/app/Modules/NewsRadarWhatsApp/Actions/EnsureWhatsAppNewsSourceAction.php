<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Modules\NewsRadar\Enums\SourceType;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\WhatsApp\Models\WhatsAppGroup;

class EnsureWhatsAppNewsSourceAction
{
    public function execute(WhatsAppGroup $group): NewsSource
    {
        if ($group->news_source_id) {
            $existing = NewsSource::query()->find($group->news_source_id);

            if ($existing) {
                return $existing;
            }
        }

        $source = NewsSource::query()->create([
            'name' => $group->default_label ?: $group->name ?: $group->group_id,
            'homepage_url' => sprintf('internal://whatsapp-group/%s', $group->provider_group_id ?: $group->group_id),
            'active' => true,
            'source_type' => SourceType::Whatsapp,
            'notes' => 'Fonte criada automaticamente a partir de agrupamento editorial do WhatsApp.',
        ]);

        $group->forceFill([
            'news_source_id' => $source->id,
        ])->save();

        return $source;
    }
}
