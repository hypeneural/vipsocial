<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_inbound_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32);
            $table->string('instance_id', 120)->default('');
            $table->string('message_id', 120);
            $table->string('provider_message_id', 120)->nullable();
            $table->unsignedInteger('normalized_version')->default(1);
            $table->string('payload_hash', 64)->nullable();
            $table->foreignId('ingested_via_receipt_id')->nullable()->constrained('whatsapp_webhook_receipts')->nullOnDelete();
            $table->foreignUlid('whatsapp_group_fk')->nullable()->constrained('whatsapp_groups')->nullOnDelete();
            $table->string('group_id_raw', 120)->nullable();
            $table->string('chat_name', 255)->nullable();
            $table->boolean('is_group')->default(false);
            $table->boolean('is_newsletter')->default(false);
            $table->boolean('from_me')->default(false);
            $table->boolean('is_edit')->default(false);
            $table->string('provider_event_type', 64)->nullable();
            $table->string('status', 32)->nullable();
            $table->string('message_kind', 32)->default('unknown');
            $table->string('participant_phone', 30)->nullable();
            $table->string('participant_lid', 120)->nullable();
            $table->string('participant_display_name', 255)->nullable();
            $table->string('sender_name', 255)->nullable();
            $table->text('sender_photo')->nullable();
            $table->json('sender_snapshot_json')->nullable();
            $table->string('reference_message_id', 120)->nullable();
            $table->string('reply_to_message_id', 120)->nullable();
            $table->foreignId('reply_to_inbound_event_id')->nullable()->constrained('whatsapp_inbound_events')->nullOnDelete();
            $table->longText('text_message')->nullable();
            $table->string('text_title', 255)->nullable();
            $table->text('text_description')->nullable();
            $table->text('link_url')->nullable();
            $table->string('processing_status', 32)->default('received');
            $table->string('ignored_reason', 64)->nullable();
            $table->string('provider_error_code', 64)->nullable();
            $table->text('provider_error_message')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->string('download_status', 32)->default('skipped');
            $table->timestamp('group_resolved_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->boolean('has_media')->default(false);
            $table->boolean('has_caption')->default(false);
            $table->boolean('is_forwarded')->default(false);
            $table->float('forwarded_score')->nullable();
            $table->float('news_signal_score')->nullable();
            $table->float('relevance_score')->nullable();
            $table->string('suggested_bundle_key', 120)->nullable();
            $table->string('detected_city', 120)->nullable();
            $table->string('detected_category', 120)->nullable();
            $table->boolean('has_external_link')->default(false);
            $table->boolean('contains_release_pattern')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'instance_id', 'message_id'], 'whatsapp_inbound_events_provider_instance_message_unique');
            $table->index(['whatsapp_group_fk', 'sent_at', 'id'], 'whatsapp_inbound_events_group_timeline_idx');
            $table->index('processing_status');
            $table->index('reply_to_inbound_event_id');
            $table->index('ingested_via_receipt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_inbound_events');
    }
};
