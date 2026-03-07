<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_dispatch_runs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('schedule_rule_id')->nullable()->constrained('alert_schedule_rules')->nullOnDelete();
            $table->foreignUlid('source_log_id')->nullable();
            $table->string('trigger_type', 50);
            $table->json('source_context')->nullable();
            $table->dateTime('scheduled_for');
            $table->string('idempotency_key', 191);
            $table->string('status', 50);
            $table->unsignedInteger('destinations_total')->default(0);
            $table->unsignedInteger('destinations_success')->default(0);
            $table->unsignedInteger('destinations_failed')->default(0);
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique('idempotency_key');
            $table->index(['alert_id', 'scheduled_for']);
            $table->index(['status', 'scheduled_for']);
            $table->index(['trigger_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_dispatch_runs');
    }
};
