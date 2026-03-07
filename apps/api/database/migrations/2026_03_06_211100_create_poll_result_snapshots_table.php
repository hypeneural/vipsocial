<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_result_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('polls')->cascadeOnDelete();
            $table->string('bucket_type', 20);
            $table->dateTime('bucket_at');
            $table->unsignedInteger('impressions')->default(0);
            $table->unsignedInteger('unique_sessions')->default(0);
            $table->unsignedInteger('votes_accepted')->default(0);
            $table->unsignedInteger('votes_blocked')->default(0);
            $table->decimal('conversion_rate', 7, 4)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->unique(['poll_id', 'bucket_type', 'bucket_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_result_snapshots');
    }
};
