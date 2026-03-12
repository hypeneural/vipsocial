<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;

class BuildWhatsAppNewsBundleMarkdownAction
{
    public function execute(WhatsAppNewsBundle $bundle): string
    {
        $bundle->loadMissing(['group', 'items.event.media']);

        $lines = [
            '# Bundle WhatsApp',
            '',
            sprintf('Grupo: %s', $bundle->group?->name ?? $bundle->whatsapp_group_fk),
            sprintf('Bundle ID: %d', $bundle->id),
            sprintf('Status: %s', $bundle->status),
        ];

        if ($bundle->title) {
            $lines[] = sprintf('Titulo: %s', $bundle->title);
        }

        if ($bundle->summary) {
            $lines[] = '';
            $lines[] = '## Resumo';
            $lines[] = $bundle->summary;
        }

        $lines[] = '';
        $lines[] = '## Mensagens';

        foreach ($bundle->items as $index => $item) {
            $event = $item->event;

            if (! $event) {
                continue;
            }

            $lines[] = '';
            $lines[] = sprintf(
                '%d. [%s] %s',
                $index + 1,
                $event->sent_at?->format('d/m/Y H:i:s') ?? 'sem data',
                $event->sender_name ?: 'Remetente nao identificado'
            );

            if ($event->text_message) {
                $lines[] = $event->text_message;
            }

            if ($event->link_url) {
                $lines[] = sprintf('Link: %s', $event->link_url);
            }

            foreach ($event->media as $media) {
                $lines[] = sprintf(
                    'Midia [%s]: %s',
                    $media->kind,
                    $media->storage_path ?: $media->source_url ?: 'indisponivel'
                );
            }
        }

        return implode("\n", $lines) . "\n";
    }
}
