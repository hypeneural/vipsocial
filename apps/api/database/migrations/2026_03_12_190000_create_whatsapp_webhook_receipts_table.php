<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_webhook_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32)->default('zapi')->index();
            $table->string('instance_id', 120)->nullable()->index();
            $table->json('headers_json')->nullable();
            $table->json('payload_json');
            $table->string('payload_hash', 64)->index();
            $table->timestamp('received_at')->nullable()->index();
            $table->string('processing_status', 32)->default('received')->index();
            $table->unsignedInteger('processing_attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->unsignedBigInteger('normalized_event_id')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_webhook_receipts');
    }
};
