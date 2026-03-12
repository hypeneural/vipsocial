<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_whatsapp_news_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('whatsapp_group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->string('label_override', 255)->nullable();
            $table->foreignId('last_seen_event_id')->nullable()->constrained('whatsapp_inbound_events')->nullOnDelete();
            $table->timestamp('last_seen_event_at')->nullable();
            $table->string('notification_mode', 32)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'whatsapp_group_fk'], 'user_whatsapp_news_groups_unique');
            $table->index(['user_id', 'is_active', 'sort_order'], 'user_whatsapp_news_groups_active_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_whatsapp_news_groups');
    }
};
