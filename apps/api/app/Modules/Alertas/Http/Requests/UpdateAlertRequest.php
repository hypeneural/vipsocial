<?php

namespace App\Modules\Alertas\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAlertRequest extends BaseAlertasRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('active')) {
            $this->merge([
                'active' => $this->boolean('active'),
            ]);
        }

        if ($this->has('destination_ids')) {
            $this->merge([
                'destination_ids' => $this->input('destination_ids', []),
            ]);
        }

        if ($this->has('schedule_rules')) {
            $this->merge([
                'schedule_rules' => $this->input('schedule_rules', []),
            ]);
        }

        if ($this->has('schedules')) {
            $this->merge([
                'schedules' => $this->input('schedules', []),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:191'],
            'message' => ['sometimes', 'required', 'string', 'max:4096'],
            'active' => ['nullable', 'boolean'],
            'destination_ids' => ['nullable', 'array'],
            'destination_ids.*' => [
                'integer',
                'min:1',
                'distinct',
                Rule::exists('alert_destinations', 'id')->whereNull('archived_at'),
            ],
            'schedule_rules' => ['nullable', 'array'],
            'schedule_rules.*.schedule_type' => ['required_with:schedule_rules', 'string', 'in:weekly,specific_date'],
            'schedule_rules.*.day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'schedule_rules.*.specific_date' => ['nullable', 'date'],
            'schedule_rules.*.time_hhmm' => ['required_with:schedule_rules', 'date_format:H:i'],
            'schedule_rules.*.active' => ['nullable', 'boolean'],
            'schedules' => ['nullable', 'array'],
            'schedules.*.days_of_week' => ['nullable', 'string', 'regex:/^[01]{7}$/'],
            'schedules.*.times' => ['nullable', 'array'],
            'schedules.*.times.*' => ['date_format:H:i'],
            'schedules.*.specific_date' => ['nullable', 'date'],
            'schedules.*.active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ((array) $this->input('schedule_rules', []) as $index => $rule) {
                $type = $rule['schedule_type'] ?? null;
                $hasDay = array_key_exists('day_of_week', $rule) && $rule['day_of_week'] !== null;
                $hasDate = array_key_exists('specific_date', $rule) && filled($rule['specific_date']);

                if ($type === 'weekly' && (!$hasDay || $hasDate)) {
                    $validator->errors()->add("schedule_rules.{$index}", 'Regra semanal deve ter day_of_week e nao pode ter specific_date');
                }

                if ($type === 'specific_date' && (!$hasDate || $hasDay)) {
                    $validator->errors()->add("schedule_rules.{$index}", 'Regra de data especifica deve ter specific_date e nao pode ter day_of_week');
                }
            }
        });
    }
}
