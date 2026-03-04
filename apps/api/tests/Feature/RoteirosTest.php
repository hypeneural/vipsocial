<?php

use App\Models\User;
use App\Models\UserPreference;
use App\Modules\Roteiros\Models\Categoria;
use App\Modules\Roteiros\Models\Roteiro;
use App\Modules\Roteiros\Models\Materia;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    $this->admin->assignRole('admin');
    UserPreference::create(['user_id' => $this->admin->id]);
});

// ── Categorias ───────────────────────────────────────────

test('criar categoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/categorias', [
            'nome' => 'Esportes',
            'cor' => '#00FF00',
        ])
        ->assertStatus(201)
        ->assertJson([
            'data' => ['nome' => 'Esportes', 'slug' => 'esportes', 'cor' => '#00FF00'],
        ]);
});

test('listar categorias com filtro', function () {
    Categoria::create(['nome' => 'Política', 'slug' => 'politica', 'active' => true]);
    Categoria::create(['nome' => 'Esportes', 'slug' => 'esportes', 'active' => false]);

    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/categorias?filter[active]=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

// ── Roteiros CRUD ────────────────────────────────────────

test('criar roteiro sem matérias', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/roteiros', [
            'titulo' => 'Jornal da Noite',
            'data' => '2026-03-05',
            'programa' => 'JN',
        ])
        ->assertStatus(201)
        ->assertJson([
            'data' => [
                'titulo' => 'Jornal da Noite',
                'status' => 'rascunho',
                'programa' => 'JN',
            ],
        ]);
});

test('criar roteiro com matérias inline', function () {
    $cat = Categoria::create(['nome' => 'Pol', 'slug' => 'pol']);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/roteiros', [
            'titulo' => 'Jornal Manhã',
            'data' => '2026-03-06',
            'materias' => [
                ['shortcut' => 'VT', 'titulo' => 'Matéria 1', 'duracao' => '01:30'],
                ['shortcut' => 'AO', 'titulo' => 'Matéria 2', 'duracao' => '03:00', 'categoria_id' => $cat->id],
            ],
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.duracao_total', '04:30')
        ->assertJsonCount(2, 'data.materias');
});

test('listar roteiros com filtros', function () {
    Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'status' => 'rascunho', 'created_by' => $this->admin->id]);
    Roteiro::create(['titulo' => 'R2', 'data' => '2026-03-05', 'status' => 'publicado', 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/roteiros?filter[status]=rascunho')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

test('buscar roteiro por id com matérias', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);
    Materia::create(['roteiro_id' => $roteiro->id, 'titulo' => 'M1', 'ordem' => 0]);

    $this->actingAs($this->admin, 'sanctum')
        ->getJson("/api/v1/roteiros/{$roteiro->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data.materias');
});

test('atualizar roteiro', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/roteiros/{$roteiro->id}", [
            'titulo' => 'R1 Atualizado',
            'status' => 'em_producao',
        ])
        ->assertOk()
        ->assertJson([
            'data' => ['titulo' => 'R1 Atualizado', 'status' => 'em_producao'],
        ]);
});

test('deletar roteiro (soft delete)', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/roteiros/{$roteiro->id}")
        ->assertOk();

    $this->assertSoftDeleted('roteiros', ['id' => $roteiro->id]);
});

test('duplicar roteiro com matérias', function () {
    $roteiro = Roteiro::create([
        'titulo' => 'Original',
        'data' => '2026-03-05',
        'status' => 'aprovado',
        'created_by' => $this->admin->id,
    ]);
    Materia::create(['roteiro_id' => $roteiro->id, 'titulo' => 'M1', 'duracao' => '02:00', 'status' => 'aprovado', 'ordem' => 0]);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson("/api/v1/roteiros/{$roteiro->id}/duplicate")
        ->assertStatus(201)
        ->assertJsonPath('data.titulo', 'Original (cópia)')
        ->assertJsonPath('data.status', 'rascunho')
        ->assertJsonCount(1, 'data.materias');
});

// ── Matérias (nested) ────────────────────────────────────

test('adicionar matéria ao roteiro', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson("/api/v1/roteiros/{$roteiro->id}/materias", [
            'shortcut' => 'NOTA',
            'titulo' => 'Nota urgente',
            'duracao' => '00:30',
        ])
        ->assertStatus(201)
        ->assertJson([
            'data' => ['shortcut' => 'NOTA', 'titulo' => 'Nota urgente', 'ordem' => 1],
        ]);
});

test('atualizar matéria', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);
    $materia = Materia::create(['roteiro_id' => $roteiro->id, 'titulo' => 'M1', 'ordem' => 0]);

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/roteiros/{$roteiro->id}/materias/{$materia->id}", [
            'titulo' => 'M1 Atualizada',
            'status' => 'pronto',
        ])
        ->assertOk()
        ->assertJson([
            'data' => ['titulo' => 'M1 Atualizada', 'status' => 'pronto'],
        ]);
});

test('deletar matéria', function () {
    $roteiro = Roteiro::create(['titulo' => 'R1', 'data' => '2026-03-05', 'created_by' => $this->admin->id]);
    $materia = Materia::create(['roteiro_id' => $roteiro->id, 'titulo' => 'M1', 'ordem' => 0]);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/roteiros/{$roteiro->id}/materias/{$materia->id}")
        ->assertOk();

    $this->assertDatabaseMissing('materias', ['id' => $materia->id]);
});

// ── Permissões ───────────────────────────────────────────

test('analista não pode criar roteiro (403)', function () {
    $analyst = User::factory()->create(['role' => 'analyst', 'active' => true]);
    $analyst->assignRole('analyst');

    $this->actingAs($analyst, 'sanctum')
        ->postJson('/api/v1/roteiros', [
            'titulo' => 'Proibido',
            'data' => '2026-03-05',
        ])
        ->assertStatus(403);
});

// ── Gaveta + Notícia ─────────────────────────────────────

test('criar gaveta e adicionar notícia', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/gavetas', ['nome' => 'Banco de Pautas'])
        ->assertStatus(201);

    $gavetaId = Roteiro::query()->getConnection()->table('gavetas')->first()->id;

    $this->actingAs($this->admin, 'sanctum')
        ->postJson("/api/v1/gavetas/{$gavetaId}/noticias", [
            'titulo' => 'Notícia quente',
            'conteudo' => 'Conteúdo da notícia.',
        ])
        ->assertStatus(201);
});
