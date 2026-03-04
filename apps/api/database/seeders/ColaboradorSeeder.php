<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ColaboradorSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('admin123');

        $colaboradores = [
            // ── Administradores ──────────────────────────
            [
                'name' => 'Admin VIP',
                'email' => 'admin@vipsocial.com.br',
                'phone' => '(11) 99900-0001',
                'department' => 'Produção',
                'role' => 'admin',
                'birth_date' => '1985-06-15',
                'admission_date' => '2018-01-10',
            ],
            [
                'name' => 'Ricardo Mendes',
                'email' => 'ricardo.mendes@vipsocial.com.br',
                'phone' => '(11) 99900-0002',
                'department' => 'Produção',
                'role' => 'admin',
                'birth_date' => '1980-11-22',
                'admission_date' => '2017-03-01',
            ],

            // ── Editores ─────────────────────────────────
            [
                'name' => 'Maria Santos',
                'email' => 'maria.santos@vipsocial.com.br',
                'phone' => '(11) 99900-1001',
                'department' => 'Redação',
                'role' => 'editor',
                'birth_date' => '1990-01-20',
                'admission_date' => '2019-03-15',
            ],
            [
                'name' => 'Felipe Araújo',
                'email' => 'felipe.araujo@vipsocial.com.br',
                'phone' => '(11) 99900-1002',
                'department' => 'Economia',
                'role' => 'editor',
                'birth_date' => '1987-09-03',
                'admission_date' => '2020-02-10',
            ],
            [
                'name' => 'Patrícia Lopes',
                'email' => 'patricia.lopes@vipsocial.com.br',
                'phone' => '(11) 99900-1003',
                'department' => 'Esportes',
                'role' => 'editor',
                'birth_date' => '1992-12-08',
                'admission_date' => '2021-06-01',
            ],

            // ── Jornalistas ──────────────────────────────
            [
                'name' => 'Carlos Oliveira',
                'email' => 'carlos.oliveira@vipsocial.com.br',
                'phone' => '(11) 99900-2001',
                'department' => 'Economia',
                'role' => 'journalist',
                'birth_date' => '1985-03-22',
                'admission_date' => '2021-01-10',
            ],
            [
                'name' => 'Juliana Costa',
                'email' => 'juliana.costa@vipsocial.com.br',
                'phone' => '(11) 99900-2002',
                'department' => 'Política',
                'role' => 'journalist',
                'birth_date' => '1993-07-14',
                'admission_date' => '2022-04-18',
            ],
            [
                'name' => 'André Silveira',
                'email' => 'andre.silveira@vipsocial.com.br',
                'phone' => '(11) 99900-2003',
                'department' => 'Esportes',
                'role' => 'journalist',
                'birth_date' => '1991-05-30',
                'admission_date' => '2023-01-09',
            ],
            [
                'name' => 'Beatriz Ferreira',
                'email' => 'beatriz.ferreira@vipsocial.com.br',
                'phone' => '(11) 99900-2004',
                'department' => 'Redação',
                'role' => 'journalist',
                'birth_date' => '1995-10-02',
                'admission_date' => '2023-08-14',
            ],
            [
                'name' => 'Lucas Martins',
                'email' => 'lucas.martins@vipsocial.com.br',
                'phone' => '(11) 99900-2005',
                'department' => 'Entretenimento',
                'role' => 'journalist',
                'birth_date' => '1994-04-11',
                'admission_date' => '2024-02-01',
            ],

            // ── Mídias ───────────────────────────────────
            [
                'name' => 'Ana Beatriz Souza',
                'email' => 'ana.souza@vipsocial.com.br',
                'phone' => '(11) 99900-3001',
                'department' => 'Tecnologia',
                'role' => 'media',
                'birth_date' => '1995-02-14',
                'admission_date' => '2022-06-01',
            ],
            [
                'name' => 'Thiago Nascimento',
                'email' => 'thiago.nascimento@vipsocial.com.br',
                'phone' => '(11) 99900-3002',
                'department' => 'Entretenimento',
                'role' => 'media',
                'birth_date' => '1996-08-25',
                'admission_date' => '2023-03-20',
            ],
            [
                'name' => 'Camila Rocha',
                'email' => 'camila.rocha@vipsocial.com.br',
                'phone' => '(11) 99900-3003',
                'department' => 'Redação',
                'role' => 'media',
                'birth_date' => '1998-06-17',
                'admission_date' => '2024-01-15',
            ],

            // ── Analistas ────────────────────────────────
            [
                'name' => 'Fernanda Lima',
                'email' => 'fernanda.lima@vipsocial.com.br',
                'phone' => '(11) 99900-4001',
                'department' => 'Tecnologia',
                'role' => 'analyst',
                'birth_date' => '1992-07-20',
                'admission_date' => '2020-03-01',
                'active' => false, // Inativa
            ],
            [
                'name' => 'Rodrigo Almeida',
                'email' => 'rodrigo.almeida@vipsocial.com.br',
                'phone' => '(11) 99900-4002',
                'department' => 'Economia',
                'role' => 'analyst',
                'birth_date' => '1990-12-05',
                'admission_date' => '2022-09-12',
            ],
        ];

        foreach ($colaboradores as $data) {
            $role = $data['role'];
            $active = $data['active'] ?? true;
            unset($data['role'], $data['active']);

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    ...$data,
                    'password' => $password,
                    'role' => $role,
                    'active' => $active,
                ]
            );

            $user->syncRoles([$role]);
            UserPreference::firstOrCreate(['user_id' => $user->id]);
        }

        $this->command->info('✅ ' . count($colaboradores) . ' colaboradores criados (senha: admin123)');
    }
}
