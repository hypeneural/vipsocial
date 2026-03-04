<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('status_materias', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 100);
            $table->string('slug', 100)->unique();
            $table->string('icone', 50)->default('⚪');
            $table->string('cor', 30)->nullable();
            $table->unsignedInteger('ordem')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Seed default statuses
        $now = now();
        DB::table('status_materias')->insert([
            ['nome' => 'Pendente', 'slug' => 'pendente', 'icone' => '⚪', 'cor' => 'bg-zinc-400', 'ordem' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nome' => 'Em produção', 'slug' => 'em_producao', 'icone' => '🟡', 'cor' => 'bg-yellow-500', 'ordem' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nome' => 'Pronto', 'slug' => 'pronto', 'icone' => '🔵', 'cor' => 'bg-blue-500', 'ordem' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nome' => 'Aprovado', 'slug' => 'aprovado', 'icone' => '🟣', 'cor' => 'bg-violet-500', 'ordem' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['nome' => 'No ar', 'slug' => 'no_ar', 'icone' => '🟢', 'cor' => 'bg-green-500', 'ordem' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Change materias.status from enum to varchar so it accepts any slug
        DB::statement("ALTER TABLE materias MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pendente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE materias MODIFY COLUMN status ENUM('pendente','em_producao','pronto','aprovado','no_ar') NOT NULL DEFAULT 'pendente'");
        Schema::dropIfExists('status_materias');
    }
};
