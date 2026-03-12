<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_news_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('whatsapp_group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
            $table->string('status', 32)->default('open');
            $table->string('creation_mode', 32)->default('manual_selection');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255)->nullable();
            $table->string('slug_hint', 255)->nullable();
            $table->string('headline_draft', 255)->nullable();
            $table->string('subheadline_draft', 255)->nullable();
            $table->text('lead_draft')->nullable();
            $table->text('summary')->nullable();
            $table->text('origin_summary')->nullable();
            $table->text('notes')->nullable();
            $table->text('editorial_notes')->nullable();
            $table->text('promotion_notes')->nullable();
            $table->string('city', 120)->nullable();
            $table->string('urgency', 32)->nullable();
            $table->string('category', 120)->nullable();
            $table->json('categories_json')->nullable();
            $table->boolean('is_starred')->default(false);
            $table->unsignedBigInteger('cover_media_id')->nullable();
            $table->unsignedInteger('lock_version')->default(1);
            $table->foreignId('last_opened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_opened_at')->nullable();
            $table->timestamp('review_started_at')->nullable();
            $table->timestamp('promoted_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('first_message_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->unsignedInteger('message_count')->default(0);
            $table->unsignedInteger('media_count')->default(0);
            $table->string('primary_sender_name', 255)->nullable();
            $table->boolean('has_updated_source_messages')->default(false);
            $table->foreignId('promoted_news_item_id')->nullable()->constrained('news_items')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['whatsapp_group_fk', 'status'], 'whatsapp_news_bundles_group_status_idx');
            $table->index(['created_by', 'status'], 'whatsapp_news_bundles_creator_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_news_bundles');
    }
};
