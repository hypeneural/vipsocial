<?php

namespace App\Modules\Roteiros\Actions;

use App\Modules\Roteiros\Models\Roteiro;
use Illuminate\Support\Facades\DB;

class DuplicateRoteiroAction
{
    public function execute(Roteiro $original): Roteiro
    {
        return DB::transaction(function () use ($original) {
            $clone = $original->replicate([
                'created_at',
                'updated_at',
                'deleted_at',
            ]);
            $clone->titulo = $original->titulo . ' (cópia)';
            $clone->status = 'rascunho';
            $clone->data = today();
            $clone->created_by = auth()->id();
            $clone->updated_by = auth()->id();
            $clone->save();

            foreach ($original->materias as $materia) {
                $cloneMateria = $materia->replicate(['created_at', 'updated_at']);
                $cloneMateria->roteiro_id = $clone->id;
                $cloneMateria->status = 'pendente';
                $cloneMateria->save();
            }

            return $clone->load('materias.categoria', 'createdBy');
        });
    }
}
