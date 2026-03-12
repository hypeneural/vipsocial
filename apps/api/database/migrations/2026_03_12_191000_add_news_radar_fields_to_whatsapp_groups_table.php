<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_groups', function (Blueprint $table) {
            $table->string('provider', 32)->default('zapi');
            $table->string('provider_group_id', 120)->nullable();
            $table->string('connected_phone', 30)->nullable();
            $table->boolean('news_ingest_enabled')->default(false);
            $table->boolean('vip_gallery_enabled')->default(false);
            $table->boolean('allow_media_download')->default(true);
            $table->boolean('allow_ai_export')->default(false);
            $table->string('default_label', 255)->nullable();
            $table->string('default_city', 120)->nullable();
            $table->string('default_category', 120)->nullable();
            $table->foreignId('news_source_id')->nullable()->constrained('news_sources')->nullOnDelete();
        });

        DB::table('whatsapp_groups')
            ->whereNull('provider_group_id')
            ->update([
                'provider' => 'zapi',
                'provider_group_id' => DB::raw('group_id'),
            ]);

        Schema::table('whatsapp_groups', function (Blueprint $table) {
            $table->unique(['provider', 'provider_group_id'], 'whatsapp_groups_provider_group_unique');
            $table->index(['news_ingest_enabled', 'is_active'], 'whatsapp_groups_news_ingest_idx');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_groups', function (Blueprint $table) {
            $table->dropUnique('whatsapp_groups_provider_group_unique');
            $table->dropIndex('whatsapp_groups_news_ingest_idx');
            $table->dropConstrainedForeignId('news_source_id');
            $table->dropColumn([
                'provider',
                'provider_group_id',
                'connected_phone',
                'news_ingest_enabled',
                'vip_gallery_enabled',
                'allow_media_download',
                'allow_ai_export',
                'default_label',
                'default_city',
                'default_category',
            ]);
        });
    }
};
