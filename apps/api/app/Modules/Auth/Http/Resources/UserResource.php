<?php

namespace App\Modules\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            'department' => $this->department,
            'active' => $this->active,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'preferences' => $this->whenLoaded('preferences', function () {
                return [
                    'theme' => $this->preferences->theme,
                    'language' => $this->preferences->language,
                    'notifications_email' => $this->preferences->notifications_email,
                    'notifications_push' => $this->preferences->notifications_push,
                    'notifications_whatsapp' => $this->preferences->notifications_whatsapp,
                    'sidebar_collapsed' => $this->preferences->sidebar_collapsed,
                    'dashboard_widgets' => $this->preferences->dashboard_widgets,
                ];
            }),
            'permissions' => $this->whenLoaded('roles', function () {
                return $this->getAllPermissions()->pluck('name');
            }),
        ];
    }
}
