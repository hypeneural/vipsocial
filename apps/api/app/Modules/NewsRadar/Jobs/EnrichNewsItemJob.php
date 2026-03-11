<?php

namespace App\Modules\NewsRadar\Jobs;

use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Services\AiEnrichmentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EnrichNewsItemJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 90;
    public int $backoff = 60;

    public function __construct(
        public readonly int $newsItemId,
    ) {
        $this->queue = 'news-radar-ai';
    }

    public function handle(AiEnrichmentService $aiService): void
    {
        $item = NewsItem::findOrFail($this->newsItemId);

        // Only process items at Level 1
        if ($item->enrichment_status->value !== 'enriched_l1') return;

        try {
            $aiService->enrichEditorial($item);

            $item->update([
                'enrichment_status' => EnrichmentStatus::EnrichedL2,
            ]);

        } catch (\Throwable $e) {
            // Keep enriched_l1 status — can retry later
            // Don't downgrade to failed since L1 data is still valid
            report($e);
        }
    }
}
