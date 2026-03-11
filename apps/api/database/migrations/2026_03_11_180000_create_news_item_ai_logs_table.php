<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('news_item_ai_logs')) {
            return;
        }

        Schema::create('news_item_ai_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_item_id')->constrained('news_items')->cascadeOnDelete();
            $table->string('stage', 50);
            $table->string('status', 20);
            $table->string('model')->nullable();
            $table->integer('tokens_used')->nullable();
            $table->text('error_message')->nullable();
            $table->json('meta_json')->nullable();
            $table->timestamps();

            $table->index(['news_item_id', 'created_at'], 'news_item_ai_logs_item_created_idx');
            $table->index(['stage', 'status'], 'news_item_ai_logs_stage_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_item_ai_logs');
    }
};
