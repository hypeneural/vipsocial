<?php

namespace App\Modules\Social\Http\Requests;

class SocialWindowRequest extends BaseSocialRequest
{
    public function rules(): array
    {
        return [
            'window' => ['sometimes', 'string', 'in:7d,30d,90d'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('window')) {
            $this->merge([
                'window' => strtolower(trim((string) $this->input('window'))),
            ]);
        }
    }
}
