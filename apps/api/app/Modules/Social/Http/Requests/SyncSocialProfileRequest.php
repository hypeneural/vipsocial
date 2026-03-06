<?php

namespace App\Modules\Social\Http\Requests;

class SyncSocialProfileRequest extends BaseSocialRequest
{
    public function rules(): array
    {
        return [
            'input_override' => ['nullable', 'array'],
        ];
    }
}
