<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseEnquetesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
}
