<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_events', function (Blueprint $table): void {
            $table->boolean('allow_pause_command')->default(true);
            $table->string('pause_command_keyword', 100)->default('Parar,Pausar');
        });
    }

    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table): void {
            $table->dropColumn([
                'allow_pause_command',
                'pause_command_keyword',
            ]);
        });
    }
};
