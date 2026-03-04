<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gavetas', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('noticias_gaveta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gaveta_id')->constrained()->onDelete('cascade');
            $table->string('titulo');
            $table->text('conteudo')->nullable();
            $table->unsignedInteger('ordem')->default(0);
            $table->boolean('is_checked')->default(false);
            $table->timestamps();

            $table->index(['gaveta_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('noticias_gaveta');
        Schema::dropIfExists('gavetas');
    }
};
