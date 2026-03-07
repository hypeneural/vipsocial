<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_vote_attempts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->foreignId('poll_placement_id')->nullable()->constrained('poll_placements')->nullOnDelete();
            $table->foreignUlid('poll_session_id')->nullable()->constrained('poll_sessions')->nullOnDelete();
            $table->string('status', 50);
            $table->string('block_reason', 191)->nullable();
            $table->decimal('risk_score', 5, 2)->nullable();
            $table->string('ip_hash', 191);
            $table->string('fingerprint_hash', 191)->nullable();
            $table->string('external_user_hash', 191)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('browser_family', 100)->nullable();
            $table->string('os_family', 100)->nullable();
            $table->string('device_type', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('region', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('asn', 100)->nullable();
            $table->string('provider', 191)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['poll_id', 'status', 'created_at']);
            $table->index(['poll_session_id', 'created_at']);
            $table->index(['ip_hash', 'created_at']);
            $table->index(['poll_placement_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_vote_attempts');
    }
};
