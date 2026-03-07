<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_votes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->foreignId('option_id')->constrained('poll_options')->cascadeOnDelete();
            $table->foreignId('poll_placement_id')->nullable()->constrained('poll_placements')->nullOnDelete();
            $table->foreignUlid('poll_session_id')->nullable()->constrained('poll_sessions')->nullOnDelete();
            $table->foreignUlid('vote_attempt_id')->nullable()->constrained('poll_vote_attempts')->nullOnDelete();
            $table->string('status', 50)->default('valid');
            $table->string('ip_hash', 191);
            $table->string('fingerprint_hash', 191)->nullable();
            $table->string('external_user_hash', 191)->nullable();
            $table->dateTime('accepted_at');
            $table->dateTime('invalidated_at')->nullable();
            $table->text('invalidated_reason')->nullable();
            $table->json('geo_snapshot')->nullable();
            $table->json('device_snapshot')->nullable();
            $table->timestamps();

            $table->index(['poll_id', 'status', 'accepted_at']);
            $table->index(['poll_id', 'option_id', 'status']);
            $table->index(['poll_placement_id', 'accepted_at']);
            $table->unique(['vote_attempt_id', 'option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_votes');
    }
};
