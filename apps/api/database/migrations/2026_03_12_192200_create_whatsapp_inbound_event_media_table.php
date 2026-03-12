<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_inbound_event_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inbound_event_id')->constrained('whatsapp_inbound_events')->cascadeOnDelete();
            $table->string('kind', 32);
            $table->text('source_url')->nullable();
            $table->text('thumbnail_source_url')->nullable();
            $table->string('storage_disk', 64)->nullable();
            $table->string('storage_path')->nullable();
            $table->string('storage_visibility', 32)->nullable();
            $table->string('thumbnail_storage_path')->nullable();
            $table->string('file_name', 255)->nullable();
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedBigInteger('duration_ms')->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->string('download_status', 32)->default('pending');
            $table->unsignedInteger('download_attempts')->default(0);
            $table->timestamp('preview_ready_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['inbound_event_id', 'kind'], 'whatsapp_inbound_event_media_kind_idx');
            $table->index('download_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_inbound_event_media');
    }
};
