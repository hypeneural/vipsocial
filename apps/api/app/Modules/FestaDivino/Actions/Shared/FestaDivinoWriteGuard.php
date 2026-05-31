<?php

namespace App\Modules\FestaDivino\Actions\Shared;

use Symfony\Component\HttpKernel\Exception\HttpException;

final class FestaDivinoWriteGuard
{
    public static function assertCanWrite(): void
    {
        if (! config('festa-divino.write_enabled', false)) {
            throw new HttpException(423, 'Festa do Divino esta em modo somente leitura.');
        }
    }
}
