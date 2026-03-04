<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('external_events', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 200);
            $table->foreignId('category_id')->constrained('event_categories')->cascadeOnDelete();
            $table->foreignId('status_id')->constrained('event_statuses')->cascadeOnDelete();
            $table->text('briefing')->nullable();
            $table->dateTime('data_hora');
            $table->dateTime('data_hora_fim')->nullable();
            $table->string('local', 200);
            $table->string('endereco_completo', 300)->nullable();
            $table->string('contato_nome', 100)->nullable();
            $table->string('contato_whatsapp', 30)->nullable();
            $table->text('observacao_interna')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_events');
    }
};
