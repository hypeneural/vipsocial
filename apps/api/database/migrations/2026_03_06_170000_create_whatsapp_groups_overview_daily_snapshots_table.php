<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_groups_overview_daily_snapshots', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->date('snapshot_date')->unique();
            $table->unsignedInteger('groups_count')->default(0);
            $table->unsignedInteger('total_memberships_current')->default(0);
            $table->unsignedInteger('unique_members_current')->default(0);
            $table->unsignedInteger('multi_group_members_current')->default(0);
            $table->decimal('multi_group_ratio', 8, 4)->default(0);
            $table->dateTime('captured_at');
            $table->timestamps();

            $table->index('captured_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_groups_overview_daily_snapshots');
    }
};
