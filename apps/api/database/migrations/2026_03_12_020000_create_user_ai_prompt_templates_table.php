<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_ai_prompt_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->text('content');
            $table->string('provider_target', 50)->default('generic');
            $table->boolean('is_favorite')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_favorite'], 'idx_user_ai_prompts_user_favorite');
            $table->index(['user_id', 'sort_order'], 'idx_user_ai_prompts_user_sort');
            $table->index(['user_id', 'deleted_at'], 'idx_user_ai_prompts_user_deleted');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_ai_prompt_templates');
    }
};
