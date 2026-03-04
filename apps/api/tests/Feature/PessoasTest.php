<?php

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->admin = User::factory()->create([
        'role' => 'admin',
        'active' => true,
        'department' => 'Produção',
        'birth_date' => '1990-03-15',
        'admission_date' => '2020-01-10',
    ]);
    $this->admin->assignRole('admin');
    UserPreference::create(['user_id' => $this->admin->id]);

    $this->journalist = User::factory()->create([
        'role' => 'journalist',
        'active' => true,
        'department' => 'Redação',
        'birth_date' => '1988-03-05',
        'admission_date' => '2022-06-01',
    ]);
    $this->journalist->assignRole('journalist');
    UserPreference::create(['user_id' => $this->journalist->id]);
});

// ── Colaboradores ────────────────────────────────────────

test('listar colaboradores com campos computados', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/colaboradores')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'department',
                    'profile',
                    'status',
                    'birth_date',
                    'admission_date',
                    'years_of_service',
                    'days_until_birthday',
                ]
            ],
            'meta',
        ]);
});

test('filtrar colaboradores por department', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/colaboradores?filter[department]=Redação')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

test('filtrar colaboradores por profile (role)', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/colaboradores?filter[profile]=journalist')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

test('stats retorna contagens corretas', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/colaboradores/stats')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['total', 'active', 'birthdays_this_month', 'upcoming_milestones'],
        ])
        ->assertJsonPath('data.total', 2)
        ->assertJsonPath('data.active', 2);
});

test('ver detalhe de colaborador', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson("/api/v1/pessoas/colaboradores/{$this->journalist->id}")
        ->assertOk()
        ->assertJsonPath('data.name', $this->journalist->name)
        ->assertJsonPath('data.department', 'Redação')
        ->assertJsonPath('data.profile', 'journalist');
});

test('atualizar colaborador com role change', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/pessoas/colaboradores/{$this->journalist->id}", [
            'department' => 'Economia',
            'profile' => 'editor',
        ])
        ->assertOk()
        ->assertJsonPath('data.department', 'Economia')
        ->assertJsonPath('data.profile', 'editor');

    // Verify role actually changed in Spatie
    $this->journalist->refresh();
    expect($this->journalist->hasRole('editor'))->toBeTrue();
});

// ── Permissões ───────────────────────────────────────────

test('listar matriz de permissões', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/permissoes')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'roles' => ['*' => ['id', 'name', 'description', 'users_count']],
                'modules',
                'permissions',
            ],
        ]);
});

test('ver permissões de um role', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/pessoas/permissoes/editor')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['role', 'permissions'],
        ]);
});

test('atualizar permissões de um role', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->putJson('/api/v1/pessoas/permissoes/analyst', [
            'permissions' => [
                'Dashboard' => ['permissions' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false, 'publish' => false]],
                'Pauta do Dia' => ['permissions' => ['view' => true, 'create' => true, 'edit' => false, 'delete' => false, 'publish' => false]],
            ],
        ])
        ->assertOk();

    // Verify permissions changed
    $analyst = Role::findByName('analyst', 'web');
    expect($analyst->hasPermissionTo('roteiros.create'))->toBeTrue();
});

test('não pode alterar permissões do admin', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->putJson('/api/v1/pessoas/permissoes/admin', [
            'permissions' => [
                'Dashboard' => ['permissions' => ['view' => false]],
            ],
        ])
        ->assertStatus(403);
});

test('jornalista não pode alterar permissões', function () {
    $this->actingAs($this->journalist, 'sanctum')
        ->putJson('/api/v1/pessoas/permissoes/analyst', [
            'permissions' => [],
        ])
        ->assertStatus(403);
});
