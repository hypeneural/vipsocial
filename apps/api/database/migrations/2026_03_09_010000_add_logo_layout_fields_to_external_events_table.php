<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->string('logo_anchor', 32)
                ->default('bottom_center')
                ->after('logo_size_percent');
            $table->decimal('logo_offset_x_percent', 5, 2)
                ->default(3)
                ->after('logo_anchor');
            $table->decimal('logo_offset_y_percent', 5, 2)
                ->default(3)
                ->after('logo_offset_x_percent');
        });
    }

    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->dropColumn([
                'logo_anchor',
                'logo_offset_x_percent',
                'logo_offset_y_percent',
            ]);
        });
    }
};
