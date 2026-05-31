<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Resources\EdicaoFestaResource;
use App\Modules\FestaDivino\Models\EdicaoFesta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseController
{
    use AuthorizesFestaDivino;

    public function __invoke(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $connection = config('festa-divino.read_connection', 'festa_divino_read');
        $db = DB::connection($connection);

        $counts = [
            'edicoes' => $db->table('Edicao_Festa')->count(),
            'programacao_eventos' => $db->table('Programacao_Eventos')->count(),
            'categorias_evento' => $db->table('Categorias_Evento')->count(),
            'locais' => $db->table('Locais_Festa')->count(),
            'atracoes' => $db->table('Atracoes')->count(),
            'evento_atracoes' => $db->table('Evento_Atracao')->count(),
            'dias_festa' => $db->table('dias_festa_evento')->count(),
            'cardapio_categorias' => $db->table('categoria')->count(),
            'produtos' => $db->table('produto')->count(),
            'noticias' => $this->safeCount($db, 'noticias_festa'),
            'videos' => $this->safeCount($db, 'youtube_videos'),
            'shorts' => $this->safeCount($db, 'shorts_videos'),
            'textos' => $this->safeCount($db, 'divino_textos'),
            'faq_categorias' => $db->table('faq_category')->count(),
            'faq_items' => $db->table('faq_item')->count(),
            'brinquedos' => $db->table('brinquedos')->count(),
        ];

        $eventsWithoutAttractions = $db->table('Programacao_Eventos')
            ->leftJoin('Evento_Atracao', 'Programacao_Eventos.id_evento', '=', 'Evento_Atracao.id_evento')
            ->whereNull('Evento_Atracao.id_evento_atracao')
            ->distinct()
            ->count('Programacao_Eventos.id_evento');

        $activeEdition = EdicaoFesta::query()
            ->orderByDesc('ano_festa')
            ->first();

        return $this->jsonSuccess([
            'mode' => config('festa-divino.write_enabled') ? 'write_enabled' : 'read_only',
            'active_edition' => $activeEdition ? new EdicaoFestaResource($activeEdition) : null,
            'counts' => $counts,
            'alerts' => [
                'events_without_attractions' => [
                    'severity' => 'info',
                    'count' => $eventsWithoutAttractions,
                ],
                'dias_festa_empty' => [
                    'severity' => $counts['dias_festa'] === 0 ? 'warning' : 'ok',
                    'count' => $counts['dias_festa'],
                ],
            ],
        ]);
    }

    private function safeCount($connection, string $table): int
    {
        try {
            return $connection->table($table)->count();
        } catch (\Throwable) {
            return 0;
        }
    }
}
