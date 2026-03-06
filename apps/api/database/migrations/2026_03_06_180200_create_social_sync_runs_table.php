<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_sync_runs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('social_profile_id')->constrained('social_profiles')->cascadeOnDelete();
            $table->date('metric_date')->index();
            $table->string('status', 50)->index();
            $table->string('apify_run_id', 191)->nullable()->index();
            $table->string('apify_dataset_id', 191)->nullable()->index();
            $table->string('normalizer_type', 100);
            $table->string('normalizer_version', 50);
            $table->string('raw_item_hash', 64)->nullable()->index();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->decimal('usage_total_usd', 12, 6)->nullable();
            $table->decimal('compute_units', 12, 6)->nullable();
            $table->string('pricing_model', 100)->nullable();
            $table->text('error_message')->nullable();
            $table->json('raw_run')->nullable();
            $table->json('raw_item')->nullable();
            $table->json('normalized_payload')->nullable();
            $table->timestamps();

            $table->index(['social_profile_id', 'metric_date'], 'social_sync_runs_profile_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_sync_runs');
    }
};
