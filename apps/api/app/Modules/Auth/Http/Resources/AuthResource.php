<?php

namespace App\Modules\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'token' => $this['token'],
            'refresh_token' => $this['refresh_token'],
            'token_type' => $this['token_type'] ?? 'Bearer',
            'expires_in' => $this['expires_in'] ?? 3600,
            'user' => $this['user'] ? new UserResource($this['user']) : null,
        ];
    }
}
