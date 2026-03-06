<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Models\WhatsAppGroupsOverviewDailySnapshot;
use App\Modules\WhatsApp\Models\WhatsAppParticipant;
use App\Modules\WhatsApp\Services\GroupMetricsService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GroupMetricsServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
    }

    public function test_overview_metrics_are_calculated_correctly(): void
    {
        $timezone = (string) config('app.timezone', 'UTC');
        $now = CarbonImmutable::now($timezone);

        $groupA = WhatsAppGroup::query()->create([
            'group_id' => '120363027392048120-group',
            'name' => 'Grupo A',
            'is_active' => true,
        ]);
        $groupB = WhatsAppGroup::query()->create([
            'group_id' => '554898580333-1622125949',
            'name' => 'Grupo B',
            'is_active' => true,
        ]);

        $participant1 = WhatsAppParticipant::query()->create(['lid' => 'a@lid']);
        $participant2 = WhatsAppParticipant::query()->create(['lid' => 'b@lid']);
        $participant3 = WhatsAppParticipant::query()->create(['lid' => 'c@lid']);

        WhatsAppGroupMembership::query()->create(['group_fk' => $groupA->id, 'participant_fk' => $participant1->id, 'status' => 'active']);
        WhatsAppGroupMembership::query()->create(['group_fk' => $groupA->id, 'participant_fk' => $participant2->id, 'status' => 'active']);
        WhatsAppGroupMembership::query()->create(['group_fk' => $groupB->id, 'participant_fk' => $participant1->id, 'status' => 'active']);
        WhatsAppGroupMembership::query()->create(['group_fk' => $groupB->id, 'participant_fk' => $participant3->id, 'status' => 'active']);

        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $groupA->id,
            'participant_fk' => $participant1->id,
            'event_type' => 'join',
            'event_at' => $now->subDays(2),
        ]);
        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $groupA->id,
            'participant_fk' => $participant2->id,
            'event_type' => 'join',
            'event_at' => $now->subDays(3),
        ]);
        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $groupB->id,
            'participant_fk' => $participant3->id,
            'event_type' => 'leave',
            'event_at' => $now->subDays(1),
        ]);

        $service = new GroupMetricsService();
        $metrics = $service->overview('7d');

        $this->assertSame('7d', $metrics['window']);
        $this->assertSame(2, $metrics['groups_count']);
        $this->assertSame(4, $metrics['total_memberships_current']);
        $this->assertSame(3, $metrics['unique_members_current']);
        $this->assertSame(1, $metrics['multi_group_members_current']);
        $this->assertSame(2, $metrics['movement']['joins']);
        $this->assertSame(1, $metrics['movement']['leaves']);
        $this->assertSame(1, $metrics['movement']['net_growth']);
    }

    public function test_by_group_returns_members_and_movement(): void
    {
        $timezone = (string) config('app.timezone', 'UTC');
        $now = CarbonImmutable::now($timezone);

        $group = WhatsAppGroup::query()->create([
            'group_id' => '554896318744-1608641074',
            'name' => 'Noticias VipSocial',
            'is_active' => true,
            'last_synced_at' => $now,
        ]);

        $participant1 = WhatsAppParticipant::query()->create(['lid' => 'x@lid']);
        $participant2 = WhatsAppParticipant::query()->create(['lid' => 'y@lid']);

        WhatsAppGroupMembership::query()->create(['group_fk' => $group->id, 'participant_fk' => $participant1->id, 'status' => 'active']);
        WhatsAppGroupMembership::query()->create(['group_fk' => $group->id, 'participant_fk' => $participant2->id, 'status' => 'active']);

        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participant1->id,
            'event_type' => 'join',
            'event_at' => $now->subDays(2),
        ]);
        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participant2->id,
            'event_type' => 'leave',
            'event_at' => $now->subDay(),
        ]);

        $service = new GroupMetricsService();
        $result = $service->byGroup('7d');

        $this->assertSame('7d', $result['window']);
        $this->assertCount(1, $result['items']);
        $this->assertSame($group->group_id, $result['items'][0]['group_id']);
        $this->assertSame(2, $result['items'][0]['members_current']);
        $this->assertSame(1, $result['items'][0]['movement']['joins']);
        $this->assertSame(1, $result['items'][0]['movement']['leaves']);
        $this->assertSame(0, $result['items'][0]['movement']['net_growth']);
    }

    public function test_window_counts_events_from_start_of_day(): void
    {
        $timezone = (string) config('app.timezone', 'UTC');
        $windowStart = CarbonImmutable::now($timezone)->subDays(7)->startOfDay();

        $group = WhatsAppGroup::query()->create([
            'group_id' => '554896318744-1598529471',
            'name' => 'Grupo Janela',
            'is_active' => true,
        ]);

        $participant = WhatsAppParticipant::query()->create(['lid' => 'window@lid']);
        WhatsAppGroupMembership::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participant->id,
            'status' => 'active',
        ]);

        WhatsAppGroupMemberEvent::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participant->id,
            'event_type' => 'join',
            'event_at' => $windowStart->addHours(1),
        ]);

        $service = new GroupMetricsService();
        $metrics = $service->overview('7d');

        $this->assertSame(1, $metrics['movement']['joins']);
    }

    public function test_dashboard_uses_daily_snapshots_for_unique_growth(): void
    {
        $timezone = (string) config('app.timezone', 'UTC');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $baselineDate = $today->subDays(6);

        $group = WhatsAppGroup::query()->create([
            'group_id' => '554898580333-1622125949',
            'name' => 'Grupo Dashboard',
            'is_active' => true,
        ]);

        $participantA = WhatsAppParticipant::query()->create(['lid' => 'dash-a@lid']);
        $participantB = WhatsAppParticipant::query()->create(['lid' => 'dash-b@lid']);

        WhatsAppGroupMembership::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participantA->id,
            'status' => 'active',
        ]);
        WhatsAppGroupMembership::query()->create([
            'group_fk' => $group->id,
            'participant_fk' => $participantB->id,
            'status' => 'active',
        ]);

        WhatsAppGroupsOverviewDailySnapshot::query()->create([
            'snapshot_date' => $baselineDate,
            'groups_count' => 1,
            'total_memberships_current' => 1,
            'unique_members_current' => 1,
            'multi_group_members_current' => 0,
            'multi_group_ratio' => 0,
            'captured_at' => $baselineDate->setTime(23, 55),
        ]);

        $service = new GroupMetricsService();
        $dashboard = $service->dashboard('7d');

        $this->assertSame('7d', $dashboard['window']);
        $this->assertSame(2, $dashboard['summary']['unique_members_current']);
        $this->assertSame(1, $dashboard['summary']['unique_growth']['baseline']);
        $this->assertSame(1, $dashboard['summary']['unique_growth']['delta']);
        $this->assertFalse($dashboard['summary']['unique_growth']['has_history']);
        $this->assertNotEmpty($dashboard['series']);
        $this->assertSame($baselineDate->toDateString(), $dashboard['summary']['unique_growth']['first_snapshot_date']);
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
    }
}
