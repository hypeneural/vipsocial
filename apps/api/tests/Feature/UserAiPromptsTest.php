<?php

use App\Models\User;
use App\Modules\UserAiPrompts\Models\UserAiPromptTemplate;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'active' => true,
    ]);
    $this->admin->assignRole('admin');

    $this->journalist = User::factory()->create([
        'role' => 'journalist',
        'active' => true,
    ]);
    $this->journalist->assignRole('journalist');

    $this->outsider = User::factory()->create([
        'role' => 'journalist',
        'active' => true,
    ]);
    $this->outsider->assignRole('journalist');

    $this->noRoleUser = User::factory()->create([
        'role' => 'viewer',
        'active' => true,
    ]);
});

function makeUserAiPrompt(User $user, array $overrides = []): UserAiPromptTemplate
{
    static $sequence = 1;

    return UserAiPromptTemplate::create(array_merge([
        'user_id' => $user->id,
        'name' => "Prompt {$sequence}",
        'description' => "Descricao {$sequence}",
        'content' => "Conteudo {$sequence}\n{{md_url}}",
        'provider_target' => 'generic',
        'is_favorite' => false,
        'sort_order' => $sequence++,
        'usage_count' => 0,
        'last_used_at' => null,
    ], $overrides));
}

test('list endpoint returns empty state for authenticated user with permission', function () {
    $this->actingAs($this->journalist, 'sanctum')
        ->getJson('/api/v1/user/ai-prompts')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(0, 'data')
        ->assertJsonPath('meta.total', 0);
});

test('list endpoint forbids authenticated user without permission', function () {
    $this->actingAs($this->noRoleUser, 'sanctum')
        ->getJson('/api/v1/user/ai-prompts')
        ->assertForbidden();
});

test('crud flow works for owned prompt templates', function () {
    $createResponse = $this->actingAs($this->journalist, 'sanctum')
        ->postJson('/api/v1/user/ai-prompts', [
            'name' => 'Prompt Operacional',
            'description' => 'Descricao operacional',
            'content' => "Instrucoes\n{{md_url}}",
            'provider_target' => 'chatgpt',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Prompt Operacional')
        ->assertJsonPath('data.provider_target', 'chatgpt')
        ->assertJsonPath('data.sort_order', 1);

    $templateId = $createResponse->json('data.id');

    $this->assertDatabaseHas('user_ai_prompt_templates', [
        'id' => $templateId,
        'user_id' => $this->journalist->id,
        'name' => 'Prompt Operacional',
        'provider_target' => 'chatgpt',
    ]);

    $this->actingAs($this->journalist, 'sanctum')
        ->getJson("/api/v1/user/ai-prompts/{$templateId}")
        ->assertOk()
        ->assertJsonPath('data.id', $templateId)
        ->assertJsonPath('data.content', "Instrucoes\n{{md_url}}");

    $this->actingAs($this->journalist, 'sanctum')
        ->putJson("/api/v1/user/ai-prompts/{$templateId}", [
            'name' => 'Prompt Atualizado',
            'provider_target' => 'claude',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Prompt Atualizado')
        ->assertJsonPath('data.provider_target', 'claude');

    $this->actingAs($this->journalist, 'sanctum')
        ->deleteJson("/api/v1/user/ai-prompts/{$templateId}")
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Template arquivado.');

    $this->assertSoftDeleted('user_ai_prompt_templates', [
        'id' => $templateId,
    ]);
});

test('users can only access their own prompt templates', function () {
    $template = makeUserAiPrompt($this->journalist);

    $this->actingAs($this->outsider, 'sanctum')
        ->getJson("/api/v1/user/ai-prompts/{$template->id}")
        ->assertNotFound();

    $this->actingAs($this->outsider, 'sanctum')
        ->putJson("/api/v1/user/ai-prompts/{$template->id}", [
            'name' => 'Nao deveria atualizar',
        ])
        ->assertNotFound();

    $this->actingAs($this->outsider, 'sanctum')
        ->deleteJson("/api/v1/user/ai-prompts/{$template->id}")
        ->assertNotFound();

    $this->actingAs($this->outsider, 'sanctum')
        ->putJson("/api/v1/user/ai-prompts/{$template->id}/favorite")
        ->assertNotFound();

    $this->actingAs($this->outsider, 'sanctum')
        ->postJson("/api/v1/user/ai-prompts/{$template->id}/track-use")
        ->assertNotFound();
});

test('set favorite is transactional and not toggle', function () {
    $first = makeUserAiPrompt($this->journalist, ['is_favorite' => true, 'sort_order' => 1]);
    $second = makeUserAiPrompt($this->journalist, ['sort_order' => 2]);

    $this->actingAs($this->journalist, 'sanctum')
        ->putJson("/api/v1/user/ai-prompts/{$second->id}/favorite")
        ->assertOk()
        ->assertJsonPath('data.id', $second->id)
        ->assertJsonPath('data.is_favorite', true);

    $first->refresh();
    $second->refresh();

    expect($first->is_favorite)->toBeFalse();
    expect($second->is_favorite)->toBeTrue();

    $this->actingAs($this->journalist, 'sanctum')
        ->putJson("/api/v1/user/ai-prompts/{$second->id}/favorite")
        ->assertOk()
        ->assertJsonPath('data.is_favorite', true);

    $second->refresh();

    expect($second->is_favorite)->toBeTrue();
});

test('archiving the favorite clears favorite state', function () {
    $favorite = makeUserAiPrompt($this->journalist, ['is_favorite' => true]);

    $this->actingAs($this->journalist, 'sanctum')
        ->deleteJson("/api/v1/user/ai-prompts/{$favorite->id}")
        ->assertOk();

    $favoriteWithTrashed = UserAiPromptTemplate::withTrashed()->findOrFail($favorite->id);

    expect($favoriteWithTrashed->is_favorite)->toBeFalse();

    $listResponse = $this->actingAs($this->journalist, 'sanctum')
        ->getJson('/api/v1/user/ai-prompts')
        ->assertOk();

    expect($listResponse->json('data'))->toBeArray()->toHaveCount(0);
});

test('reorder endpoint rewrites sort order sequentially and ignores client numbering', function () {
    $first = makeUserAiPrompt($this->journalist, ['sort_order' => 5]);
    $second = makeUserAiPrompt($this->journalist, ['sort_order' => 20]);
    $third = makeUserAiPrompt($this->journalist, ['sort_order' => 40]);

    $response = $this->actingAs($this->journalist, 'sanctum')
        ->putJson('/api/v1/user/ai-prompts/reorder', [
            'items' => [$third->id, $first->id, $second->id],
        ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $orderedIds = collect($response->json('data'))->pluck('id')->all();

    expect($orderedIds)->toBe([$third->id, $first->id, $second->id]);

    $first->refresh();
    $second->refresh();
    $third->refresh();

    expect($third->sort_order)->toBe(1);
    expect($first->sort_order)->toBe(2);
    expect($second->sort_order)->toBe(3);
});

test('variables endpoint returns official variable catalog', function () {
    $response = $this->actingAs($this->journalist, 'sanctum')
        ->getJson('/api/v1/user/ai-prompts/variables')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.0.key', '{{md_url}}')
        ->assertJsonPath('data.0.required_recommended', true);

    expect($response->json('data'))->toHaveCount(10);
});

test('starter endpoint creates favorite template only when user has no active templates', function () {
    $createResponse = $this->actingAs($this->journalist, 'sanctum')
        ->postJson('/api/v1/user/ai-prompts/starter')
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Reescrita Jornalistica Padrao')
        ->assertJsonPath('data.is_favorite', true)
        ->assertJsonPath('data.sort_order', 1);

    expect($createResponse->json('data.content'))->toContain('{{md_url}}');

    $this->actingAs($this->journalist, 'sanctum')
        ->postJson('/api/v1/user/ai-prompts/starter')
        ->assertStatus(409)
        ->assertJsonPath('code', 'AI_PROMPTS_STARTER_ALREADY_EXISTS');
});

test('track use endpoint increments usage count only on explicit action', function () {
    $template = makeUserAiPrompt($this->journalist, ['usage_count' => 2]);

    $this->actingAs($this->journalist, 'sanctum')
        ->postJson("/api/v1/user/ai-prompts/{$template->id}/track-use")
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $template->id)
        ->assertJsonPath('data.usage_count', 3);

    $template->refresh();

    expect($template->usage_count)->toBe(3);
    expect($template->last_used_at)->not->toBeNull();
});

test('special routes do not collide with id routes', function () {
    $this->actingAs($this->journalist, 'sanctum')
        ->getJson('/api/v1/user/ai-prompts/variables')
        ->assertOk();

    $this->actingAs($this->journalist, 'sanctum')
        ->putJson('/api/v1/user/ai-prompts/reorder', [
            'items' => [999999],
        ])
        ->assertNotFound();

    $this->actingAs($this->journalist, 'sanctum')
        ->postJson('/api/v1/user/ai-prompts/starter')
        ->assertCreated();
});
