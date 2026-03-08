<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_gallery_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')->constrained('external_events')->cascadeOnDelete();
            $table->string('zapi_message_id', 100)->unique();
            $table->string('participant_phone', 30)->index();
            $table->string('sender_name', 100)->nullable();
            $table->text('caption')->nullable();
            $table->text('original_image_url')->nullable();
            $table->string('original_image_path')->nullable();
            $table->string('processed_image_path')->nullable();
            $table->unsignedInteger('width')->default(0);
            $table->unsignedInteger('height')->default(0);
            $table->string('processing_status', 50)->default('received');
            $table->unsignedInteger('processing_attempts')->default(0);
            $table->timestamp('last_processing_attempt_at')->nullable();
            $table->text('processing_error')->nullable();
            $table->integer('sort_order')->default(0);
            $table->unsignedBigInteger('downloads_count')->default(0);
            $table->boolean('is_approved')->default(true);
            $table->timestamp('received_at')->nullable()->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();

            $table->index(
                ['external_event_id', 'processing_status', 'published_at', 'id'],
                'idx_vip_gallery_photos_cursor'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_gallery_photos');
    }
};
