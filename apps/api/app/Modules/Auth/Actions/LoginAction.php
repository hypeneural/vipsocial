<?php

namespace App\Modules\Auth\Actions;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

class LoginAction
{
    public function execute(string $email, string $password, ?string $deviceName = 'web'): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        if (!$user->active) {
            throw ValidationException::withMessages([
                'email' => ['Conta desativada. Contate o administrador.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);

        $accessToken = $user->createToken($deviceName)->plainTextToken;

        $refreshTokenPlain = bin2hex(random_bytes(32));
        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $refreshTokenPlain),
            'device_name' => $deviceName,
            'expires_at' => now()->addDays(30),
        ]);

        // Audit: log login
        $activity = activity('auth')
            ->causedBy($user)
            ->withProperties([
                'action' => 'login',
                'module' => 'auth',
                'resource_name' => $user->name,
                'device_name' => $deviceName,
            ])
            ->log("Login realizado por {$user->name}");

        if ($activity instanceof Activity) {
            $activity->update([
                'ip_address' => Context::get('ip'),
                'user_agent' => Context::get('user_agent'),
                'request_id' => Context::get('request_id'),
                'trace_id' => Context::get('trace_id'),
                'origin' => 'api',
            ]);
        }

        $user->load('preferences');

        return [
            'token' => $accessToken,
            'refresh_token' => $refreshTokenPlain,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
            'user' => $user,
        ];
    }
}

