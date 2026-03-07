<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollPlacement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PollPlacementService
{
    public function listForPoll(Poll $poll): Collection
    {
        return $poll->placements()
            ->with('site')
            ->orderByDesc('id')
            ->get();
    }

    public function create(Poll $poll, array $validated): PollPlacement
    {
        return DB::transaction(function () use ($poll, $validated): PollPlacement {
            $placement = new PollPlacement();
            $placement->poll_id = $poll->id;
            $this->fillPlacement($placement, $validated);
            $placement->save();

            return $placement->fresh('site');
        });
    }

    public function update(PollPlacement $placement, array $validated): PollPlacement
    {
        return DB::transaction(function () use ($placement, $validated): PollPlacement {
            $this->fillPlacement($placement, $validated);
            $placement->save();

            return $placement->fresh('site');
        });
    }

    public function toggle(PollPlacement $placement): PollPlacement
    {
        $placement->is_active = !$placement->is_active;
        $placement->save();

        return $placement->fresh('site');
    }

    public function serialize(PollPlacement $placement): array
    {
        $placement->loadMissing('site');

        return [
            'id' => $placement->id,
            'public_id' => $placement->public_id,
            'poll_id' => $placement->poll_id,
            'poll_site_id' => $placement->poll_site_id,
            'placement_name' => $placement->placement_name,
            'article_external_id' => $placement->article_external_id,
            'article_title' => $placement->article_title,
            'canonical_url' => $placement->canonical_url,
            'page_path' => $placement->page_path,
            'is_active' => $placement->is_active,
            'last_seen_at' => optional($placement->last_seen_at)?->toIso8601String(),
            'embed_url' => url('/embed/enquetes/' . $placement->public_id),
            'site' => $placement->site ? [
                'id' => $placement->site->id,
                'name' => $placement->site->name,
                'public_key' => $placement->site->public_key,
            ] : null,
            'created_at' => optional($placement->created_at)?->toIso8601String(),
            'updated_at' => optional($placement->updated_at)?->toIso8601String(),
        ];
    }

    private function fillPlacement(PollPlacement $placement, array $validated): void
    {
        $placement->fill([
            'poll_site_id' => $validated['poll_site_id'] ?? null,
            'placement_name' => $validated['placement_name'],
            'article_external_id' => $validated['article_external_id'] ?? null,
            'article_title' => $validated['article_title'] ?? null,
            'canonical_url' => $validated['canonical_url'] ?? null,
            'page_path' => $validated['page_path'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);
    }
}
