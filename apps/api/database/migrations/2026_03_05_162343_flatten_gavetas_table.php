<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add new columns to gavetas
        Schema::table('gavetas', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_checked')->default(false)->after('active');
        });

        // Rename nome to titulo
        Schema::table('gavetas', function (Blueprint $table) {
            $table->renameColumn('nome', 'titulo');
        });

        // 2. Migrate existing records:
        // For existing gavetas that have NO noticias, just keep them and set user_id = 2
        DB::table('gavetas')->update(['user_id' => 2]);

        // For existing gavetas WITH noticias, we need to create new gavetas lines for each additional noticia
        // We'll migrate the first noticia into the existing gaveta, and create new gavetas for the rest.
        $noticias = DB::table('noticias_gaveta')->orderBy('gaveta_id')->orderBy('ordem')->get();
        $gavetasMigradas = [];

        foreach ($noticias as $noticia) {
            if (!in_array($noticia->gaveta_id, $gavetasMigradas)) {
                // First noticia updates the parent gaveta
                DB::table('gavetas')
                    ->where('id', $noticia->gaveta_id)
                    ->update([
                        'titulo' => $noticia->titulo,
                        'descricao' => $noticia->conteudo, // Use conteudo as descricao
                        'is_checked' => $noticia->is_checked,
                        'created_at' => $noticia->created_at,
                        'updated_at' => $noticia->updated_at,
                    ]);
                $gavetasMigradas[] = $noticia->gaveta_id;
            } else {
                // Subsequent noticias become their own gaveta
                DB::table('gavetas')->insert([
                    'titulo' => $noticia->titulo,
                    'descricao' => $noticia->conteudo,
                    'is_checked' => $noticia->is_checked,
                    'active' => true,
                    'user_id' => 2,
                    'created_at' => $noticia->created_at,
                    'updated_at' => $noticia->updated_at,
                ]);
            }
        }

        // 3. Drop old table
        Schema::dropIfExists('noticias_gaveta');

        // Make user_id non-nullable if desired, but nullable is safer for legacy. 
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('noticias_gaveta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gaveta_id')->constrained('gavetas')->onDelete('cascade');
            $table->string('titulo');
            $table->text('conteudo')->nullable();
            $table->unsignedInteger('ordem')->default(0);
            $table->boolean('is_checked')->default(false);
            $table->timestamps();

            $table->index(['gaveta_id', 'ordem']);
        });

        Schema::table('gavetas', function (Blueprint $table) {
            $table->renameColumn('titulo', 'nome');
        });

        Schema::table('gavetas', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            $table->dropColumn('is_checked');
        });
    }
};
