<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('whatsapp_group_memberships', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('group_fk')->constrained('whatsapp_groups')->cascadeOnDelete();
            $table->foreignUlid('participant_fk')->constrained('whatsapp_participants')->cascadeOnDelete();
            $table->string('status', 20)->default('active');
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_super_admin')->default(false);
            $table->dateTime('joined_at')->nullable();
            $table->dateTime('left_at')->nullable();
            $table->dateTime('last_seen_at')->nullable();
            $table->unsignedInteger('times_joined')->default(1);
            $table->timestamps();

            $table->unique(['group_fk', 'participant_fk'], 'uq_wpp_group_participant');
            $table->index(['group_fk', 'status'], 'idx_wpp_membership_group_status');
            $table->index(['participant_fk', 'status'], 'idx_wpp_membership_participant_status');
            $table->index(['group_fk', 'last_seen_at'], 'idx_wpp_membership_group_last_seen');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_group_memberships');
    }
};
