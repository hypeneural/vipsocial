<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_placements', function (Blueprint $table) {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->foreignId('poll_site_id')->nullable()->constrained('poll_sites')->nullOnDelete();
            $table->string('placement_name');
            $table->string('article_external_id')->nullable();
            $table->string('article_title')->nullable();
            $table->text('canonical_url')->nullable();
            $table->string('page_path')->nullable();
            $table->string('embed_token_hash', 191)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_seen_at')->nullable();
            $table->timestamps();

            $table->index(['poll_id', 'is_active']);
            $table->index(['poll_site_id', 'is_active']);
            $table->index('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_placements');
    }
};
