<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vip_gallery_webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('message_id', 100)->nullable()->index();
            $table->string('phone', 120)->nullable()->index();
            $table->string('detected_type', 50)->default('unknown');
            $table->string('routing_status', 50)->default('received');
            $table->json('payload_json');
            $table->foreignId('vip_gallery_photo_id')->nullable()->constrained('vip_gallery_photos')->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vip_gallery_webhook_logs');
    }
};
