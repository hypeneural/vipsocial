<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->string('title');
            $table->text('question');
            $table->string('slug')->nullable();
            $table->string('status', 50)->default('draft');
            $table->string('selection_type', 50)->default('single');
            $table->unsignedInteger('max_choices')->nullable();
            $table->string('vote_limit_mode', 50)->default('once_ever');
            $table->unsignedInteger('vote_cooldown_minutes')->nullable();
            $table->string('results_visibility', 50)->default('live');
            $table->string('after_end_behavior', 50)->default('show_results_only');
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->string('timezone', 100)->default('America/Sao_Paulo');
            $table->json('settings')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('starts_at');
            $table->index('ends_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('polls');
    }
};
