<?php

namespace App\Modules\Pessoas\Http\Controllers;

use App\Models\User;
use App\Support\Http\Controllers\BaseController;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissaoController extends BaseController
{
    /**
     * Definição centralizada dos módulos do sistema.
     * Cada módulo tem: label (nome exibido), slug (usado nas permissions), icon (lucide icon name).
     */
    private function getModules(): array
    {
        return [
            ['label' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'LayoutDashboard'],
            ['label' => 'Pauta do Dia', 'slug' => 'roteiros', 'icon' => 'Newspaper'],
            ['label' => 'Externas', 'slug' => 'externas', 'icon' => 'MapPin'],
            ['label' => 'Cobertura VIP', 'slug' => 'galerias', 'icon' => 'FileText'],
            ['label' => 'Engajamento', 'slug' => 'enquetes', 'icon' => 'BarChart3'],
            ['label' => 'Alertas WhatsApp', 'slug' => 'alertas', 'icon' => 'Zap'],
            ['label' => 'Distribuição', 'slug' => 'distribuicao', 'icon' => 'Workflow'],
            ['label' => 'Automação', 'slug' => 'publicacoes', 'icon' => 'Bot'],
            ['label' => 'Raspagem', 'slug' => 'raspagem', 'icon' => 'Bot'],
            ['label' => 'Pessoas', 'slug' => 'pessoas', 'icon' => 'Users'],
            ['label' => 'Configurações', 'slug' => 'config', 'icon' => 'Settings'],
        ];
    }

    private function getActions(): array
    {
        return ['view', 'create', 'edit', 'delete', 'publish'];
    }

    private function getRoleLabel(string $name): string
    {
        return match ($name) {
            'admin' => 'Administrador',
            'editor' => 'Editor',
            'journalist' => 'Jornalista',
            'media' => 'Mídias',
            'analyst' => 'Analista',
            default => ucfirst($name),
        };
    }

    // ──────────────────────────────────────────────
    // LIST — roles + modules + permission matrix
    // ──────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $roles = Role::where('guard_name', 'web')->get();

        $roleCounts = \DB::table('model_has_roles')
            ->select('role_id', \DB::raw('COUNT(*) as cnt'))
            ->groupBy('role_id')
            ->pluck('cnt', 'role_id');

        $modules = $this->getModules();
        $actions = $this->getActions();

        // Build roles array
        $rolesData = $roles->map(fn(Role $role) => [
            'id' => $role->name,
            'name' => $this->getRoleLabel($role->name),
            'description' => $role->description ?? '',
            'icon' => $role->icon ?? 'Shield',
            'users_count' => $roleCounts[$role->id] ?? 0,
        ]);

        // Build permission matrix
        $permissionMatrix = [];

        foreach ($roles as $role) {
            $rolePermissions = $role->permissions->pluck('name')->toArray();

            foreach ($modules as $mod) {
                $modulePerms = [];
                foreach ($actions as $action) {
                    $permName = "{$mod['slug']}.{$action}";
                    $modulePerms[$action] = in_array($permName, $rolePermissions);
                }
                $permissionMatrix[$role->name][$mod['label']] = [
                    'module' => $mod['label'],
                    'slug' => $mod['slug'],
                    'icon' => $mod['icon'],
                    'permissions' => $modulePerms,
                ];
            }
        }

        return $this->jsonSuccess([
            'roles' => $rolesData,
            'modules' => collect($modules)->map(fn($m) => [
                'label' => $m['label'],
                'slug' => $m['slug'],
                'icon' => $m['icon'],
            ]),
            'permissions' => $permissionMatrix,
        ]);
    }

    // ──────────────────────────────────────────────
    // SHOW — permissions of a single role
    // ──────────────────────────────────────────────

    public function show(string $roleName): JsonResponse
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        return $this->jsonSuccess([
            'role' => $role->name,
            'permissions' => $role->permissions->pluck('name')->toArray(),
        ]);
    }

    // ──────────────────────────────────────────────
    // CREATE ROLE
    // ──────────────────────────────────────────────

    public function storeRole(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin', 'web')) {
            return $this->jsonError('Apenas administradores podem criar perfis', 'FORBIDDEN', 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:roles,name'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $role = Role::create([
            'name' => strtolower(trim($validated['name'])),
            'guard_name' => 'web',
            'description' => $validated['description'] ?? null,
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $this->jsonSuccess([
            'id' => $role->name,
            'name' => $this->getRoleLabel($role->name),
        ], 'Perfil criado com sucesso', 201);
    }

    // ──────────────────────────────────────────────
    // UPDATE ROLE META (name/description)
    // ──────────────────────────────────────────────

    public function updateRole(Request $request, string $roleName): JsonResponse
    {
        if (!$request->user()->hasRole('admin', 'web')) {
            return $this->jsonError('Apenas administradores podem editar perfis', 'FORBIDDEN', 403);
        }

        $role = Role::where('name', $roleName)->firstOrFail();

        if ($role->name === 'admin') {
            return $this->jsonError('O perfil Administrador não pode ser editado', 'FORBIDDEN', 403);
        }

        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $role->update(['description' => $validated['description'] ?? $role->description]);

        return $this->jsonSuccess(null, 'Perfil atualizado');
    }

    // ──────────────────────────────────────────────
    // DELETE ROLE (only if no users)
    // ──────────────────────────────────────────────

    public function destroyRole(Request $request, string $roleName): JsonResponse
    {
        if (!$request->user()->hasRole('admin', 'web')) {
            return $this->jsonError('Apenas administradores podem excluir perfis', 'FORBIDDEN', 403);
        }

        $role = Role::where('name', $roleName)->firstOrFail();

        if ($role->name === 'admin') {
            return $this->jsonError('O perfil Administrador não pode ser excluído', 'FORBIDDEN', 403);
        }

        // Check if users are linked
        $usersCount = \DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->count();

        if ($usersCount > 0) {
            return $this->jsonError(
                "Não é possível excluir o perfil '{$this->getRoleLabel($role->name)}' pois existem {$usersCount} usuário(s) vinculado(s)",
                'CONFLICT',
                409
            );
        }

        $role->delete();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $this->jsonSuccess(null, 'Perfil excluído com sucesso');
    }

    // ──────────────────────────────────────────────
    // ROLE USERS — users linked to a role
    // ──────────────────────────────────────────────

    public function roleUsers(string $roleName): JsonResponse
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        $users = User::role($roleName, 'web')
            ->select('id', 'name', 'email', 'department', 'admission_date')
            ->get()
            ->map(function ($user) {
                $tempoEmpresa = null;
                if ($user->admission_date) {
                    $admission = Carbon::parse($user->admission_date);
                    $years = $admission->diffInYears(now());
                    $months = $admission->diffInMonths(now()) % 12;
                    $tempoEmpresa = $years > 0
                        ? "{$years}a {$months}m"
                        : "{$months} meses";
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department ?? '—',
                    'tempo_empresa' => $tempoEmpresa ?? '—',
                ];
            });

        return $this->jsonSuccess([
            'role' => $this->getRoleLabel($role->name),
            'users' => $users,
        ]);
    }

    // ──────────────────────────────────────────────
    // UPDATE ROLE PERMISSIONS (matrix)
    // ──────────────────────────────────────────────

    public function update(Request $request, string $roleName): JsonResponse
    {
        if (!$request->user()->hasRole('admin', 'web')) {
            return $this->jsonError('Apenas administradores podem alterar permissões', 'FORBIDDEN', 403);
        }

        $role = Role::where('name', $roleName)->firstOrFail();

        if ($role->name === 'admin') {
            return $this->jsonError('Permissões do administrador não podem ser alteradas', 'FORBIDDEN', 403);
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['required', 'array'],
            'permissions.*.permissions' => ['required', 'array'],
        ]);

        $moduleSlugs = collect($this->getModules())->pluck('slug', 'label')->toArray();
        $actions = $this->getActions();

        $newPermissions = [];

        foreach ($validated['permissions'] as $moduleLabel => $moduleData) {
            $slug = $moduleSlugs[$moduleLabel] ?? null;
            if (!$slug)
                continue;

            foreach ($actions as $action) {
                if (!empty($moduleData['permissions'][$action])) {
                    $perm = Permission::firstOrCreate(
                        ['name' => "{$slug}.{$action}"],
                        ['guard_name' => 'web']
                    );
                    $newPermissions[] = $perm;
                }
            }
        }

        $role->syncPermissions($newPermissions);
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $this->jsonSuccess(null, "Permissões do perfil '{$role->name}' atualizadas");
    }

    // ──────────────────────────────────────────────
    // USER DIRECT PERMISSIONS
    // ──────────────────────────────────────────────

    public function userPermissions(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return $this->jsonSuccess([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
            'direct_permissions' => $user->getDirectPermissions()->pluck('name')->values(),
            'all_permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }

    public function updateUserPermissions(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->hasRole('admin', 'web')) {
            return $this->jsonError('Apenas administradores podem alterar permissões', 'FORBIDDEN', 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ]);

        $permissions = Permission::whereIn('name', $validated['permissions'])
            ->where('guard_name', 'web')
            ->get();

        $user->syncPermissions($permissions);
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $this->jsonSuccess(null, "Permissões diretas de '{$user->name}' atualizadas");
    }
}
