<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseNewsRadarWhatsAppRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
}
