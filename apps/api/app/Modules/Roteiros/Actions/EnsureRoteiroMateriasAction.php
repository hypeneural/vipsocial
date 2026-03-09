<?php

namespace App\Modules\Roteiros\Actions;

use App\Modules\Roteiros\Models\Roteiro;

class EnsureRoteiroMateriasAction
{
    public function execute(Roteiro $roteiro, int $targetCount = 12): Roteiro
    {
        $existingOrders = $roteiro->materias()
            ->pluck('ordem')
            ->filter(fn ($ordem) => is_numeric($ordem))
            ->map(fn ($ordem) => (int) $ordem)
            ->all();

        $existingOrders = array_flip($existingOrders);

        for ($ordem = 1; $ordem <= $targetCount; $ordem++) {
            if (isset($existingOrders[$ordem])) {
                continue;
            }

            $roteiro->materias()->create([
                'shortcut' => "F{$ordem}",
                'titulo' => '',
                'descricao' => '',
                'duracao' => '00:00:00',
                'status' => 'pendente',
                'creditos_gc' => '',
                'ordem' => $ordem,
            ]);
        }

        return $roteiro->load(['materias.categoria', 'createdBy', 'updatedBy']);
    }
}
