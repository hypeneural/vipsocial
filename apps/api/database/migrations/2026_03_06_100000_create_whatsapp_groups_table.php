<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('whatsapp_groups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('group_id', 100)->unique();
            $table->string('name', 255)->nullable();
            $table->string('subject', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('owner_phone', 30)->nullable();
            $table->unsignedBigInteger('creation_ts')->nullable();
            $table->boolean('admin_only_message')->nullable();
            $table->boolean('admin_only_settings')->nullable();
            $table->boolean('require_admin_approval')->nullable();
            $table->boolean('is_group_announcement')->nullable();
            $table->boolean('admin_only_add_member')->nullable();
            $table->dateTime('last_synced_at')->nullable();
            $table->unsignedInteger('last_member_count')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_groups');
    }
};
