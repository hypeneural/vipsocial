<?php

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function createUser(string $role = 'admin', array $attrs = []): User
{
    $user = User::factory()->create(array_merge([
        'role' => $role,
        'active' => true,
    ], $attrs));
    $user->assignRole($role);
    UserPreference::create(['user_id' => $user->id]);
    return $user;
}

// ── Login ────────────────────────────────────────────────

test('login com credenciais válidas retorna token', function () {
    $user = createUser();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => ['token', 'refresh_token', 'token_type', 'expires_in', 'user'],
            'message',
        ])
        ->assertJson(['success' => true]);
});

test('login com senha errada retorna 422', function () {
    $user = createUser();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])
        ->assertStatus(422);
});

test('login com conta desativada retorna erro', function () {
    $user = createUser('admin', ['active' => false]);

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertStatus(422);
});

// ── Register ─────────────────────────────────────────────

test('register cria user e retorna token', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Novo Jornalista',
        'email' => 'novo@vipsocial.com.br',
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
    ])
        ->assertStatus(201)
        ->assertJson([
            'success' => true,
            'data' => ['token_type' => 'Bearer'],
        ]);

    $this->assertDatabaseHas('users', ['email' => 'novo@vipsocial.com.br']);
});

// ── Me ───────────────────────────────────────────────────

test('/me retorna user autenticado com permissions', function () {
    $user = createUser();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['id', 'name', 'email', 'role', 'preferences', 'permissions'],
        ]);
});

test('/me sem token retorna 401', function () {
    $this->getJson('/api/v1/auth/me')
        ->assertStatus(401)
        ->assertJson(['code' => 'UNAUTHENTICATED']);
});

// ── Logout ───────────────────────────────────────────────

test('logout revoga token', function () {
    $user = createUser();
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/v1/auth/logout')
        ->assertOk()
        ->assertJson(['success' => true]);

    $this->assertDatabaseCount('personal_access_tokens', 0);
});

// ── Update Password ──────────────────────────────────────

test('update password com senha atual correta', function () {
    $user = createUser();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'password',
            'new_password' => 'newsecret123',
            'new_password_confirmation' => 'newsecret123',
        ])
        ->assertOk();
});

test('update password com senha atual errada retorna erro', function () {
    $user = createUser();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'wrong',
            'new_password' => 'newsecret123',
            'new_password_confirmation' => 'newsecret123',
        ])
        ->assertStatus(422);
});
