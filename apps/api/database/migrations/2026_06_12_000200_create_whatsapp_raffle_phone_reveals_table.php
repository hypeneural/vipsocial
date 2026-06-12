<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_raffle_phone_reveals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('draw_id')->constrained('whatsapp_raffle_draws')->cascadeOnDelete();
            $table->foreignId('revealed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revealed_at');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['draw_id', 'revealed_at'], 'whatsapp_raffle_reveals_draw_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_raffle_phone_reveals');
    }
};
