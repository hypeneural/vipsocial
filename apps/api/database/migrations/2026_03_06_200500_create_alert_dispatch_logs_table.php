<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_dispatch_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('dispatch_run_id')->constrained('alert_dispatch_runs')->cascadeOnDelete();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('destination_id')->constrained('alert_destinations')->cascadeOnDelete();
            $table->string('alert_title_snapshot');
            $table->string('destination_name_snapshot');
            $table->string('target_kind', 50);
            $table->string('target_value', 64);
            $table->text('message_snapshot');
            $table->string('status', 50);
            $table->string('provider', 50)->default('zapi');
            $table->string('provider_zaap_id', 191)->nullable();
            $table->string('provider_message_id', 191)->nullable();
            $table->string('provider_response_id', 191)->nullable();
            $table->integer('provider_status_code')->nullable();
            $table->json('provider_response')->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['dispatch_run_id', 'destination_id']);
            $table->index(['alert_id', 'sent_at']);
            $table->index(['destination_id', 'sent_at']);
            $table->index(['status', 'sent_at']);
            $table->index(['dispatch_run_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_dispatch_logs');
    }
};
