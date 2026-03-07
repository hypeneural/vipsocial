<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_destination_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('destination_id')->constrained('alert_destinations')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['alert_id', 'destination_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_destination_links');
    }
};
