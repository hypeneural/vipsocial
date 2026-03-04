<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table(config('activitylog.table_name', 'activity_log'), function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('properties');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->char('request_id', 36)->nullable()->after('user_agent');
            $table->char('trace_id', 36)->nullable()->after('request_id');
            $table->string('origin', 20)->default('api')->after('trace_id');

            $table->index('ip_address');
            $table->index('request_id');
            $table->index('origin');
        });
    }

    public function down(): void
    {
        Schema::table(config('activitylog.table_name', 'activity_log'), function (Blueprint $table) {
            $table->dropIndex(['ip_address']);
            $table->dropIndex(['request_id']);
            $table->dropIndex(['origin']);
            $table->dropColumn(['ip_address', 'user_agent', 'request_id', 'trace_id', 'origin']);
        });
    }
};
