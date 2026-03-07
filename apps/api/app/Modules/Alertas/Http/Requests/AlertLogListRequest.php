<?php

namespace App\Modules\Alertas\Http\Requests;

class AlertLogListRequest extends BaseAlertasRequest
{
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'alert_id' => ['nullable', 'integer', 'min:1'],
            'destination_id' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'in:pending,success,failed,cancelled,skipped'],
            'search' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ];
    }
}
