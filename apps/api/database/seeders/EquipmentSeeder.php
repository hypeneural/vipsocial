<?php

namespace Database\Seeders;

use App\Modules\Config\Models\EquipmentCategory;
use App\Modules\Config\Models\EquipmentStatus;
use App\Modules\Config\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        // ── Categories ──────────────────────────────
        $categories = [
            ['name' => 'Câmera', 'slug' => 'camera', 'icon' => 'Camera', 'sort_order' => 1],
            ['name' => 'Lente', 'slug' => 'lente', 'icon' => 'Aperture', 'sort_order' => 2],
            ['name' => 'Microfone', 'slug' => 'microfone', 'icon' => 'Mic', 'sort_order' => 3],
            ['name' => 'Celular', 'slug' => 'celular', 'icon' => 'Smartphone', 'sort_order' => 4],
            ['name' => 'Adaptador', 'slug' => 'adaptador', 'icon' => 'Plug', 'sort_order' => 5],
            ['name' => 'Tripé', 'slug' => 'tripe', 'icon' => 'Triangle', 'sort_order' => 6],
            ['name' => 'Iluminação', 'slug' => 'iluminacao', 'icon' => 'Lightbulb', 'sort_order' => 7],
            ['name' => 'Outro', 'slug' => 'outro', 'icon' => 'Package', 'sort_order' => 99],
        ];

        foreach ($categories as $cat) {
            EquipmentCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // ── Statuses ────────────────────────────────
        $statuses = [
            ['name' => 'Disponível', 'slug' => 'disponivel', 'icon' => 'CheckCircle2', 'color' => 'bg-emerald-500', 'sort_order' => 1],
            ['name' => 'Em Uso', 'slug' => 'em-uso', 'icon' => 'Clock', 'color' => 'bg-amber-500', 'sort_order' => 2],
            ['name' => 'Manutenção', 'slug' => 'manutencao', 'icon' => 'Wrench', 'color' => 'bg-red-500', 'sort_order' => 3],
        ];

        foreach ($statuses as $st) {
            EquipmentStatus::updateOrCreate(['slug' => $st['slug']], $st);
        }

        // ── Sample Equipment ────────────────────────
        $cameraId = EquipmentCategory::where('slug', 'camera')->first()->id;
        $lenteId = EquipmentCategory::where('slug', 'lente')->first()->id;
        $micId = EquipmentCategory::where('slug', 'microfone')->first()->id;
        $celId = EquipmentCategory::where('slug', 'celular')->first()->id;
        $adpId = EquipmentCategory::where('slug', 'adaptador')->first()->id;

        $disponivel = EquipmentStatus::where('slug', 'disponivel')->first()->id;
        $emUso = EquipmentStatus::where('slug', 'em-uso')->first()->id;
        $manutencao = EquipmentStatus::where('slug', 'manutencao')->first()->id;

        $equipments = [
            ['nome' => 'Canon EOS R5', 'category_id' => $cameraId, 'marca' => 'Canon', 'modelo' => 'EOS R5', 'patrimonio' => 'CAM-001', 'status_id' => $disponivel],
            ['nome' => 'Sony A7 IV', 'category_id' => $cameraId, 'marca' => 'Sony', 'modelo' => 'A7 IV', 'patrimonio' => 'CAM-002', 'status_id' => $emUso],
            ['nome' => 'Canon RF 50mm', 'category_id' => $lenteId, 'marca' => 'Canon', 'modelo' => 'RF 50mm f/1.8', 'patrimonio' => 'LNT-001', 'status_id' => $disponivel],
            ['nome' => 'Rode VideoMic Pro', 'category_id' => $micId, 'marca' => 'Rode', 'modelo' => 'VideoMic Pro+', 'patrimonio' => 'MIC-001', 'status_id' => $disponivel],
            ['nome' => 'iPhone 15 Pro', 'category_id' => $celId, 'marca' => 'Apple', 'modelo' => 'iPhone 15 Pro', 'patrimonio' => 'CEL-001', 'status_id' => $disponivel],
            ['nome' => 'Elgato Cam Link', 'category_id' => $adpId, 'marca' => 'Elgato', 'modelo' => 'Cam Link 4K', 'patrimonio' => 'ADP-001', 'status_id' => $manutencao, 'observacoes' => 'Aguardando reparo'],
        ];

        foreach ($equipments as $eq) {
            Equipment::updateOrCreate(['patrimonio' => $eq['patrimonio']], $eq);
        }
    }
}
