<?php

namespace App\Modules\FestaDivino\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait AuthorizesFestaDivino
{
    protected function authorizeFestaDivino(Request $request, string $permission = 'festa-divino.view'): void
    {
        abort_unless($request->user()?->can($permission), 403);
    }
}
