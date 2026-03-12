<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_item_whatsapp_origins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_item_id')->constrained('news_items')->cascadeOnDelete();
            $table->foreignId('bundle_id')->constrained('whatsapp_news_bundles')->cascadeOnDelete();
            $table->foreignId('inbound_event_id')->constrained('whatsapp_inbound_events')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['bundle_id', 'news_item_id'], 'news_item_whatsapp_origins_bundle_news_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_item_whatsapp_origins');
    }
};
