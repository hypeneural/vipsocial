<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

class PollOptionImageRequest extends BaseEnquetesRequest
{
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'mimetypes:' . implode(',', (array) config('enquetes.media.allowed_mime_types', [])),
                'max:' . (int) config('enquetes.media.max_file_size_kb', 2048),
            ],
        ];
    }
}
