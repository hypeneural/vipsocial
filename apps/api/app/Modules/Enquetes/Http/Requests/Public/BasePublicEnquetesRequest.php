<?php

namespace App\Modules\Enquetes\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

abstract class BasePublicEnquetesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
