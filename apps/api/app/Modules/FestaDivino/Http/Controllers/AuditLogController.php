<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Resources\FestaDivinoAuditLogResource;
use App\Modules\FestaDivino\Models\FestaDivinoAuditLog;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AuditLogController extends BaseController
{
    use AuthorizesFestaDivino;

    public function __invoke(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request, 'festa-divino.audit.view');

        $logs = QueryBuilder::for(FestaDivinoAuditLog::class)
            ->allowedFilters([
                AllowedFilter::exact('action'),
                AllowedFilter::exact('entity_type'),
                AllowedFilter::exact('entity_id'),
                AllowedFilter::exact('user_id'),
                AllowedFilter::callback('created_from', fn ($query, $value) => $query->whereDate('created_at', '>=', $value)),
                AllowedFilter::callback('created_to', fn ($query, $value) => $query->whereDate('created_at', '<=', $value)),
            ])
            ->allowedIncludes(['user'])
            ->allowedSorts(['created_at', 'action', 'entity_type', 'user_id'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($logs, FestaDivinoAuditLogResource::class);
    }
}
