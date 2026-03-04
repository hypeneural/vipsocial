<?php

namespace App\Modules\Users\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->can('users.view') || $user->id === $target->id;
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user, User $target): bool
    {
        return $user->can('users.edit') || $user->id === $target->id;
    }

    public function delete(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return false; // Cannot delete yourself
        }

        return $user->can('users.delete');
    }

    public function toggleActive(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return false; // Cannot deactivate yourself
        }

        return $user->can('users.edit');
    }

    public function managePermissions(User $user): bool
    {
        return $user->can('users.edit') && $user->hasRole('admin');
    }
}
