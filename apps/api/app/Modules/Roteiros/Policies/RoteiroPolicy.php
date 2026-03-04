<?php

namespace App\Modules\Roteiros\Policies;

use App\Models\User;
use App\Modules\Roteiros\Models\Roteiro;

class RoteiroPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roteiros.view');
    }

    public function view(User $user, Roteiro $roteiro): bool
    {
        return $user->can('roteiros.view');
    }

    public function create(User $user): bool
    {
        return $user->can('roteiros.create');
    }

    public function update(User $user, Roteiro $roteiro): bool
    {
        return $user->can('roteiros.edit');
    }

    public function delete(User $user, Roteiro $roteiro): bool
    {
        return $user->can('roteiros.delete');
    }

    public function publish(User $user, Roteiro $roteiro): bool
    {
        return $user->can('roteiros.publish');
    }
}
