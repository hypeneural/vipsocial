<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_gallery_banners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')->constrained('external_events')->cascadeOnDelete();
            $table->string('image_path');
            $table->string('link_url')->nullable();
            $table->string('alt_text')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamps();

            $table->index(['external_event_id', 'is_active', 'sort_order'], 'idx_vip_gallery_banners_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_gallery_banners');
    }
};
