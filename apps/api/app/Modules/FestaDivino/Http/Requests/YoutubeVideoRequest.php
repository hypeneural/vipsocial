<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class YoutubeVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => [$this->isMethod('post') ? 'required' : 'prohibited', 'string', 'regex:/\A[A-Za-z0-9_-]{11}\z/'],
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['required', 'string'],
            'thumb_url' => ['nullable', 'url:http,https', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->isMethod('post') || $validator->errors()->has('id')) {
                return;
            }

            $exists = DB::connection(config('festa-divino.read_connection', 'festa_divino_read'))
                ->table('youtube_videos')
                ->where('id', $this->input('id'))
                ->exists();

            if ($exists) {
                $validator->errors()->add('id', 'Ja existe um video com este ID.');
            }
        });
    }

    public function attributes(): array
    {
        return [
            'id' => 'ID do YouTube',
            'titulo' => 'titulo',
            'descricao' => 'descricao',
            'thumb_url' => 'imagem',
        ];
    }
}
