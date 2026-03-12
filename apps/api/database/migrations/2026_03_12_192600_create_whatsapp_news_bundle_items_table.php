<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_news_bundle_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained('whatsapp_news_bundles')->cascadeOnDelete();
            $table->foreignId('inbound_event_id')->constrained('whatsapp_inbound_events')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['bundle_id', 'inbound_event_id'], 'whatsapp_news_bundle_items_unique');
            $table->index(['bundle_id', 'sort_order'], 'whatsapp_news_bundle_items_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_news_bundle_items');
    }
};
