<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_whatsapp_event_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('inbound_event_id')->constrained('whatsapp_inbound_events')->cascadeOnDelete();
            $table->boolean('is_ignored')->default(false);
            $table->boolean('is_starred')->default(false);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'inbound_event_id'], 'user_whatsapp_event_states_unique');
            $table->index(['user_id', 'is_ignored'], 'user_whatsapp_event_states_ignored_idx');
            $table->index(['user_id', 'is_starred'], 'user_whatsapp_event_states_starred_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_whatsapp_event_states');
    }
};
