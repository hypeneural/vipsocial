<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vip_gallery_photos', function (Blueprint $table) {
            $table->string('media_type', 16)
                ->default('image')
                ->after('processed_image_path');
            $table->string('short_text', 255)
                ->nullable()
                ->after('caption');
            $table->unsignedInteger('highlight_score')
                ->default(0)
                ->after('media_type');
            $table->timestamp('slideshow_visible_at')
                ->nullable()
                ->after('published_at');
        });
    }

    public function down(): void
    {
        Schema::table('vip_gallery_photos', function (Blueprint $table) {
            $table->dropColumn([
                'media_type',
                'short_text',
                'highlight_score',
                'slideshow_visible_at',
            ]);
        });
    }
};
