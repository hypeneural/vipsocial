<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_sessions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->foreignId('poll_placement_id')->nullable()->constrained('poll_placements')->nullOnDelete();
            $table->string('session_token_hash', 191)->unique();
            $table->string('fingerprint_hash', 191)->nullable();
            $table->string('external_user_hash', 191)->nullable();
            $table->string('ip_hash', 191);
            $table->string('user_agent_hash', 191);
            $table->text('referrer_url')->nullable();
            $table->string('referrer_domain', 191)->nullable();
            $table->string('origin_domain', 191)->nullable();
            $table->dateTime('first_seen_at');
            $table->dateTime('last_seen_at');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('id');
            $table->index(['poll_id', 'last_seen_at']);
            $table->index(['poll_placement_id', 'last_seen_at']);
            $table->index('fingerprint_hash');
            $table->index('ip_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_sessions');
    }
};
