<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $modules = [
            'dashboard',
            'analytics',
            'users',
            'pessoas',
            'roteiros',
            'alertas',
            'distribuicao',
            'enquetes',
            'externas',
            'equipamentos',
            'galerias',
            'publicacoes',
            'categorias',
            'config',
            'raspagem',
            'audit',
        ];

        $actions = ['view', 'create', 'edit', 'delete', 'publish'];

        // Create permissions per module
        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}", 'guard_name' => 'web']);
            }
        }

        // ── Roles ────────────────────────────────────────

        $admin = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            ['description' => 'Acesso total ao sistema', 'icon' => 'ShieldCheck']
        );
        $admin->update(['description' => 'Acesso total ao sistema', 'icon' => 'ShieldCheck']);
        $admin->syncPermissions(Permission::all());

        $editor = Role::firstOrCreate(
            ['name' => 'editor', 'guard_name' => 'web'],
            ['description' => 'Pode publicar e aprovar conteúdo', 'icon' => 'PenSquare']
        );
        $editor->update(['description' => 'Pode publicar e aprovar conteúdo', 'icon' => 'PenSquare']);
        $editor->syncPermissions(
            Permission::whereIn(
                'name',
                collect($modules)->crossJoin(['view', 'create', 'edit', 'publish'])
                    ->map(fn($pair) => "{$pair[0]}.{$pair[1]}")
                    ->toArray()
            )->get()
        );

        $journalist = Role::firstOrCreate(
            ['name' => 'journalist', 'guard_name' => 'web'],
            ['description' => 'Cria e edita conteúdo', 'icon' => 'Newspaper']
        );
        $journalist->update(['description' => 'Cria e edita conteúdo', 'icon' => 'Newspaper']);
        $journalist->syncPermissions(
            Permission::whereIn('name', [
                'roteiros.view',
                'roteiros.create',
                'roteiros.edit',
                'alertas.view',
                'distribuicao.view',
                'enquetes.view',
                'externas.view',
                'externas.create',
                'externas.edit',
                'equipamentos.view',
                'galerias.view',
                'galerias.create',
                'galerias.edit',
                'publicacoes.view',
                'publicacoes.edit',
                'categorias.view',
            ])->get()
        );

        $media = Role::firstOrCreate(
            ['name' => 'media', 'guard_name' => 'web'],
            ['description' => 'Gerencia mídias sociais', 'icon' => 'Smartphone']
        );
        $media->update(['description' => 'Gerencia mídias sociais', 'icon' => 'Smartphone']);
        $media->syncPermissions(
            Permission::whereIn('name', [
                'galerias.view',
                'galerias.create',
                'galerias.edit',
                'galerias.publish',
                'equipamentos.view',
                'equipamentos.create',
                'equipamentos.edit',
                'externas.view',
                'publicacoes.view',
            ])->get()
        );

        $analyst = Role::firstOrCreate(
            ['name' => 'analyst', 'guard_name' => 'web'],
            ['description' => 'Visualiza relatórios e análises', 'icon' => 'BarChart3']
        );
        $analyst->update(['description' => 'Visualiza relatórios e análises', 'icon' => 'BarChart3']);
        $analyst->syncPermissions(
            Permission::where('name', 'like', '%.view')->get()
        );
    }
}
