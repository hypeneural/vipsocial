<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('social_metric_definitions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code', 100)->unique();
            $table->string('label', 191);
            $table->string('value_type', 50)->default('integer');
            $table->string('unit', 50)->default('count');
            $table->string('metric_group', 50)->default('audience')->index();
            $table->boolean('is_primary_candidate')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('social_metric_definitions')->insert([
            [
                'id' => (string) Str::ulid(),
                'code' => 'followers_total',
                'label' => 'Seguidores',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'audience',
                'is_primary_candidate' => true,
                'sort_order' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'following_total',
                'label' => 'Seguindo',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'audience',
                'is_primary_candidate' => false,
                'sort_order' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'likes_total',
                'label' => 'Curtidas',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'engagement',
                'is_primary_candidate' => false,
                'sort_order' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'subscribers_total',
                'label' => 'Inscritos',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'audience',
                'is_primary_candidate' => true,
                'sort_order' => 40,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'posts_total',
                'label' => 'Posts',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'content',
                'is_primary_candidate' => false,
                'sort_order' => 50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'videos_total',
                'label' => 'Videos',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'content',
                'is_primary_candidate' => false,
                'sort_order' => 60,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'views_total',
                'label' => 'Visualizacoes',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'content',
                'is_primary_candidate' => false,
                'sort_order' => 70,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'rating_overall',
                'label' => 'Avaliacao',
                'value_type' => 'decimal',
                'unit' => 'percent',
                'metric_group' => 'engagement',
                'is_primary_candidate' => false,
                'sort_order' => 80,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::ulid(),
                'code' => 'rating_count',
                'label' => 'Quantidade de avaliacoes',
                'value_type' => 'integer',
                'unit' => 'count',
                'metric_group' => 'engagement',
                'is_primary_candidate' => false,
                'sort_order' => 90,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('social_metric_definitions');
    }
};
