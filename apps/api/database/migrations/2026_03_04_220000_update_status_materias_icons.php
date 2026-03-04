<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Update existing status_materias: emojis → Lucide icon names, bg-* → text-* colors
        $updates = [
            'pendente' => ['icone' => 'circle', 'cor' => 'text-zinc-400'],
            'em_producao' => ['icone' => 'loader', 'cor' => 'text-yellow-500'],
            'pronto' => ['icone' => 'check-circle-2', 'cor' => 'text-blue-500'],
            'aprovado' => ['icone' => 'shield-check', 'cor' => 'text-violet-500'],
            'no_ar' => ['icone' => 'radio', 'cor' => 'text-green-500'],
        ];

        foreach ($updates as $slug => $data) {
            DB::table('status_materias')
                ->where('slug', $slug)
                ->update($data);
        }
    }

    public function down(): void
    {
        $rollbacks = [
            'pendente' => ['icone' => '⚪', 'cor' => 'bg-zinc-400'],
            'em_producao' => ['icone' => '🟡', 'cor' => 'bg-yellow-500'],
            'pronto' => ['icone' => '🔵', 'cor' => 'bg-blue-500'],
            'aprovado' => ['icone' => '🟣', 'cor' => 'bg-violet-500'],
            'no_ar' => ['icone' => '🟢', 'cor' => 'bg-green-500'],
        ];

        foreach ($rollbacks as $slug => $data) {
            DB::table('status_materias')
                ->where('slug', $slug)
                ->update($data);
        }
    }
};
