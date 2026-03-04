<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Config\Models\Equipment;
use App\Modules\Externas\Models\EventCategory;
use App\Modules\Externas\Models\EventStatus;
use App\Modules\Externas\Models\ExternalEvent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ExternalEventSeeder extends Seeder
{
    public function run(): void
    {
        // ── Categories ─────────────────────────────
        $categories = [
            ['name' => 'Reportagem', 'slug' => 'reportagem', 'icon' => 'Newspaper', 'color' => 'bg-blue-500', 'sort_order' => 1],
            ['name' => 'Evento Social', 'slug' => 'evento-social', 'icon' => 'PartyPopper', 'color' => 'bg-purple-500', 'sort_order' => 2],
            ['name' => 'Cobertura Fotográfica', 'slug' => 'cobertura-fotografica', 'icon' => 'Camera', 'color' => 'bg-pink-500', 'sort_order' => 3],
            ['name' => 'Entrevista', 'slug' => 'entrevista', 'icon' => 'Mic', 'color' => 'bg-green-500', 'sort_order' => 4],
            ['name' => 'Outro', 'slug' => 'outro', 'icon' => 'FileText', 'color' => 'bg-gray-500', 'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            EventCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // ── Statuses ───────────────────────────────
        $statuses = [
            ['name' => 'Agendado', 'slug' => 'agendado', 'icon' => 'CalendarCheck', 'color' => 'bg-blue-500', 'sort_order' => 1],
            ['name' => 'Em Andamento', 'slug' => 'em-andamento', 'icon' => 'Clock', 'color' => 'bg-amber-500', 'sort_order' => 2],
            ['name' => 'Concluído', 'slug' => 'concluido', 'icon' => 'CheckCircle2', 'color' => 'bg-emerald-500', 'sort_order' => 3],
            ['name' => 'Cancelado', 'slug' => 'cancelado', 'icon' => 'XCircle', 'color' => 'bg-red-500', 'sort_order' => 4],
        ];

        foreach ($statuses as $st) {
            EventStatus::updateOrCreate(['slug' => $st['slug']], $st);
        }

        // ── Sample Events ──────────────────────────
        $agendado = EventStatus::where('slug', 'agendado')->first();
        $emAndamento = EventStatus::where('slug', 'em-andamento')->first();
        $concluido = EventStatus::where('slug', 'concluido')->first();
        $catEvento = EventCategory::where('slug', 'evento-social')->first();
        $catEntrevista = EventCategory::where('slug', 'entrevista')->first();
        $catReportagem = EventCategory::where('slug', 'reportagem')->first();
        $catFoto = EventCategory::where('slug', 'cobertura-fotografica')->first();

        if (!$agendado || !$catEvento) {
            return; // Safety check
        }

        // Event 1
        $ev1 = ExternalEvent::updateOrCreate(
            ['titulo' => 'Cobertura Casamento Silva & Santos'],
            [
                'category_id' => $catEvento->id,
                'status_id' => $agendado->id,
                'briefing' => 'Casamento na fazenda. Chegada às 14h para fotos dos preparativos. Cerimônia às 17h.',
                'data_hora' => Carbon::now()->addDays(5)->setTime(14, 0),
                'data_hora_fim' => Carbon::now()->addDays(5)->setTime(23, 0),
                'local' => 'Fazenda Santa Clara',
                'endereco_completo' => 'Estrada Municipal, Km 15, Zona Rural',
                'contato_nome' => 'Ana Silva',
                'contato_whatsapp' => '(11) 99999-1234',
                'observacao_interna' => 'Cliente VIP. Atenção especial aos detalhes.',
            ]
        );

        // Event 2
        $ev2 = ExternalEvent::updateOrCreate(
            ['titulo' => 'Entrevista Secretário de Saúde'],
            [
                'category_id' => $catEntrevista->id,
                'status_id' => $agendado->id,
                'briefing' => 'Entrevista sobre vacinação. Duração prevista: 30 minutos.',
                'data_hora' => Carbon::now()->addDays(2)->setTime(9, 0),
                'local' => 'Secretaria Municipal de Saúde',
                'endereco_completo' => 'Av. Central, 500 - Centro',
                'contato_nome' => 'Assessoria',
                'contato_whatsapp' => '(11) 98888-5678',
            ]
        );

        // Event 3
        $ev3 = ExternalEvent::updateOrCreate(
            ['titulo' => 'Reportagem Obras BR-101'],
            [
                'category_id' => $catReportagem->id,
                'status_id' => $emAndamento ? $emAndamento->id : $agendado->id,
                'briefing' => 'Acompanhar andamento das obras. Falar com engenheiro responsável.',
                'data_hora' => Carbon::now()->subDay()->setTime(8, 0),
                'local' => 'BR-101, Km 45',
            ]
        );

        // Event 4
        $ev4 = ExternalEvent::updateOrCreate(
            ['titulo' => 'Ensaio Fotográfico Loja ABC'],
            [
                'category_id' => $catFoto->id,
                'status_id' => $concluido ? $concluido->id : $agendado->id,
                'briefing' => 'Fotos de produtos para catálogo. Estúdio montado na loja.',
                'data_hora' => Carbon::now()->subDays(3)->setTime(10, 0),
                'data_hora_fim' => Carbon::now()->subDays(3)->setTime(16, 0),
                'local' => 'Loja ABC - Shopping Central',
                'contato_nome' => 'Roberto ABC',
                'contato_whatsapp' => '(11) 97777-4321',
            ]
        );

        // Sync collaborators (if users exist)
        $users = User::active()->limit(3)->get();
        if ($users->count() >= 2) {
            $ev1->collaborators()->syncWithoutDetaching([
                $users[0]->id => ['funcao' => 'Fotógrafa Principal'],
                $users[1]->id => ['funcao' => 'Cinegrafista'],
            ]);
            $ev2->collaborators()->syncWithoutDetaching([
                $users->count() >= 3 ? $users[2]->id : $users[0]->id => ['funcao' => 'Repórter'],
            ]);
            $ev3->collaborators()->syncWithoutDetaching([
                $users->count() >= 3 ? $users[2]->id : $users[0]->id => ['funcao' => 'Repórter'],
                $users[1]->id => ['funcao' => 'Cinegrafista'],
            ]);
        }

        // Sync equipment (if equipments exist)
        $equipments = Equipment::limit(3)->get();
        if ($equipments->count() >= 2) {
            $ev1->equipment()->syncWithoutDetaching([
                $equipments[0]->id => ['checked' => true],
                $equipments[1]->id => ['checked' => true],
            ]);
            if ($equipments->count() >= 3) {
                $ev1->equipment()->syncWithoutDetaching([
                    $equipments[2]->id => ['checked' => false],
                ]);
            }
        }
    }
}
