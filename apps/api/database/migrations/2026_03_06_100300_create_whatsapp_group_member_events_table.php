<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('whatsapp_group_member_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
            $table->foreignUlid('participant_fk')->constrained('whatsapp_participants')->cascadeOnDelete();
            $table->string('event_type', 30);
            $table->dateTime('event_at');
            $table->string('sync_batch_id', 120)->nullable();
            $table->timestamps();

            $table->index(['group_fk', 'event_at'], 'idx_wpp_event_group_date');
            $table->index(['event_type', 'event_at'], 'idx_wpp_event_type_date');
            $table->index(['participant_fk', 'event_at'], 'idx_wpp_event_participant_date');
            $table->index(['sync_batch_id'], 'idx_wpp_event_batch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_group_member_events');
    }
};
