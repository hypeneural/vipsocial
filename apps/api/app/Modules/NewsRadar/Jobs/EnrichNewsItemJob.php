<?php

namespace App\Modules\NewsRadar\Jobs;

use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiLog;
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
            $result = $aiService->enrichEditorial($item);

            NewsItemAiLog::recordSuccess(
                item: $item,
                stage: 'editorial',
                model: $result->model,
                tokensUsed: $result->tokensUsed,
                meta: [
                    'enrichment_level' => 'level_2',
                ],
            );

            $item->update([
                'enrichment_status' => EnrichmentStatus::EnrichedL2,
            ]);
        } catch (\Throwable $e) {
            NewsItemAiLog::recordFailure(
                item: $item,
                stage: 'editorial',
                model: $aiService->editorialModel(),
                throwable: $e,
            );

            // Keep enriched_l1 status so the item stays usable while we retry.
            report($e);
        }
    }
}
