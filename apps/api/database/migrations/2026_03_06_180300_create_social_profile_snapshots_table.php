<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_profile_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('social_profile_id')->constrained('social_profiles')->cascadeOnDelete();
            $table->foreignUlid('social_sync_run_id')->nullable()->constrained('social_sync_runs')->nullOnDelete();
            $table->date('metric_date');
            $table->dateTime('captured_at');
            $table->timestamps();

            $table->unique(['social_profile_id', 'metric_date'], 'social_profile_snapshots_profile_date_unique');
            $table->index(['metric_date', 'captured_at'], 'social_profile_snapshots_date_captured_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_profile_snapshots');
    }
};
