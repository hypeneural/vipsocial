<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_raffle_draws', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('confirmation_code', 20)->index();
            $table->string('group_id', 80)->index();
            $table->string('group_subject', 255)->nullable();
            $table->string('campaign_name', 255)->nullable();
            $table->string('campaign_key', 120)->index();
            $table->unsignedInteger('eligible_participants_count');
            $table->string('winner_phone_hash', 64);
            $table->text('winner_phone_encrypted');
            $table->string('phone_last_digits', 10);
            $table->boolean('winner_had_photo')->default(false);
            $table->text('photo_url')->nullable();
            $table->foreignId('drawn_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('drawn_at');
            $table->string('provider', 50)->default('zapi');
            $table->string('provider_payload_hash', 64)->nullable();
            $table->unsignedInteger('reveal_count')->default(0);
            $table->timestamp('last_revealed_at')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'campaign_key'], 'whatsapp_raffle_draws_group_campaign_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_raffle_draws');
    }
};
