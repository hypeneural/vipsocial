<?php

namespace App\Modules\Roteiros\Actions;

use App\Modules\Roteiros\Models\Roteiro;
use App\Modules\Roteiros\Models\Materia;
use Illuminate\Support\Facades\DB;

class CreateRoteiroAction
{
    public function execute(array $data, ?array $materias = null): Roteiro
    {
        return DB::transaction(function () use ($data, $materias) {
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $roteiro = Roteiro::create($data);

            if ($materias) {
                foreach ($materias as $index => $materia) {
                    $roteiro->materias()->create(array_merge($materia, [
                        'ordem' => $materia['ordem'] ?? $index,
                    ]));
                }
            }

            return $roteiro->load('materias.categoria', 'createdBy');
        });
    }
}
