<?php

namespace App\Modules\Auth\Actions;

use App\Models\RefreshToken;
use Illuminate\Validation\ValidationException;

class RefreshTokenAction
{
    public function execute(string $refreshTokenPlain): array
    {
        $hash = hash('sha256', $refreshTokenPlain);

        $refreshToken = RefreshToken::where('token_hash', $hash)->first();

        if (!$refreshToken || !$refreshToken->isValid()) {
            throw ValidationException::withMessages([
                'refresh_token' => ['Token de atualização inválido ou expirado.'],
            ]);
        }

        $user = $refreshToken->user;

        if (!$user->active) {
            $refreshToken->revoke();
            throw ValidationException::withMessages([
                'refresh_token' => ['Conta desativada.'],
            ]);
        }

        // Revoke old refresh token (rotation)
        $refreshToken->revoke();

        // Revoke current access tokens for this device
        $user->tokens()
            ->where('name', $refreshToken->device_name)
            ->delete();

        // Issue new pair
        $newAccessToken = $user->createToken($refreshToken->device_name ?? 'web')->plainTextToken;

        $newRefreshPlain = bin2hex(random_bytes(32));
        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $newRefreshPlain),
            'device_name' => $refreshToken->device_name,
            'expires_at' => now()->addDays(30),
        ]);

        return [
            'token' => $newAccessToken,
            'refresh_token' => $newRefreshPlain,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
        ];
    }
}
