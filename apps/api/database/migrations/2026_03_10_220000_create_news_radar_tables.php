<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. news_themes ──────────────────────────────
        if (! Schema::hasTable('news_themes')) {
            Schema::create('news_themes', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();
                $table->string('label');
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

        // ── 2. news_sources ─────────────────────────────
        if (! Schema::hasTable('news_sources')) {
            Schema::create('news_sources', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('homepage_url')->unique();
                $table->boolean('active')->default(true);
                $table->string('source_type')->default('portal');          // portal, prefeitura, blog, agencia, whatsapp
                $table->string('discovery_mode')->default('auto');          // auto, feed, sitemap, html_listing
                $table->string('feed_quality_profile')->nullable();         // full, partial, teaser_only (diagnostic)
                $table->string('fetch_detail_mode')->default('when_incomplete'); // never, when_incomplete, always (operational)
                $table->string('source_preset')->nullable();                // html_listing_detail, rss_full_clean, etc.
                $table->json('crawling_config')->nullable();                // Versioned JSON schema
                $table->json('throttle_config')->nullable();                // crawl_interval_min/max, autoadjust
                $table->string('timezone_default')->default('America/Sao_Paulo');
                $table->json('date_formats')->nullable();
                $table->boolean('render_js_required')->default(false);
                $table->timestamp('last_sync_at')->nullable();
                $table->timestamp('next_sync_at')->nullable();
                $table->timestamp('sync_locked_until')->nullable();         // Concurrency lock
                $table->integer('consecutive_failures')->default(0);
                $table->float('success_rate')->default(100);
                $table->integer('avg_response_ms')->nullable();
                $table->integer('last_items_found')->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['next_sync_at', 'active']);
            });
        }

        // ── 3. news_source_runs ─────────────────────────
        if (! Schema::hasTable('news_source_runs')) {
            Schema::create('news_source_runs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('news_source_id')->constrained('news_sources')->cascadeOnDelete();
                $table->timestamp('started_at');
                $table->timestamp('finished_at')->nullable();
                $table->string('status')->default('running');   // running, success, partial, failed
                $table->integer('items_found')->default(0);
                $table->integer('items_new')->default(0);
                $table->integer('items_failed')->default(0);
                $table->integer('response_time_avg_ms')->nullable();
                $table->text('error_message')->nullable();
                $table->json('meta_json')->nullable();

                $table->index('news_source_id');
            });
        }

        // ── 4. source_discovery_runs ────────────────────
        if (! Schema::hasTable('source_discovery_runs')) {
            Schema::create('source_discovery_runs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('requested_url');
                $table->string('status')->default('pending');   // pending, running, completed, failed
                $table->json('result_json')->nullable();
                $table->json('selector_test_snapshots')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->timestamps();
            });
        }

        // ── 5. news_raw_items ───────────────────────────
        if (! Schema::hasTable('news_raw_items')) {
            Schema::create('news_raw_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('news_source_id')->constrained('news_sources')->cascadeOnDelete();
                $table->foreignId('news_source_run_id')->nullable()->constrained('news_source_runs')->nullOnDelete();
                $table->unsignedBigInteger('last_seen_run_id')->nullable();
                $table->string('raw_url');
                $table->string('normalized_url');
                $table->string('url_hash', 64);
                $table->string('guid')->nullable();
                $table->string('title_raw')->nullable();
                $table->longText('body_raw')->nullable();
                $table->json('raw_payload')->nullable();
                $table->dateTime('first_seen_at');
                $table->dateTime('last_seen_at');
                $table->integer('seen_count')->default(1);
                $table->string('processing_status')->default('pending'); // pending, processing, promoted, skipped, failed
                $table->integer('fetch_attempts')->default(0);
                $table->text('last_fetch_error')->nullable();
                $table->timestamp('last_fetch_at')->nullable();
                $table->timestamps();

                $table->unique(['news_source_id', 'url_hash']);
                $table->index('news_source_id');
                $table->index('normalized_url');
                $table->index('url_hash');
                $table->index('guid');
            });
        }

        // ── 6. news_items ───────────────────────────────
        if (! Schema::hasTable('news_items')) {
            Schema::create('news_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('news_source_id')->constrained('news_sources')->cascadeOnDelete();
                $table->foreignId('news_raw_item_id')->nullable()->constrained('news_raw_items')->nullOnDelete();
                $table->string('url');
                $table->string('url_hash', 64)->unique();
                $table->string('raw_url');
                $table->string('guid')->nullable();
                $table->string('title');
                $table->string('subtitle')->nullable();
                $table->string('author_raw')->nullable();
                $table->string('author_normalized')->nullable();
                $table->longText('body_html')->nullable();
                $table->longText('body_text')->nullable();
                $table->text('excerpt')->nullable();
                $table->string('hero_image_url')->nullable();
                $table->json('categories_raw')->nullable();
                $table->string('language', 5)->nullable()->default('pt-BR');
                $table->string('published_at_raw')->nullable();
                $table->timestamp('published_at_parsed')->nullable();
                $table->timestamp('published_at_utc')->nullable();
                $table->string('published_at_timezone')->nullable();
                $table->string('published_at_source')->nullable();      // rss, jsonld, og_tag, time_tag, text_pattern, manual
                $table->string('modified_at_raw')->nullable();
                $table->timestamp('modified_at_utc')->nullable();
                $table->integer('extraction_completeness')->default(0);
                $table->string('content_source')->nullable();           // feed_only, feed_plus_html, html_only
                $table->string('extraction_status')->default('pending');  // pending, extracted, extraction_failed
                $table->string('enrichment_status')->default('none');     // none, enriched_l1, enriched_l2, enrichment_failed
                $table->boolean('is_duplicate_candidate')->default(false);
                $table->foreignId('duplicate_of_news_item_id')->nullable()->constrained('news_items')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['extraction_status', 'enrichment_status', 'published_at_utc'], 'news_items_status_published_idx');
                $table->index(['news_source_id', 'published_at_utc']);
                $table->index('guid');
            });
        }

        // ── 7. news_item_media ──────────────────────────
        if (! Schema::hasTable('news_item_media')) {
            Schema::create('news_item_media', function (Blueprint $table) {
                $table->id();
                $table->foreignId('news_item_id')->constrained('news_items')->cascadeOnDelete();
                $table->string('type');         // hero, gallery, video, embed
                $table->string('url');
                $table->integer('width')->nullable();
                $table->integer('height')->nullable();
                $table->string('alt_text')->nullable();
                $table->integer('position')->default(0);
                $table->timestamps();

                $table->index('news_item_id');
            });
        }

        // ── 8. news_item_ai_metadata ────────────────────
        if (! Schema::hasTable('news_item_ai_metadata')) {
            Schema::create('news_item_ai_metadata', function (Blueprint $table) {
                $table->id();
                $table->foreignId('news_item_id')->unique()->constrained('news_items')->cascadeOnDelete();
                $table->string('city')->nullable();
                $table->string('state_abbr', 2)->nullable();
                $table->foreignId('news_theme_id')->nullable()->constrained('news_themes')->nullOnDelete();
                $table->string('urgency')->nullable();          // baixa, media, alta
                $table->float('relevance_score')->nullable();
                $table->json('entities')->nullable();
                $table->json('five_ws')->nullable();
                $table->json('suggested_titles')->nullable();
                $table->json('summary_bullets')->nullable();
                $table->string('ai_model_used')->nullable();
                $table->integer('ai_tokens_used')->nullable();
                $table->string('enrichment_level')->default('none'); // none, level_1, level_2
                $table->timestamps();

                $table->index(['news_theme_id', 'city', 'urgency']);
            });
        }

        // ── 9. news_clusters ────────────────────────────
        if (! Schema::hasTable('news_clusters')) {
            Schema::create('news_clusters', function (Blueprint $table) {
                $table->id();
                $table->string('label')->nullable();
                $table->timestamps();
            });
        }

        // ── 10. news_cluster_items (pivot) ──────────────
        if (! Schema::hasTable('news_cluster_items')) {
            Schema::create('news_cluster_items', function (Blueprint $table) {
                $table->foreignId('news_cluster_id')->constrained('news_clusters')->cascadeOnDelete();
                $table->foreignId('news_item_id')->constrained('news_items')->cascadeOnDelete();
                $table->float('similarity_score');

                $table->unique(['news_cluster_id', 'news_item_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('news_cluster_items');
        Schema::dropIfExists('news_clusters');
        Schema::dropIfExists('news_item_ai_metadata');
        Schema::dropIfExists('news_item_media');
        Schema::dropIfExists('news_items');
        Schema::dropIfExists('news_raw_items');
        Schema::dropIfExists('source_discovery_runs');
        Schema::dropIfExists('news_source_runs');
        Schema::dropIfExists('news_sources');
        Schema::dropIfExists('news_themes');
    }
};
