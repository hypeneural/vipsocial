<?php

namespace App\Modules\UserAiPrompts\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAiPromptTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'content' => $this->content,
            'provider_target' => $this->provider_target?->value ?? $this->provider_target,
            'is_favorite' => (bool) $this->is_favorite,
            'sort_order' => (int) $this->sort_order,
            'usage_count' => (int) $this->usage_count,
            'last_used_at' => $this->last_used_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
