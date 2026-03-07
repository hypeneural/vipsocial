<?php

namespace App\Modules\Enquetes\Http\Requests\Public;

class SubmitVoteRequest extends BasePublicEnquetesRequest
{
    public function rules(): array
    {
        return [
            'placement_public_id' => ['required', 'string', 'max:26'],
            'session_token' => ['nullable', 'string', 'max:191'],
            'fingerprint' => ['nullable', 'string', 'max:500'],
            'external_user_id' => ['nullable', 'string', 'max:191'],
            'option_public_ids' => ['required', 'array', 'min:1', 'max:20'],
            'option_public_ids.*' => ['required', 'string', 'max:26', 'distinct'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
