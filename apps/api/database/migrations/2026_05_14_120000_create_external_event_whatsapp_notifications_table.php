<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_event_whatsapp_notifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('external_event_id')->constrained('external_events')->cascadeOnDelete();
            $table->string('trigger_type', 50);
            $table->string('recipient_type', 50);
            $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_name_snapshot')->nullable();
            $table->string('recipient_role_snapshot', 100)->nullable();
            $table->string('target_kind', 50);
            $table->string('target_value', 64);
            $table->text('message_snapshot');
            $table->string('event_title_snapshot');
            $table->dateTime('event_start_snapshot');
            $table->dateTime('scheduled_for');
            $table->string('status', 50);
            $table->string('idempotency_key', 191);
            $table->string('provider', 50)->default('zapi');
            $table->string('provider_zaap_id', 191)->nullable();
            $table->string('provider_message_id', 191)->nullable();
            $table->string('provider_response_id', 191)->nullable();
            $table->integer('provider_status_code')->nullable();
            $table->json('provider_response')->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->unique('idempotency_key');
            $table->index(['external_event_id', 'trigger_type'], 'external_event_whatsapp_event_trigger_idx');
            $table->index(['status', 'scheduled_for'], 'external_event_whatsapp_status_due_idx');
            $table->index(['recipient_user_id', 'scheduled_for'], 'external_event_whatsapp_user_due_idx');
            $table->index(['target_kind', 'target_value', 'scheduled_for'], 'external_event_whatsapp_target_due_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_event_whatsapp_notifications');
    }
};
