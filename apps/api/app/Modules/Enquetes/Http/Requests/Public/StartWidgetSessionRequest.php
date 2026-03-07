<?php

namespace App\Modules\Enquetes\Http\Requests\Public;

class StartWidgetSessionRequest extends BasePublicEnquetesRequest
{
    public function rules(): array
    {
        return [
            'placement_public_id' => ['required', 'string', 'max:26'],
            'session_token' => ['nullable', 'string', 'max:191'],
            'fingerprint' => ['nullable', 'string', 'max:500'],
            'external_user_id' => ['nullable', 'string', 'max:191'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
