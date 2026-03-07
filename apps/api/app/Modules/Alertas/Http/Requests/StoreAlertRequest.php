<?php

namespace App\Modules\Alertas\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAlertRequest extends BaseAlertasRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'active' => $this->has('active') ? $this->boolean('active') : true,
            'destination_ids' => $this->input('destination_ids', []),
            'schedule_rules' => $this->input('schedule_rules', []),
            'schedules' => $this->input('schedules', []),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'message' => ['required', 'string', 'max:4096'],
            'active' => ['nullable', 'boolean'],
            'destination_ids' => ['required', 'array', 'min:1'],
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
            $scheduleRules = $this->input('schedule_rules', []);
            $legacySchedules = $this->input('schedules', []);

            if (empty($scheduleRules) && empty($legacySchedules)) {
                $validator->errors()->add('schedule_rules', 'Informe pelo menos uma regra de agendamento');
            }

            foreach ((array) $scheduleRules as $index => $rule) {
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

            foreach ((array) $legacySchedules as $index => $schedule) {
                $days = (string) ($schedule['days_of_week'] ?? '');
                $times = (array) ($schedule['times'] ?? []);
                $specificDate = $schedule['specific_date'] ?? null;

                if ($days === '' && blank($specificDate)) {
                    $validator->errors()->add("schedules.{$index}", 'Cada schedule legado precisa de days_of_week ou specific_date');
                }

                if (empty($times)) {
                    $validator->errors()->add("schedules.{$index}.times", 'Cada schedule legado precisa de pelo menos um horario');
                }
            }
        });
    }
}
