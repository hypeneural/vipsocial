<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news_items', function (Blueprint $table) {
            $table->uuid('public_token')->nullable()->unique()->after('id');
        });

        // Backfill existing rows
        DB::table('news_items')
            ->whereNull('public_token')
            ->orderBy('id')
            ->each(function ($item) {
                DB::table('news_items')
                    ->where('id', $item->id)
                    ->update(['public_token' => (string) Str::uuid()]);
            });
    }

    public function down(): void
    {
        Schema::table('news_items', function (Blueprint $table) {
            $table->dropColumn('public_token');
        });
    }
};
