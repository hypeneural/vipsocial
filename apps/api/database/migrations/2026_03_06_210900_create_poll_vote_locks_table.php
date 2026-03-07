<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_vote_locks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->string('lock_scope', 50);
            $table->string('lock_key', 191);
            $table->foreignUlid('vote_id')->nullable()->constrained('poll_votes')->nullOnDelete();
            $table->dateTime('locked_until')->nullable();
            $table->timestamps();

            $table->unique(['poll_id', 'lock_scope', 'lock_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_vote_locks');
    }
};
