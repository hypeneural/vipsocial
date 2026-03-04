<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->onDelete('cascade');
            $table->string('theme', 20)->default('system');
            $table->string('language', 5)->default('pt-BR');
            $table->boolean('notifications_email')->default(true);
            $table->boolean('notifications_push')->default(true);
            $table->boolean('notifications_whatsapp')->default(false);
            $table->boolean('sidebar_collapsed')->default(false);
            $table->json('dashboard_widgets')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
