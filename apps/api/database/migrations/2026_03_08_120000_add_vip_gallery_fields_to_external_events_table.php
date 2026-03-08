<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->boolean('is_vip_gallery')->default(false)->after('observacao_interna');
            $table->string('vip_gallery_status', 50)->default('draft')->after('is_vip_gallery');
            $table->string('whatsapp_group_id', 120)->nullable()->after('vip_gallery_status');
            $table->string('gallery_slug', 160)->nullable()->after('whatsapp_group_id');
            $table->string('custom_logo_path')->nullable()->after('gallery_slug');
            $table->unsignedInteger('logo_size_percent')->default(15)->after('custom_logo_path');
            $table->unsignedBigInteger('views_count')->default(0)->after('logo_size_percent');
            $table->boolean('allow_delete_command')->default(false)->after('views_count');
            $table->string('delete_command_keyword', 100)->default('Apagar')->after('allow_delete_command');

            $table->index('whatsapp_group_id', 'idx_external_events_vip_whatsapp_group');
            $table->index(['is_vip_gallery', 'vip_gallery_status'], 'idx_external_events_vip_status');
            $table->unique('gallery_slug', 'external_events_gallery_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->dropUnique('external_events_gallery_slug_unique');
            $table->dropIndex('idx_external_events_vip_whatsapp_group');
            $table->dropIndex('idx_external_events_vip_status');

            $table->dropColumn([
                'is_vip_gallery',
                'vip_gallery_status',
                'whatsapp_group_id',
                'gallery_slug',
                'custom_logo_path',
                'logo_size_percent',
                'views_count',
                'allow_delete_command',
                'delete_command_keyword',
            ]);
        });
    }
};
