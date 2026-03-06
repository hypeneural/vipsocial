<?php

use App\Models\User;
use App\Modules\WhatsApp\Services\GroupSyncService;
use Illuminate\Support\Facades\Schema;
use Mockery\MockInterface;

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

    Schema::create('whatsapp_group_memberships', function ($table) {
        $table->ulid('id')->primary();
        $table->ulid('group_fk');
        $table->ulid('participant_fk')->nullable();
        $table->string('status')->default('active');
        $table->boolean('is_admin')->default(false);
        $table->boolean('is_super_admin')->default(false);
        $table->dateTime('joined_at')->nullable();
        $table->dateTime('left_at')->nullable();
        $table->dateTime('last_seen_at')->nullable();
        $table->unsignedInteger('times_joined')->default(1);
        $table->timestamps();
    });
});

test('list monitored groups returns paginated items', function () {
    \DB::table('whatsapp_groups')->insert([
        [
            'id' => (string) \Illuminate\Support\Str::ulid(),
            'group_id' => '120363027326371817-group',
            'name' => 'Grupo A',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'id' => (string) \Illuminate\Support\Str::ulid(),
            'group_id' => '554896318744-1598529471',
            'name' => 'Grupo Inativo',
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->getJson('/api/v1/whatsapp/groups?per_page=10')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.group_id', '120363027326371817-group');
});

test('store monitored group validates and creates group', function () {
    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->postJson('/api/v1/whatsapp/groups', [
            'group_id' => '120363027392048120-group',
            'name' => 'Grupo Novo',
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.group.group_id', '120363027392048120-group');

    $this->assertDatabaseHas('whatsapp_groups', [
        'group_id' => '120363027392048120-group',
        'is_active' => 1,
    ]);
});

test('sync endpoint uses group sync service', function () {
    \DB::table('whatsapp_groups')->insert([
        'id' => (string) \Illuminate\Support\Str::ulid(),
        'group_id' => '554898580333-1622125949',
        'name' => 'Grupo Sync',
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->mock(GroupSyncService::class, function (MockInterface $mock): void {
        $mock->shouldReceive('syncGroupById')
            ->once()
            ->andReturn([
                'group_id' => '554898580333-1622125949',
                'sync_batch_id' => 'batch_test',
                'applied' => true,
                'added_count' => 2,
                'removed_count' => 1,
            ]);
    });

    $this->actingAs(User::factory()->make(['role' => 'admin']))
        ->postJson('/api/v1/whatsapp/groups/554898580333-1622125949/sync', [
            'force' => true,
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.sync.applied', true)
        ->assertJsonPath('data.sync.added_count', 2);
});
