<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vip_gallery_slideshows', function (Blueprint $table): void {
            if (! Schema::hasColumn('vip_gallery_slideshows', 'show_sender_credit')) {
                $table->boolean('show_sender_credit')
                    ->default(false)
                    ->after('show_neon');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vip_gallery_slideshows', function (Blueprint $table): void {
            if (Schema::hasColumn('vip_gallery_slideshows', 'show_sender_credit')) {
                $table->dropColumn('show_sender_credit');
            }
        });
    }
};
