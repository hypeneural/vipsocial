<?php

namespace App\Modules\Social\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseSocialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
}
