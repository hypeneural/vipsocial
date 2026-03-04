<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@vipsocial.com.br'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'phone' => '(11) 99999-0001',
                'role' => 'admin',
                'department' => 'Tecnologia',
                'active' => true,
            ]
        );
        $admin->assignRole('admin');
        UserPreference::firstOrCreate(['user_id' => $admin->id]);

        $editor = User::firstOrCreate(
            ['email' => 'editor@vipsocial.com.br'],
            [
                'name' => 'Editor Chefe',
                'password' => Hash::make('password'),
                'phone' => '(11) 99999-0002',
                'role' => 'editor',
                'department' => 'Editorial',
                'active' => true,
            ]
        );
        $editor->assignRole('editor');
        UserPreference::firstOrCreate(['user_id' => $editor->id]);

        $journalist = User::firstOrCreate(
            ['email' => 'jornalista@vipsocial.com.br'],
            [
                'name' => 'Jornalista',
                'password' => Hash::make('password'),
                'phone' => '(11) 99999-0003',
                'role' => 'journalist',
                'department' => 'Redação',
                'active' => true,
            ]
        );
        $journalist->assignRole('journalist');
        UserPreference::firstOrCreate(['user_id' => $journalist->id]);
    }
}
