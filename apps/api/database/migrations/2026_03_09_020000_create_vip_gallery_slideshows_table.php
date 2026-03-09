<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_gallery_slideshows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')
                ->unique()
                ->constrained('external_events')
                ->cascadeOnDelete();
            $table->string('slideshow_code', 32)->unique();
            $table->boolean('is_enabled')->default(false);
            $table->string('status', 32)->default('draft');
            $table->string('layout', 32)->default('polaroid');
            $table->unsignedInteger('interval_ms')->default(10000);
            $table->unsignedInteger('queue_limit')->default(100);
            $table->string('background_url')->nullable();
            $table->string('partner_logo_path')->nullable();
            $table->boolean('show_neon')->default(true);
            $table->string('neon_text')->nullable();
            $table->text('instructions_text')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_gallery_slideshows');
    }
};
