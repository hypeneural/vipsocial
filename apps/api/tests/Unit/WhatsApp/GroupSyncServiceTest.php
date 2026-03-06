<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppParticipant;
use App\Modules\WhatsApp\Services\GroupSyncService;
use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class GroupSyncServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_sync_creates_join_events_and_memberships(): void
    {
        $groupId = '554896318744-1598529471';

        $whatsAppService = Mockery::mock(WhatsAppService::class);
        $whatsAppService->shouldReceive('lightGroupMetadata')->once()->andReturn([
            'phone' => $groupId,
            'subject' => 'Noticias VipSocial',
            'name' => 'Noticias VipSocial',
            'participants' => [
                [
                    'lid' => '188407984689186@lid',
                    'phone' => '',
                    'isAdmin' => false,
                    'isSuperAdmin' => false,
                ],
                [
                    'lid' => '144113366245434@lid',
                    'phone' => '',
                    'isAdmin' => true,
                    'isSuperAdmin' => false,
                ],
            ],
        ]);

        $service = new GroupSyncService($whatsAppService);
        $result = $service->syncGroupById($groupId, 'batch_a', false);

        $this->assertTrue($result['applied']);
        $this->assertSame(2, $result['added_count']);
        $this->assertSame(0, $result['removed_count']);
        $this->assertSame(2, WhatsAppParticipant::query()->count());
        $this->assertSame(2, WhatsAppGroupMembership::query()->active()->count());
        $this->assertSame(2, WhatsAppGroupMemberEvent::query()
            ->where('event_type', WhatsAppGroupMemberEvent::TYPE_JOIN)
            ->count());
    }

    public function test_sync_generates_leave_and_join_on_diff(): void
    {
        $groupId = '120363027326371817-group';

        $whatsAppService = Mockery::mock(WhatsAppService::class);
        $whatsAppService->shouldReceive('lightGroupMetadata')->twice()->andReturn(
            [
                'phone' => $groupId,
                'participants' => [
                    ['lid' => 'a@lid', 'phone' => '', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['lid' => 'b@lid', 'phone' => '', 'isAdmin' => false, 'isSuperAdmin' => false],
                ],
            ],
            [
                'phone' => $groupId,
                'participants' => [
                    ['lid' => 'b@lid', 'phone' => '', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['lid' => 'c@lid', 'phone' => '', 'isAdmin' => false, 'isSuperAdmin' => false],
                ],
            ]
        );

        $service = new GroupSyncService($whatsAppService);
        $service->syncGroupById($groupId, 'batch_1', false);
        $result = $service->syncGroupById($groupId, 'batch_2', false);

        $this->assertTrue($result['applied']);
        $this->assertSame(1, $result['added_count']);
        $this->assertSame(1, $result['removed_count']);
        $this->assertSame(2, WhatsAppGroupMembership::query()->active()->count());
        $this->assertSame(1, WhatsAppGroupMembership::query()->where('status', WhatsAppGroupMembership::STATUS_LEFT)->count());
        $this->assertSame(3, WhatsAppGroupMemberEvent::query()->where('event_type', WhatsAppGroupMemberEvent::TYPE_JOIN)->count());
        $this->assertSame(1, WhatsAppGroupMemberEvent::query()->where('event_type', WhatsAppGroupMemberEvent::TYPE_LEAVE)->count());
    }

    public function test_sync_aborts_on_guard_rail_empty_snapshot(): void
    {
        $group = WhatsAppGroup::query()->create([
            'group_id' => '554896318744-1608641074',
            'name' => 'Grupo Teste',
            'is_active' => true,
        ]);

        for ($i = 1; $i <= 60; $i++) {
            $participant = WhatsAppParticipant::query()->create([
                'lid' => "lid{$i}@lid",
            ]);

            WhatsAppGroupMembership::query()->create([
                'group_fk' => $group->id,
                'participant_fk' => $participant->id,
                'status' => WhatsAppGroupMembership::STATUS_ACTIVE,
                'times_joined' => 1,
            ]);
        }

        $whatsAppService = Mockery::mock(WhatsAppService::class);
        $whatsAppService->shouldReceive('lightGroupMetadata')->once()->andReturn([
            'phone' => $group->group_id,
            'participants' => [],
        ]);

        $service = new GroupSyncService($whatsAppService);
        $result = $service->syncGroupById($group->group_id, 'batch_guard', false);

        $this->assertFalse($result['applied']);
        $this->assertSame('guard_rail_empty_snapshot', $result['reason']);
        $this->assertSame(60, WhatsAppGroupMembership::query()->active()->count());
    }

    private function createSchema(): void
    {
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
        });
    }
}
