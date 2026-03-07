<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_schedule_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->string('schedule_type', 50);
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->date('specific_date')->nullable();
            $table->string('time_hhmm', 5);
            $table->string('rule_key', 120);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['alert_id', 'rule_key']);
            $table->index(['active', 'schedule_type', 'day_of_week', 'time_hhmm'], 'alert_schedule_rules_weekly_idx');
            $table->index(['active', 'schedule_type', 'specific_date', 'time_hhmm'], 'alert_schedule_rules_specific_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_schedule_rules');
    }
};
