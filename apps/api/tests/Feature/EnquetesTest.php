<?php

use App\Models\User;
use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollOption;
use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Models\PollResultSnapshot;
use App\Modules\Enquetes\Models\PollSite;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use App\Modules\Enquetes\Services\PollResultService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config([
        'enquetes.timezone' => 'America/Sao_Paulo',
        'enquetes.media.disk' => 'public',
        'enquetes.media.max_file_size_kb' => 2048,
        'enquetes.media.allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/webp',
        ],
        'app.url' => 'https://adm.tvvip.social',
    ]);

    Storage::fake('public');

    Schema::dropIfExists('media');
    Schema::dropIfExists('poll_placements');
    Schema::dropIfExists('poll_site_domains');
    Schema::dropIfExists('poll_sites');
    Schema::dropIfExists('poll_options');
    Schema::dropIfExists('poll_events');
    Schema::dropIfExists('poll_sessions');
    Schema::dropIfExists('poll_vote_locks');
    Schema::dropIfExists('poll_votes');
    Schema::dropIfExists('poll_vote_attempts');
    Schema::dropIfExists('poll_result_snapshots');
    Schema::dropIfExists('polls');

    Schema::create('media', function (Blueprint $table) {
        $table->id();
        $table->morphs('model');
        $table->uuid()->nullable()->unique();
        $table->string('collection_name');
        $table->string('name');
        $table->string('file_name');
        $table->string('mime_type')->nullable();
        $table->string('disk');
        $table->string('conversions_disk')->nullable();
        $table->unsignedBigInteger('size');
        $table->json('manipulations');
        $table->json('custom_properties');
        $table->json('generated_conversions');
        $table->json('responsive_images');
        $table->unsignedInteger('order_column')->nullable();
        $table->nullableTimestamps();
    });

    Schema::create('polls', function (Blueprint $table) {
        $table->id();
        $table->ulid('public_id')->unique();
        $table->string('title');
        $table->text('question');
        $table->string('slug')->nullable();
        $table->string('status', 50)->default('draft');
        $table->string('selection_type', 50)->default('single');
        $table->unsignedInteger('max_choices')->nullable();
        $table->string('vote_limit_mode', 50)->default('once_ever');
        $table->unsignedInteger('vote_cooldown_minutes')->nullable();
        $table->string('results_visibility', 50)->default('live');
        $table->string('after_end_behavior', 50)->default('show_results_only');
        $table->dateTime('starts_at')->nullable();
        $table->dateTime('ends_at')->nullable();
        $table->string('timezone', 100)->default('America/Sao_Paulo');
        $table->json('settings')->nullable();
        $table->unsignedBigInteger('created_by')->nullable();
        $table->unsignedBigInteger('updated_by')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });

    Schema::create('poll_options', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('poll_id');
        $table->ulid('public_id')->unique();
        $table->string('label');
        $table->text('description')->nullable();
        $table->unsignedInteger('sort_order')->default(0);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    Schema::create('poll_sites', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('public_key', 191)->unique();
        $table->string('secret_key_hash', 191)->nullable();
        $table->boolean('is_active')->default(true);
        $table->json('settings')->nullable();
        $table->timestamps();
    });

    Schema::create('poll_site_domains', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('poll_site_id');
        $table->string('domain_pattern', 191);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    Schema::create('poll_placements', function (Blueprint $table) {
        $table->id();
        $table->ulid('public_id')->unique();
        $table->unsignedBigInteger('poll_id');
        $table->unsignedBigInteger('poll_site_id')->nullable();
        $table->string('placement_name');
        $table->string('article_external_id')->nullable();
        $table->string('article_title')->nullable();
        $table->text('canonical_url')->nullable();
        $table->string('page_path')->nullable();
        $table->string('embed_token_hash', 191)->nullable();
        $table->boolean('is_active')->default(true);
        $table->dateTime('last_seen_at')->nullable();
        $table->timestamps();
    });

    Schema::create('poll_sessions', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('poll_id');
        $table->unsignedBigInteger('poll_placement_id')->nullable();
        $table->string('session_token_hash', 191)->unique();
        $table->string('fingerprint_hash', 191)->nullable();
        $table->string('external_user_hash', 191)->nullable();
        $table->string('ip_hash', 191);
        $table->string('user_agent_hash', 191);
        $table->text('referrer_url')->nullable();
        $table->string('referrer_domain', 191)->nullable();
        $table->string('origin_domain', 191)->nullable();
        $table->dateTime('first_seen_at');
        $table->dateTime('last_seen_at');
        $table->json('meta')->nullable();
        $table->timestamps();
    });

    Schema::create('poll_events', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('poll_id');
        $table->unsignedBigInteger('poll_placement_id')->nullable();
        $table->string('poll_session_id', 26)->nullable();
        $table->string('event_type', 100);
        $table->unsignedBigInteger('option_id')->nullable();
        $table->json('meta')->nullable();
        $table->dateTime('created_at');
    });

    Schema::create('poll_vote_attempts', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('poll_id');
        $table->unsignedBigInteger('poll_placement_id')->nullable();
        $table->string('poll_session_id', 26)->nullable();
        $table->string('status', 50);
        $table->string('block_reason', 191)->nullable();
        $table->decimal('risk_score', 5, 2)->nullable();
        $table->string('ip_hash', 191);
        $table->string('fingerprint_hash', 191)->nullable();
        $table->string('external_user_hash', 191)->nullable();
        $table->text('user_agent')->nullable();
        $table->string('browser_family', 100)->nullable();
        $table->string('os_family', 100)->nullable();
        $table->string('device_type', 100)->nullable();
        $table->string('country', 100)->nullable();
        $table->string('region', 100)->nullable();
        $table->string('city', 100)->nullable();
        $table->string('asn', 100)->nullable();
        $table->string('provider', 191)->nullable();
        $table->json('meta')->nullable();
        $table->timestamps();
    });

    Schema::create('poll_votes', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->unsignedBigInteger('poll_id');
        $table->unsignedBigInteger('option_id');
        $table->unsignedBigInteger('poll_placement_id')->nullable();
        $table->string('poll_session_id', 26)->nullable();
        $table->string('vote_attempt_id', 26)->nullable();
        $table->string('status', 50)->default('valid');
        $table->string('ip_hash', 191);
        $table->string('fingerprint_hash', 191)->nullable();
        $table->string('external_user_hash', 191)->nullable();
        $table->dateTime('accepted_at');
        $table->dateTime('invalidated_at')->nullable();
        $table->text('invalidated_reason')->nullable();
        $table->json('geo_snapshot')->nullable();
        $table->json('device_snapshot')->nullable();
        $table->timestamps();
        $table->unique(['vote_attempt_id', 'option_id']);
    });

    Schema::create('poll_vote_locks', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('poll_id');
        $table->string('lock_scope', 50);
        $table->string('lock_key', 191);
        $table->string('vote_id', 26)->nullable();
        $table->dateTime('locked_until')->nullable();
        $table->timestamps();
        $table->unique(['poll_id', 'lock_scope', 'lock_key']);
    });

    Schema::create('poll_result_snapshots', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('poll_id');
        $table->string('bucket_type', 20);
        $table->dateTime('bucket_at');
        $table->unsignedInteger('impressions')->default(0);
        $table->unsignedInteger('unique_sessions')->default(0);
        $table->unsignedInteger('votes_accepted')->default(0);
        $table->unsignedInteger('votes_blocked')->default(0);
        $table->decimal('conversion_rate', 7, 4)->nullable();
        $table->json('payload')->nullable();
        $table->timestamps();
        $table->unique(['poll_id', 'bucket_type', 'bucket_at']);
    });
});

function makeAuthenticatedEnquetesUser(): User
{
    return User::factory()->make([
        'id' => 1,
        'active' => true,
        'role' => 'admin',
    ]);
}

test('enquetes admin endpoints require authentication', function () {
    $this->getJson('/api/v1/enquetes')
        ->assertStatus(401);

    $this->getJson('/api/v1/enquetes/sites')
        ->assertStatus(401);
});

test('poll site and domains can be created and updated', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $siteResponse = $this->postJson('/api/v1/enquetes/sites', [
        'name' => 'TV VIP',
        'secret_key' => 'segredo-inicial',
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'TV VIP')
        ->assertJsonPath('data.is_active', true);

    $siteId = $siteResponse->json('data.id');

    expect($siteResponse->json('data.public_key'))->toStartWith('site_');

    $domainResponse = $this->postJson("/api/v1/enquetes/sites/{$siteId}/domains", [
        'domain_pattern' => '*.tvvip.social',
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.domain_pattern', '*.tvvip.social');

    $domainId = $domainResponse->json('data.id');

    $this->putJson("/api/v1/enquetes/domains/{$domainId}", [
        'domain_pattern' => 'noticias.tvvip.social',
        'is_active' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.domain_pattern', 'noticias.tvvip.social')
        ->assertJsonPath('data.is_active', false);

    $this->getJson("/api/v1/enquetes/sites/{$siteId}/domains")
        ->assertOk()
        ->assertJsonPath('data.0.domain_pattern', 'noticias.tvvip.social');
});

test('placement can be created toggled and embed routes return html and loader script', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $site = PollSite::query()->create([
        'name' => 'TV VIP',
        'public_key' => 'site_tvvip',
        'is_active' => true,
    ]);

    $response = $this->postJson("/api/v1/enquetes/{$poll->id}/placements", [
        'poll_site_id' => $site->id,
        'placement_name' => 'Materia Home',
        'article_external_id' => 'art-1',
        'article_title' => 'Materia teste',
        'canonical_url' => 'https://tvvip.social/noticias/materia-teste',
        'page_path' => '/noticias/materia-teste',
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.placement_name', 'Materia Home')
        ->assertJsonPath('data.site.public_key', 'site_tvvip');

    $placementId = $response->json('data.id');
    $placementPublicId = $response->json('data.public_id');
    $embedLoaderUrl = $response->json('data.embed_loader_url');

    expect($embedLoaderUrl)->toContain("/embed/enquetes/{$placementPublicId}/loader.js");

    $this->patchJson("/api/v1/enquetes/placements/{$placementId}/toggle")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    PollPlacement::query()->whereKey($placementId)->update(['is_active' => true]);

    $this->get("/embed/enquetes/{$placementPublicId}")
        ->assertOk()
        ->assertSee('Enquete TV VIP Social')
        ->assertSee('Carregando enquete');

    $this->get("/embed/enquetes/{$placementPublicId}/loader.js")
        ->assertOk()
        ->assertHeader('content-type', 'application/javascript; charset=UTF-8')
        ->assertSee('tvvip-enquete:resize');
});

test('poll option image can be uploaded and removed', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'draft',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $option = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $this->postJson("/api/v1/enquetes/options/{$option->id}/image", [
        'image' => UploadedFile::fake()->image('opcao.jpg', 800, 800),
    ])
        ->assertOk()
        ->assertJsonPath('data.label', 'Jornal VIP');

    $option->refresh();

    expect($option->getFirstMedia('option_image'))->not->toBeNull();

    $this->get("/media/enquetes/options/{$option->public_id}/thumb")
        ->assertOk();

    $this->deleteJson("/api/v1/enquetes/options/{$option->id}/image")
        ->assertOk();

    expect($option->fresh()->getFirstMedia('option_image'))->toBeNull();
});

test('dashboard overview does not mark a leader when poll has no valid votes', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Esportes VIP',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/overview")
        ->assertOk()
        ->assertJsonPath('data.overview.votes_accepted', 0)
        ->assertJsonPath('data.overview.top_option', null);
});

test('public boot and widget session return payload and persist hashed session context', function () {
    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $option = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'placement_name' => 'Materia Home',
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/public/enquetes/placements/{$placement->public_id}/boot")
        ->assertOk()
        ->assertJsonPath('data.poll.public_id', $poll->public_id)
        ->assertJsonPath('data.poll.options.0.public_id', $option->public_id)
        ->assertJsonPath('data.state', 'accepting_votes');

    $sessionResponse = $this->postJson('/api/v1/public/enquetes/widget-sessions', [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'widget-session-123',
        'fingerprint' => 'fingerprint-abc',
        'external_user_id' => 'external-user-1',
        'meta' => ['source' => 'embed'],
    ], [
        'Origin' => 'https://tvvip.social',
        'Referer' => 'https://tvvip.social/noticias/materia-teste',
        'User-Agent' => 'TVVIP Widget Test',
    ])
        ->assertOk()
        ->assertJsonPath('data.session.session_token', 'widget-session-123');

    expect($sessionResponse->json('data.session.id'))->not->toBeNull();
    expect(\App\Modules\Enquetes\Models\PollSession::query()->count())->toBe(1);

    $session = \App\Modules\Enquetes\Models\PollSession::query()->first();

    expect($session->session_token_hash)->not->toBe('widget-session-123');
    expect($session->origin_domain)->toBe('tvvip.social');
    expect($session->referrer_domain)->toBe('tvvip.social');
});

test('public widget event can be tracked using placement and session token', function () {
    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $option = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'placement_name' => 'Materia Home',
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/public/enquetes/widget-sessions', [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'widget-session-evt',
    ], [
        'Origin' => 'https://tvvip.social',
        'Referer' => 'https://tvvip.social/noticias/materia-teste',
        'User-Agent' => 'TVVIP Widget Test',
    ])->assertOk();

    $this->postJson("/api/v1/public/enquetes/{$poll->public_id}/events", [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'widget-session-evt',
        'option_public_id' => $option->public_id,
        'event_type' => 'option_selected',
        'meta' => ['position' => 1],
    ])
        ->assertOk()
        ->assertJsonPath('data.event.event_type', 'option_selected');

    $this->assertDatabaseHas('poll_events', [
        'poll_id' => $poll->id,
        'poll_placement_id' => $placement->id,
        'option_id' => $option->id,
        'event_type' => 'option_selected',
    ]);
});

test('public vote accepts first vote and blocks repeated vote for once ever policy', function () {
    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'after_vote',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $option = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'placement_name' => 'Materia Home',
        'is_active' => true,
    ]);

    $this->postJson("/api/v1/public/enquetes/{$poll->public_id}/vote", [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'vote-session-1',
        'fingerprint' => 'fp-1',
        'option_public_ids' => [$option->public_id],
    ], [
        'Origin' => 'https://tvvip.social',
        'Referer' => 'https://tvvip.social/noticias/materia-teste',
        'User-Agent' => 'TVVIP Widget Vote Test',
    ])
        ->assertOk()
        ->assertJsonPath('data.accepted', true)
        ->assertJsonPath('data.results_available', true)
        ->assertJsonPath('data.results.total_votes', 1);

    $this->assertDatabaseHas('poll_vote_attempts', [
        'poll_id' => $poll->id,
        'status' => 'accepted',
    ]);

    $this->assertDatabaseHas('poll_votes', [
        'poll_id' => $poll->id,
        'option_id' => $option->id,
        'status' => 'valid',
    ]);

    $this->assertDatabaseHas('poll_vote_locks', [
        'poll_id' => $poll->id,
        'lock_scope' => 'session',
    ]);

    $this->postJson("/api/v1/public/enquetes/{$poll->public_id}/vote", [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'vote-session-1',
        'fingerprint' => 'fp-1',
        'option_public_ids' => [$option->public_id],
    ], [
        'Origin' => 'https://tvvip.social',
        'Referer' => 'https://tvvip.social/noticias/materia-teste',
        'User-Agent' => 'TVVIP Widget Vote Test',
    ])
        ->assertStatus(409)
        ->assertJsonPath('data.accepted', false)
        ->assertJsonPath('data.block_reason', 'ALREADY_VOTED');
});

test('public results stay hidden when poll is configured to hide widget after end', function () {
    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'closed',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'after_end',
        'after_end_behavior' => 'hide_widget',
        'timezone' => 'America/Sao_Paulo',
        'starts_at' => now()->subDay(),
        'ends_at' => now()->subHour(),
    ]);

    PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/public/enquetes/{$poll->public_id}/results")
        ->assertStatus(403)
        ->assertJsonPath('code', 'POLL_RESULTS_HIDDEN');
});

test('public vote accepts multiple selection respecting max choices', function () {
    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Escolha ate duas opcoes',
        'status' => 'live',
        'selection_type' => 'multiple',
        'max_choices' => 2,
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $optionA = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $optionB = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'VIP Esportes',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'placement_name' => 'Materia Home',
        'is_active' => true,
    ]);

    $this->postJson("/api/v1/public/enquetes/{$poll->public_id}/vote", [
        'placement_public_id' => $placement->public_id,
        'session_token' => 'vote-session-2',
        'option_public_ids' => [$optionA->public_id, $optionB->public_id],
    ])
        ->assertOk()
        ->assertJsonPath('data.accepted', true)
        ->assertJsonPath('data.results.total_votes', 2);

    expect(\App\Modules\Enquetes\Models\PollVote::query()->where('vote_attempt_id', \App\Modules\Enquetes\Models\PollVoteAttempt::query()->latest('created_at')->value('id'))->count())->toBe(2);
});

test('admin metrics endpoints return overview breakdowns timeseries and logs', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $optionA = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $optionB = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'VIP Esportes',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $site = PollSite::query()->create([
        'name' => 'TV VIP',
        'public_key' => 'site_tvvip',
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'poll_site_id' => $site->id,
        'placement_name' => 'Home principal',
        'is_active' => true,
    ]);

    $sessionId = '01kk3session000000000000000';

    Schema::disableForeignKeyConstraints();
    \Illuminate\Support\Facades\DB::table('poll_sessions')->insert([
        'id' => $sessionId,
        'poll_id' => $poll->id,
        'poll_placement_id' => $placement->id,
        'session_token_hash' => 'session-hash-1',
        'fingerprint_hash' => 'fingerprint-hash-1',
        'external_user_hash' => null,
        'ip_hash' => 'ip-hash-1',
        'user_agent_hash' => 'ua-hash-1',
        'referrer_url' => 'https://tvvip.social/noticia/1',
        'referrer_domain' => 'tvvip.social',
        'origin_domain' => 'tvvip.social',
        'first_seen_at' => now()->subMinutes(10),
        'last_seen_at' => now(),
        'meta' => json_encode(['source' => 'test']),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    Schema::enableForeignKeyConstraints();

    \Illuminate\Support\Facades\DB::table('poll_events')->insert([
        [
            'id' => '01kk3event0000000000000001',
            'poll_id' => $poll->id,
            'poll_placement_id' => $placement->id,
            'poll_session_id' => $sessionId,
            'event_type' => 'widget_loaded',
            'option_id' => null,
            'meta' => json_encode([]),
            'created_at' => now()->subMinutes(9),
        ],
        [
            'id' => '01kk3event0000000000000002',
            'poll_id' => $poll->id,
            'poll_placement_id' => $placement->id,
            'poll_session_id' => $sessionId,
            'event_type' => 'widget_visible',
            'option_id' => null,
            'meta' => json_encode([]),
            'created_at' => now()->subMinutes(8),
        ],
    ]);

    $attemptAccepted = PollVoteAttempt::query()->create([
        'poll_id' => $poll->id,
        'poll_placement_id' => $placement->id,
        'poll_session_id' => $sessionId,
        'status' => PollVoteAttempt::STATUS_ACCEPTED,
        'ip_hash' => 'ip-hash-1',
        'fingerprint_hash' => 'fingerprint-hash-1',
        'browser_family' => 'Chrome',
        'os_family' => 'Windows',
        'device_type' => 'desktop',
        'country' => 'Brasil',
        'region' => 'PA',
        'city' => 'Belem',
        'provider' => 'Claro',
        'meta' => ['option_ids' => [$optionA->public_id]],
        'created_at' => now()->subMinutes(7),
        'updated_at' => now()->subMinutes(7),
    ]);

    $attemptBlocked = PollVoteAttempt::query()->create([
        'poll_id' => $poll->id,
        'poll_placement_id' => $placement->id,
        'poll_session_id' => $sessionId,
        'status' => PollVoteAttempt::STATUS_BLOCKED,
        'block_reason' => 'ALREADY_VOTED',
        'ip_hash' => 'ip-hash-1',
        'fingerprint_hash' => 'fingerprint-hash-1',
        'browser_family' => 'Chrome',
        'os_family' => 'Windows',
        'device_type' => 'desktop',
        'country' => 'Brasil',
        'region' => 'PA',
        'city' => 'Belem',
        'provider' => 'Claro',
        'meta' => ['option_ids' => [$optionA->public_id]],
        'created_at' => now()->subMinutes(6),
        'updated_at' => now()->subMinutes(6),
    ]);

    PollVote::query()->create([
        'poll_id' => $poll->id,
        'option_id' => $optionA->id,
        'poll_placement_id' => $placement->id,
        'poll_session_id' => $sessionId,
        'vote_attempt_id' => $attemptAccepted->id,
        'status' => PollVote::STATUS_VALID,
        'ip_hash' => 'ip-hash-1',
        'fingerprint_hash' => 'fingerprint-hash-1',
        'accepted_at' => now()->subMinutes(7),
    ]);

    app(PollResultService::class)->rebuildSnapshots($poll);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/overview")
        ->assertOk()
        ->assertJsonPath('data.overview.votes_accepted', 1)
        ->assertJsonPath('data.overview.votes_blocked', 1);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/options")
        ->assertOk()
        ->assertJsonPath('data.0.label', 'Jornal VIP')
        ->assertJsonPath('data.0.votes', 1);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/placements")
        ->assertOk()
        ->assertJsonPath('data.0.placement_name', 'Home principal')
        ->assertJsonPath('data.0.votes_accepted', 1);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/locations")
        ->assertOk()
        ->assertJsonPath('data.0.city', 'Belem')
        ->assertJsonPath('data.0.attempts', 2);

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/providers")
        ->assertOk()
        ->assertJsonPath('data.0.provider', 'Claro');

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/devices")
        ->assertOk()
        ->assertJsonPath('data.0.device_type', 'desktop');

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/browsers")
        ->assertOk()
        ->assertJsonPath('data.0.browser_family', 'Chrome');

    $this->getJson("/api/v1/enquetes/{$poll->id}/metrics/timeseries?window=30d&bucket_type=day")
        ->assertOk()
        ->assertJsonCount(1, 'data.series');

    $this->getJson("/api/v1/enquetes/{$poll->id}/vote-attempts")
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    $this->getJson("/api/v1/enquetes/{$poll->id}/votes")
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->getJson("/api/v1/enquetes/vote-attempts/{$attemptBlocked->id}")
        ->assertOk()
        ->assertJsonPath('data.block_reason', 'ALREADY_VOTED');
});

test('admin can invalidate vote rebuild snapshots and export csv files', function () {
    Sanctum::actingAs(makeAuthenticatedEnquetesUser());

    $poll = Poll::query()->create([
        'title' => 'Programacao TV VIP',
        'question' => 'Qual programa voce mais acompanha?',
        'status' => 'live',
        'selection_type' => 'single',
        'vote_limit_mode' => 'once_ever',
        'results_visibility' => 'live',
        'after_end_behavior' => 'show_results_only',
        'timezone' => 'America/Sao_Paulo',
    ]);

    $option = PollOption::query()->create([
        'poll_id' => $poll->id,
        'label' => 'Jornal VIP',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $placement = PollPlacement::query()->create([
        'poll_id' => $poll->id,
        'placement_name' => 'Home principal',
        'is_active' => true,
    ]);

    $attempt = PollVoteAttempt::query()->create([
        'poll_id' => $poll->id,
        'poll_placement_id' => $placement->id,
        'status' => PollVoteAttempt::STATUS_ACCEPTED,
        'ip_hash' => 'ip-hash-2',
        'meta' => ['option_ids' => [$option->public_id]],
        'created_at' => now()->subMinutes(5),
        'updated_at' => now()->subMinutes(5),
    ]);

    $vote = PollVote::query()->create([
        'poll_id' => $poll->id,
        'option_id' => $option->id,
        'poll_placement_id' => $placement->id,
        'vote_attempt_id' => $attempt->id,
        'status' => PollVote::STATUS_VALID,
        'ip_hash' => 'ip-hash-2',
        'accepted_at' => now()->subMinutes(5),
    ]);

    PollResultSnapshot::query()->create([
        'poll_id' => $poll->id,
        'bucket_type' => 'day',
        'bucket_at' => now()->startOfDay(),
        'impressions' => 1,
        'unique_sessions' => 1,
        'votes_accepted' => 1,
        'votes_blocked' => 0,
        'conversion_rate' => 1.0,
        'payload' => ['seeded' => true],
    ]);

    $this->postJson("/api/v1/enquetes/votes/{$vote->id}/invalidate", [
        'reason' => 'Fraude detectada',
    ])
        ->assertOk()
        ->assertJsonPath('data.vote.status', PollVote::STATUS_INVALIDATED)
        ->assertJsonPath('data.vote.invalidated_reason', 'Fraude detectada');

    $vote->refresh();

    expect($vote->status)->toBe(PollVote::STATUS_INVALIDATED);
    expect(PollResultSnapshot::query()->where('poll_id', $poll->id)->count())->toBeGreaterThan(0);

    $this->postJson("/api/v1/enquetes/{$poll->id}/rebuild-snapshots")
        ->assertOk()
        ->assertJsonPath('data.poll_id', $poll->id);

    $votesCsv = $this->get("/api/v1/enquetes/{$poll->id}/export/votes.csv")
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($votesCsv->streamedContent())
        ->toContain('vote_id')
        ->toContain((string) $vote->id);

    $attemptsCsv = $this->get("/api/v1/enquetes/{$poll->id}/export/vote-attempts.csv")
        ->assertOk();

    expect($attemptsCsv->streamedContent())
        ->toContain('attempt_id')
        ->toContain((string) $attempt->id);

    $optionsCsv = $this->get("/api/v1/enquetes/{$poll->id}/export/options-summary.csv")
        ->assertOk();

    expect($optionsCsv->streamedContent())
        ->toContain('option_id')
        ->toContain('Jornal VIP');

    $placementsCsv = $this->get("/api/v1/enquetes/{$poll->id}/export/placements-summary.csv")
        ->assertOk();

    expect($placementsCsv->streamedContent())
        ->toContain('placement_id')
        ->toContain('Home principal');
});
