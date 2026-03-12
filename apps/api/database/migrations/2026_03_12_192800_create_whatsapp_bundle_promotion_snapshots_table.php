<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_bundle_promotion_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained('whatsapp_news_bundles')->cascadeOnDelete();
            $table->foreignId('news_item_id')->constrained('news_items')->cascadeOnDelete();
            $table->unsignedInteger('bundle_lock_version');
            $table->json('snapshot_json');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['bundle_id', 'created_at'], 'whatsapp_bundle_promotion_snapshots_bundle_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_bundle_promotion_snapshots');
    }
};
