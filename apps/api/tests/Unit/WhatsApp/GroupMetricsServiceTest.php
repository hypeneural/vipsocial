<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroupMemberEvent;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
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
