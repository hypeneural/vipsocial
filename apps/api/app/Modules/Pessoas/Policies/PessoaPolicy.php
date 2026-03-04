<?php

namespace App\Modules\Pessoas\Policies;

use App\Models\User;

class PessoaPolicy
{
    /**
     * Qualquer autenticado pode ver colaboradores.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('pessoas.view');
    }

    public function view(User $user): bool
    {
        return $user->can('pessoas.view');
    }

    /**
     * Apenas admin pode editar colaboradores.
     */
    public function update(User $user): bool
    {
        return $user->can('pessoas.edit');
    }

    /**
     * Apenas admin pode gerenciar permissões.
     */
    public function managePermissions(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
