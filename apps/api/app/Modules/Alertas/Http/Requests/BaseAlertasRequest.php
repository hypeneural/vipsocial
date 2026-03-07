<?php

namespace App\Modules\Alertas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseAlertasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
}
