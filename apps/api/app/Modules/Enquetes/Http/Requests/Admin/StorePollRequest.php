<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

use App\Modules\Enquetes\Models\Poll;
use Illuminate\Validation\Validator;

class StorePollRequest extends BaseEnquetesRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => $this->input('status', Poll::STATUS_DRAFT),
            'selection_type' => $this->input('selection_type', Poll::SELECTION_SINGLE),
            'vote_limit_mode' => $this->input('vote_limit_mode', Poll::LIMIT_ONCE_EVER),
            'results_visibility' => $this->input('results_visibility', Poll::RESULTS_LIVE),
            'after_end_behavior' => $this->input('after_end_behavior', Poll::END_SHOW_RESULTS_ONLY),
            'timezone' => $this->input('timezone', (string) config('enquetes.timezone', 'America/Sao_Paulo')),
            'options' => array_values((array) $this->input('options', [])),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'question' => ['required', 'string', 'max:5000'],
            'slug' => ['nullable', 'string', 'max:191'],
            'status' => ['required', 'string', 'in:draft,scheduled,live,paused,closed,archived'],
            'selection_type' => ['required', 'string', 'in:single,multiple'],
            'max_choices' => ['nullable', 'integer', 'min:1', 'max:20'],
            'vote_limit_mode' => ['required', 'string', 'in:once_ever,once_per_day,once_per_window'],
            'vote_cooldown_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'],
            'results_visibility' => ['required', 'string', 'in:live,after_vote,after_end,never'],
            'after_end_behavior' => ['required', 'string', 'in:hide_widget,show_closed_message,show_results_only'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'timezone' => ['required', 'string', 'max:100'],
            'settings' => ['nullable', 'array'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.id' => ['nullable', 'integer', 'min:1'],
            'options.*.label' => ['required', 'string', 'max:191'],
            'options.*.description' => ['nullable', 'string', 'max:2000'],
            'options.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'options.*.is_active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $selectionType = (string) $this->input('selection_type');
            $maxChoices = $this->input('max_choices');
            $voteLimitMode = (string) $this->input('vote_limit_mode');
            $cooldown = $this->input('vote_cooldown_minutes');
            $startsAt = $this->input('starts_at');
            $endsAt = $this->input('ends_at');

            if ($selectionType === Poll::SELECTION_SINGLE && $maxChoices !== null && (int) $maxChoices > 1) {
                $validator->errors()->add('max_choices', 'max_choices deve ser null ou 1 para enquetes single');
            }

            if ($selectionType === Poll::SELECTION_MULTIPLE && (blank($maxChoices) || (int) $maxChoices < 2)) {
                $validator->errors()->add('max_choices', 'max_choices deve ser informado e maior ou igual a 2 para enquetes multiple');
            }

            if ($voteLimitMode === Poll::LIMIT_ONCE_PER_WINDOW && blank($cooldown)) {
                $validator->errors()->add('vote_cooldown_minutes', 'vote_cooldown_minutes e obrigatorio para once_per_window');
            }

            if (filled($startsAt) && filled($endsAt) && strtotime((string) $endsAt) <= strtotime((string) $startsAt)) {
                $validator->errors()->add('ends_at', 'ends_at deve ser maior que starts_at');
            }
        });
    }
}
