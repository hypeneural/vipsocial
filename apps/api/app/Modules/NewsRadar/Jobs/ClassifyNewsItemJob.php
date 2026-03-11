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

class ClassifyNewsItemJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;
    public int $backoff = 30;

    public function __construct(
        public readonly int $newsItemId,
    ) {
        $this->queue = 'news-radar-ai';
    }

    public function handle(AiEnrichmentService $aiService): void
    {
        $item = NewsItem::findOrFail($this->newsItemId);

        // Only process items that are extracted and not yet enriched
        if ($item->extraction_status->value !== 'extracted') return;
        if ($item->enrichment_status->value !== 'none') return;

        try {
            $result = $aiService->classifyBasic($item);

            $item->update([
                'enrichment_status' => EnrichmentStatus::EnrichedL1,
            ]);

            // If relevance is high enough, dispatch Level 2 enrichment
            if ($result->relevanceScore >= 0.7) {
                EnrichNewsItemJob::dispatch($item->id)->onQueue('news-radar-ai');
            }

        } catch (\Throwable $e) {
            $item->update([
                'enrichment_status' => EnrichmentStatus::EnrichmentFailed,
            ]);

            throw $e;
        }
    }
}
