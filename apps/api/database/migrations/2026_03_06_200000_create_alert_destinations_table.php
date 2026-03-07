<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('target_kind', 50);
            $table->string('target_value', 64);
            $table->json('tags')->nullable();
            $table->boolean('active')->default(true);
            $table->dateTime('archived_at')->nullable();
            $table->dateTime('last_sent_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreignUlid('whatsapp_group_fk')->nullable()->constrained('whatsapp_groups')->nullOnDelete();
            $table->timestamps();

            $table->unique(['target_kind', 'target_value']);
            $table->index('active');
            $table->index('archived_at');
            $table->index('last_sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_destinations');
    }
};
