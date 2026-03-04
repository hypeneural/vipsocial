<?php

namespace App\Modules\Roteiros\Actions;

use App\Modules\Roteiros\Models\Materia;
use Illuminate\Support\Facades\DB;

class ReorderMateriasAction
{
    public function execute(array $items): void
    {
        DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                $materia = Materia::find($item['id']);
                if (!$materia)
                    continue;

                $update = ['ordem' => $item['ordem']];

                if (isset($item['shortcut'])) {
                    $update['shortcut'] = $item['shortcut'];
                }

                $materia->update($update);
            }
        });
    }
}
