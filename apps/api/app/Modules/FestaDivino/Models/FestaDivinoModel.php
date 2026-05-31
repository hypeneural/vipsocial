<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Model;

abstract class FestaDivinoModel extends Model
{
    public function getConnectionName(): ?string
    {
        return config('festa-divino.read_connection', 'festa_divino_read');
    }
}
