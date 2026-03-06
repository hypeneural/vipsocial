<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('provider', 50)->default('apify')->index();
            $table->string('provider_resource_type', 50)->default('task');
            $table->string('provider_resource_id', 191);
            $table->json('task_input_override')->nullable();
            $table->string('network', 50)->index();
            $table->string('handle', 191);
            $table->string('display_name', 191)->nullable();
            $table->string('external_profile_id', 191)->nullable();
            $table->string('url', 500)->nullable();
            $table->string('avatar_url', 1000)->nullable();
            $table->string('primary_metric_code', 100);
            $table->string('normalizer_type', 100)->default('path_map');
            $table->json('normalizer_config');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->dateTime('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['network', 'handle']);
            $table->index(['provider', 'provider_resource_type', 'provider_resource_id'], 'social_profiles_provider_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_profiles');
    }
};
