<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Clients\ZApiClient;
use App\Modules\WhatsApp\Jobs\SyncGroupMetadataJob;
use App\Modules\WhatsApp\Models\WhatsAppGroupMembership;
use App\Modules\WhatsApp\Services\GroupSyncService;
use App\Modules\WhatsApp\Services\GroupSnapshotService;
use App\Modules\WhatsApp\Services\WhatsAppService;
use App\Modules\WhatsApp\Support\PhoneNormalizer;
use App\Modules\WhatsApp\Support\WhatsAppTargetNormalizer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SyncGroupMetadataJobTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();

        config([
            'whatsapp.zapi.base_url' => 'https://api.z-api.io',
            'whatsapp.zapi.instance' => 'instance-test',
            'whatsapp.zapi.token' => 'token-test',
            'whatsapp.zapi.client_token' => 'client-token-test',
            'whatsapp.zapi.timeout' => 10,
            'whatsapp.zapi.retry_times' => 1,
            'whatsapp.zapi.retry_sleep_ms' => 1,
        ]);
    }

    public function test_job_syncs_group_using_http_fake_payload(): void
    {
        Http::fake([
            '*' => Http::response([
                'phone' => '120363027326371817-group',
                'subject' => 'Noticias VipSocial',
                'name' => 'Noticias VipSocial',
                'participants' => [
                    [
                        'phone' => '',
                        'lid' => '188407984689186@lid',
                        'isAdmin' => false,
                        'isSuperAdmin' => false,
                    ],
                    [
                        'phone' => '',
                        'lid' => '144113366245434@lid',
                        'isAdmin' => true,
                        'isSuperAdmin' => false,
                    ],
                ],
            ], 200),
        ]);

        $service = new GroupSyncService(
            new WhatsAppService(new ZApiClient(), new WhatsAppTargetNormalizer(new PhoneNormalizer())),
            new GroupSnapshotService()
        );

        $job = new SyncGroupMetadataJob('120363027326371817-group', 'batch_http_fake', false);
        $job->handle($service);

        $this->assertSame(2, WhatsAppGroupMembership::query()->active()->count());
        Http::assertSentCount(1);
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
