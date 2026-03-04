<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar_url')->nullable()->after('phone');
            $table->string('role', 50)->default('journalist')->after('avatar_url');
            $table->string('department', 100)->nullable()->after('role');
            $table->boolean('active')->default(true)->after('department');
            $table->timestamp('last_login_at')->nullable()->after('active');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'avatar_url', 'role', 'department', 'active', 'last_login_at']);
            $table->dropSoftDeletes();
        });
    }
};
