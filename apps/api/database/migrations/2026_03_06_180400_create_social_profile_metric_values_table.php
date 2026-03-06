<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_profile_metric_values', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('social_profile_snapshot_id')->constrained('social_profile_snapshots')->cascadeOnDelete();
            $table->foreignUlid('social_metric_definition_id')->constrained('social_metric_definitions')->restrictOnDelete();
            $table->decimal('value_number', 20, 4)->nullable();
            $table->string('value_text', 500)->nullable();
            $table->json('value_json')->nullable();
            $table->string('raw_key', 191)->nullable();
            $table->timestamps();

            $table->unique(
                ['social_profile_snapshot_id', 'social_metric_definition_id'],
                'social_profile_metric_values_snapshot_metric_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_profile_metric_values');
    }
};
