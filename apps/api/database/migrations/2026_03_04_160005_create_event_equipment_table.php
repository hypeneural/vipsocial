<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('external_events')->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained('equipments')->cascadeOnDelete();
            $table->boolean('checked')->default(false);
            $table->timestamps();

            $table->unique(['event_id', 'equipment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_equipment');
    }
};
