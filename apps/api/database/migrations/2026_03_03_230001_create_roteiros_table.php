<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roteiros', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->date('data');
            $table->string('programa')->nullable();
            $table->enum('status', ['rascunho', 'em_producao', 'revisao', 'aprovado', 'publicado', 'arquivado'])
                ->default('rascunho');
            $table->text('observacoes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['data', 'status']);
            $table->index('programa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roteiros');
    }
};
