<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_bundle_markdown_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained('whatsapp_news_bundles')->cascadeOnDelete();
            $table->unsignedInteger('bundle_lock_version');
            $table->longText('markdown_text');
            $table->string('markdown_hash', 64);
            $table->string('signed_token', 120)->unique();
            $table->timestamp('expires_at');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['bundle_id', 'created_at'], 'whatsapp_bundle_markdown_exports_bundle_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_bundle_markdown_exports');
    }
};
