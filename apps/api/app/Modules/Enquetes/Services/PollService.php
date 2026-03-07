<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollOption;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class PollService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Poll::query()
            ->withTrashed()
            ->with(['options', 'placements'])
            ->withCount([
                'options',
                'placements',
                'votes as valid_votes_count' => fn($voteQuery) => $voteQuery->valid(),
                'voteAttempts as blocked_attempts_count' => fn($attemptQuery) => $attemptQuery->where('status', 'blocked'),
            ])
            ->orderByDesc('id');

        if (blank($filters['include_archived'] ?? false)) {
            $query->where('status', '!=', Poll::STATUS_ARCHIVED);
        }

        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function (Builder $builder) use ($search): void {
                $builder
                    ->where('title', 'like', '%' . $search . '%')
                    ->orWhere('question', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($selectionType = $filters['selection_type'] ?? null) {
            $query->where('selection_type', $selectionType);
        }

        return $query->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function create(array $validated, ?int $userId = null): Poll
    {
        return DB::transaction(function () use ($validated, $userId): Poll {
            $poll = new Poll();
            $this->fillPoll($poll, $validated, $userId, true);
            $poll->save();

            $this->syncOptions($poll, $validated['options'] ?? []);

            return $poll->fresh(['options', 'placements.site']);
        });
    }

    public function update(Poll $poll, array $validated, ?int $userId = null): Poll
    {
        return DB::transaction(function () use ($poll, $validated, $userId): Poll {
            $this->fillPoll($poll, $validated, $userId, false);
            $poll->save();

            $this->syncOptions($poll, $validated['options'] ?? []);

            return $poll->fresh(['options', 'placements.site']);
        });
    }

    public function duplicate(Poll $poll, ?int $userId = null): Poll
    {
        return DB::transaction(function () use ($poll, $userId): Poll {
            $clone = $poll->replicate([
                'public_id',
                'status',
                'created_by',
                'updated_by',
                'deleted_at',
            ]);

            $clone->title = Str::limit($poll->title . ' (Copia)', 191, '');
            $clone->status = Poll::STATUS_DRAFT;
            $clone->created_by = $userId;
            $clone->updated_by = $userId;
            $clone->save();

            foreach ($poll->options()->orderBy('sort_order')->get() as $option) {
                $optionClone = $option->replicate(['public_id']);
                $optionClone->poll_id = $clone->id;
                $optionClone->save();
            }

            return $clone->fresh(['options', 'placements.site']);
        });
    }

    public function changeStatus(Poll $poll, string $status, ?int $userId = null): Poll
    {
        $allowed = [
            Poll::STATUS_DRAFT,
            Poll::STATUS_SCHEDULED,
            Poll::STATUS_LIVE,
            Poll::STATUS_PAUSED,
            Poll::STATUS_CLOSED,
            Poll::STATUS_ARCHIVED,
        ];

        if (!in_array($status, $allowed, true)) {
            throw new RuntimeException('Status de enquete invalido');
        }

        $poll->status = $status;
        $poll->updated_by = $userId;
        $poll->save();

        return $poll->fresh(['options', 'placements.site']);
    }

    public function archive(Poll $poll, ?int $userId = null): void
    {
        $poll->status = Poll::STATUS_ARCHIVED;
        $poll->updated_by = $userId;
        $poll->save();
        $poll->delete();
    }

    public function serialize(Poll $poll): array
    {
        $poll->loadMissing(['options', 'placements.site']);
        $settings = $this->normalizePollSettings($poll->settings ?? []);

        return [
            'id' => $poll->id,
            'public_id' => $poll->public_id,
            'title' => $poll->title,
            'question' => $poll->question,
            'slug' => $poll->slug,
            'status' => $poll->status,
            'selection_type' => $poll->selection_type,
            'max_choices' => $poll->max_choices,
            'vote_limit_mode' => $poll->vote_limit_mode,
            'vote_cooldown_minutes' => $poll->vote_cooldown_minutes,
            'results_visibility' => $poll->results_visibility,
            'after_end_behavior' => $poll->after_end_behavior,
            'starts_at' => optional($poll->starts_at)?->toIso8601String(),
            'ends_at' => optional($poll->ends_at)?->toIso8601String(),
            'timezone' => $poll->timezone,
            'settings' => $settings,
            'options' => $poll->options
                ->sortBy('sort_order')
                ->values()
                ->map(fn(PollOption $option) => $this->serializeOption($option))
                ->all(),
            'placements' => $poll->placements
                ->values()
                ->map(fn($placement) => [
                    'id' => $placement->id,
                    'public_id' => $placement->public_id,
                    'placement_name' => $placement->placement_name,
                    'canonical_url' => $placement->canonical_url,
                    'is_active' => $placement->is_active,
                ])
                ->all(),
            'placements_count' => $poll->placements_count ?? $poll->placements->count(),
            'options_count' => $poll->options_count ?? $poll->options->count(),
            'valid_votes_count' => (int) ($poll->valid_votes_count ?? 0),
            'blocked_attempts_count' => (int) ($poll->blocked_attempts_count ?? 0),
            'created_at' => optional($poll->created_at)?->toIso8601String(),
            'updated_at' => optional($poll->updated_at)?->toIso8601String(),
            'deleted_at' => optional($poll->deleted_at)?->toIso8601String(),
        ];
    }

    public function serializePublic(Poll $poll): array
    {
        $poll->loadMissing('options');
        $settings = $this->normalizePollSettings($poll->settings ?? []);

        return [
            'public_id' => $poll->public_id,
            'title' => $poll->title,
            'question' => $poll->question,
            'status' => $poll->status,
            'selection_type' => $poll->selection_type,
            'max_choices' => $poll->max_choices,
            'results_visibility' => $poll->results_visibility,
            'after_end_behavior' => $poll->after_end_behavior,
            'starts_at' => optional($poll->starts_at)?->toIso8601String(),
            'ends_at' => optional($poll->ends_at)?->toIso8601String(),
            'timezone' => $poll->timezone,
            'settings' => $settings,
            'options' => $poll->options
                ->where('is_active', true)
                ->sortBy('sort_order')
                ->values()
                ->map(fn(PollOption $option) => $this->serializeOption($option))
                ->all(),
        ];
    }

    public function serializeOption(PollOption $option): array
    {
        $media = $option->getFirstMedia('option_image');

        return [
            'id' => $option->id,
            'public_id' => $option->public_id,
            'label' => $option->label,
            'description' => $option->description,
            'sort_order' => $option->sort_order,
            'is_active' => $option->is_active,
            'image_url' => $this->serializeOptionMediaUrl($option, $media, 'web'),
            'image_thumb_url' => $this->serializeOptionMediaUrl($option, $media, 'thumb'),
        ];
    }

    private function serializeOptionMediaUrl(PollOption $option, $media, ?string $preferredConversion = null): ?string
    {
        if ($media === null) {
            return null;
        }

        $conversion = null;

        if (
            $preferredConversion !== null
            && method_exists($media, 'hasGeneratedConversion')
            && $media->hasGeneratedConversion($preferredConversion)
        ) {
            $conversion = $preferredConversion;
        }

        $url = route('enquetes.option-media', array_filter([
            'optionPublicId' => $option->public_id,
            'conversion' => $conversion,
        ], static fn($value) => $value !== null));

        $version = optional($media->updated_at)->getTimestamp();

        return $version ? $url . '?v=' . $version : $url;
    }

    private function fillPoll(Poll $poll, array $validated, ?int $userId, bool $creating): void
    {
        $poll->fill([
            'title' => $validated['title'],
            'question' => $validated['question'],
            'slug' => $validated['slug'] ?? null,
            'status' => $validated['status'],
            'selection_type' => $validated['selection_type'],
            'max_choices' => $validated['selection_type'] === Poll::SELECTION_SINGLE
                ? ($validated['max_choices'] ?? 1)
                : ($validated['max_choices'] ?? null),
            'vote_limit_mode' => $validated['vote_limit_mode'],
            'vote_cooldown_minutes' => $validated['vote_limit_mode'] === Poll::LIMIT_ONCE_PER_WINDOW
                ? ($validated['vote_cooldown_minutes'] ?? null)
                : null,
            'results_visibility' => $validated['results_visibility'],
            'after_end_behavior' => $validated['after_end_behavior'],
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'timezone' => $validated['timezone'],
            'settings' => $this->normalizePollSettings($validated['settings'] ?? []),
            'updated_by' => $userId,
        ]);

        if ($creating) {
            $poll->created_by = $userId;
        }
    }

    private function syncOptions(Poll $poll, array $optionsPayload): void
    {
        foreach ($optionsPayload as $index => $optionData) {
            $option = null;

            if (!empty($optionData['id'])) {
                $option = $poll->options()->whereKey($optionData['id'])->first();
            }

            if ($option === null) {
                $option = new PollOption();
                $option->poll_id = $poll->id;
            }

            $option->fill([
                'label' => $optionData['label'],
                'description' => $optionData['description'] ?? null,
                'sort_order' => $optionData['sort_order'] ?? $index,
                'is_active' => array_key_exists('is_active', $optionData)
                    ? (bool) $optionData['is_active']
                    : true,
            ]);
            $option->save();
        }
    }

    private function normalizePollSettings(array $settings): array
    {
        $widgetTemplate = (string) ($settings['widget_template'] ?? '');
        $resultValueMode = (string) ($settings['result_value_mode'] ?? '');

        return array_merge($settings, [
            'widget_template' => in_array($widgetTemplate, ['editorial_card', 'clean_white'], true)
                ? $widgetTemplate
                : 'editorial_card',
            'result_value_mode' => in_array($resultValueMode, ['percentage', 'votes', 'both'], true)
                ? $resultValueMode
                : 'both',
        ]);
    }
}
