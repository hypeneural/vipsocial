<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('materias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roteiro_id')->constrained()->onDelete('cascade');
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->string('shortcut', 10)->nullable()->comment('Tag curta: VT, AO, NOTA');
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->string('duracao', 10)->nullable()->comment('Formato: mm:ss');
            $table->enum('status', ['pendente', 'em_producao', 'pronto', 'aprovado', 'no_ar'])
                ->default('pendente');
            $table->string('creditos_gc')->nullable()->comment('Créditos lower third');
            $table->unsignedInteger('ordem')->default(0);
            $table->timestamps();

            $table->index(['roteiro_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materias');
    }
};
