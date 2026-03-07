<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->foreignId('poll_placement_id')->nullable()->constrained('poll_placements')->nullOnDelete();
            $table->foreignUlid('poll_session_id')->nullable()->constrained('poll_sessions')->nullOnDelete();
            $table->string('event_type', 100);
            $table->foreignId('option_id')->nullable()->constrained('poll_options')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->dateTime('created_at');

            $table->index(['poll_id', 'event_type', 'created_at']);
            $table->index(['poll_placement_id', 'created_at']);
            $table->index(['poll_session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_events');
    }
};
