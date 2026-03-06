<?php

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppGroupsOverviewDailySnapshot;
use App\Modules\WhatsApp\Models\WhatsAppParticipant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->withoutMiddleware();
    Schema::dropAllTables();

    Schema::create('whatsapp_groups', function ($table) {
        $table->ulid('id')->primary();
        $table->string('group_id')->unique();
        $table->string('name')->nullable();
        $table->string('subject')->nullable();
        $table->text('description')->nullable();
        $table->string('owner_phone')->nullable();
        $table->unsignedBigInteger('creation_ts')->nullable();
        $table->boolean('admin_only_message')->nullable();
        $table->boolean('admin_only_settings')->nullable();
        $table->boolean('require_admin_approval')->nullable();
        $table->boolean('is_group_announcement')->nullable();
        $table->boolean('admin_only_add_member')->nullable();
        $table->dateTime('last_synced_at')->nullable();
        $table->unsignedInteger('last_member_count')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    Schema::create('whatsapp_participants', function ($table) {
        $table->ulid('id')->primary();
        $table->string('lid')->nullable()->unique();
        $table->string('phone')->nullable();
        $table->dateTime('first_seen_at')->nullable();
        $table->dateTime('last_seen_at')->nullable();
        $table->timestamps();
    });

    Schema::create('whatsapp_group_memberships', function ($table) {
        $table->ulid('id')->primary();
        $table->foreignUlid('group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
        $table->foreignUlid('participant_fk')->constrained('whatsapp_participants')->cascadeOnDelete();
        $table->string('status')->default('active');
        $table->boolean('is_admin')->default(false);
        $table->boolean('is_super_admin')->default(false);
        $table->dateTime('joined_at')->nullable();
        $table->dateTime('left_at')->nullable();
        $table->dateTime('last_seen_at')->nullable();
        $table->unsignedInteger('times_joined')->default(1);
        $table->timestamps();
        $table->unique(['group_fk', 'participant_fk']);
    });

    Schema::create('whatsapp_group_member_events', function ($table) {
        $table->ulid('id')->primary();
        $table->foreignUlid('group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
        $table->foreignUlid('participant_fk')->constrained('whatsapp_participants')->cascadeOnDelete();
        $table->string('event_type');
        $table->dateTime('event_at');
        $table->string('sync_batch_id')->nullable();
        $table->timestamps();
        $table->unique(['group_fk', 'participant_fk', 'event_type', 'sync_batch_id']);
    });

    Schema::create('whatsapp_groups_overview_daily_snapshots', function ($table) {
        $table->ulid('id')->primary();
        $table->date('snapshot_date')->unique();
        $table->unsignedInteger('groups_count')->default(0);
        $table->unsignedInteger('total_memberships_current')->default(0);
        $table->unsignedInteger('unique_members_current')->default(0);
        $table->unsignedInteger('multi_group_members_current')->default(0);
        $table->decimal('multi_group_ratio', 8, 4)->default(0);
        $table->dateTime('captured_at');
        $table->timestamps();
    });
});

test('overview endpoint returns aggregated metrics', function () {
    $group = WhatsAppGroup::query()->create([
        'group_id' => '120363027326371817-group',
        'name' => 'Grupo A',
        'is_active' => true,
    ]);
    $participant1 = WhatsAppParticipant::query()->create(['lid' => 'aa@lid']);
    $participant2 = WhatsAppParticipant::query()->create(['lid' => 'bb@lid']);

    WhatsAppGroupMembership::query()->create(['group_fk' => $group->id, 'participant_fk' => $participant1->id, 'status' => 'active']);
    WhatsAppGroupMembership::query()->create(['group_fk' => $group->id, 'participant_fk' => $participant2->id, 'status' => 'active']);

    WhatsAppGroupMemberEvent::query()->create([
        'group_fk' => $group->id,
        'participant_fk' => $participant1->id,
        'event_type' => 'join',
        'event_at' => CarbonImmutable::now()->subDays(2),
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->getJson('/api/v1/whatsapp/groups/metrics/overview?window=7d')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.groups_count', 1)
        ->assertJsonPath('data.total_memberships_current', 2)
        ->assertJsonPath('data.movement.joins', 1);
});

test('by-group endpoint returns list with movement', function () {
    $group = WhatsAppGroup::query()->create([
        'group_id' => '554896318744-1598529471',
        'name' => 'Noticias VipSocial',
        'is_active' => true,
    ]);
    $participant = WhatsAppParticipant::query()->create(['lid' => 'zz@lid']);

    WhatsAppGroupMembership::query()->create(['group_fk' => $group->id, 'participant_fk' => $participant->id, 'status' => 'active']);
    WhatsAppGroupMemberEvent::query()->create([
        'group_fk' => $group->id,
        'participant_fk' => $participant->id,
        'event_type' => 'join',
        'event_at' => CarbonImmutable::now()->subDays(1),
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->getJson('/api/v1/whatsapp/groups/metrics/by-group?window=7d')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.group_id', '554896318744-1598529471')
        ->assertJsonPath('data.0.members_current', 1)
        ->assertJsonPath('data.0.movement.joins', 1);
});

test('dashboard endpoint returns summary series and group shares', function () {
    $group = WhatsAppGroup::query()->create([
        'group_id' => '120363027392048120-group',
        'name' => 'Grupo Dashboard',
        'is_active' => true,
    ]);

    $participant = WhatsAppParticipant::query()->create(['lid' => 'dash-feature@lid']);
    WhatsAppGroupMembership::query()->create([
        'group_fk' => $group->id,
        'participant_fk' => $participant->id,
        'status' => 'active',
    ]);

    WhatsAppGroupsOverviewDailySnapshot::query()->create([
        'snapshot_date' => CarbonImmutable::now()->subDay()->startOfDay(),
        'groups_count' => 1,
        'total_memberships_current' => 1,
        'unique_members_current' => 1,
        'multi_group_members_current' => 0,
        'multi_group_ratio' => 0,
        'captured_at' => CarbonImmutable::now()->subDay()->setTime(23, 55),
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->getJson('/api/v1/whatsapp/groups/metrics/dashboard?window=7d')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.summary.groups_count', 1)
        ->assertJsonPath('data.summary.unique_members_current', 1)
        ->assertJsonPath('data.groups.0.share_of_total_memberships_pct', 100)
        ->assertJsonStructure([
            'success',
            'data' => [
                'window',
                'summary' => [
                    'groups_count',
                    'total_memberships_current',
                    'unique_members_current',
                    'multi_group_members_current',
                    'multi_group_ratio',
                    'movement',
                    'unique_growth',
                ],
                'series',
                'groups',
            ],
            'meta',
            'message',
        ]);
});
