<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_inbound_event_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inbound_event_id')->constrained('whatsapp_inbound_events')->cascadeOnDelete();
            $table->unsignedInteger('revision_number');
            $table->json('payload_json')->nullable();
            $table->longText('text_message')->nullable();
            $table->string('text_title', 255)->nullable();
            $table->text('text_description')->nullable();
            $table->text('link_url')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();

            $table->unique(['inbound_event_id', 'revision_number'], 'whatsapp_inbound_event_revisions_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_inbound_event_revisions');
    }
};
