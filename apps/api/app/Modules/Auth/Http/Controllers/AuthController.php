<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\LoginAction;
use App\Modules\Auth\Actions\RefreshTokenAction;
use App\Modules\Auth\Http\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RefreshTokenRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Requests\ResetPasswordRequest;
use App\Modules\Auth\Http\Requests\UpdatePasswordRequest;
use App\Modules\Auth\Http\Resources\AuthResource;
use App\Modules\Auth\Http\Resources\UserResource;
use App\Models\User;
use App\Models\UserPreference;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

class AuthController extends BaseController
{
    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        $result = $action->execute(
            $request->validated('email'),
            $request->validated('password'),
            $request->validated('device_name', 'web'),
        );

        return $this->jsonSuccess(
            new AuthResource($result),
            'Login realizado com sucesso'
        );
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'phone' => $request->validated('phone'),
            'department' => $request->validated('department'),
        ]);

        $user->assignRole('journalist');
        UserPreference::create(['user_id' => $user->id]);

        $token = $user->createToken('web')->plainTextToken;
        $user->load('preferences');

        // Audit: log register
        $this->logAuthActivity($user, 'create', "Novo registro: {$user->name}");

        return $this->jsonCreated(new AuthResource([
            'token' => $token,
            'refresh_token' => null,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
            'user' => $user,
        ]), 'Registro realizado com sucesso');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['preferences', 'roles.permissions']);
        return $this->jsonSuccess(new UserResource($user));
    }

    public function refresh(RefreshTokenRequest $request, RefreshTokenAction $action): JsonResponse
    {
        $result = $action->execute($request->validated('refresh_token'));
        return $this->jsonSuccess($result, 'Token atualizado');
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Audit: log logout (before revoking token)
        $this->logAuthActivity($user, 'logout', "Logout realizado por {$user->name}");

        $user->currentAccessToken()->delete();
        $user->refreshTokens()
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        return $this->jsonSuccess(null, 'Logout realizado');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return success to prevent email enumeration
        return $this->jsonSuccess(null, 'Se o email existir, enviaremos um link de recuperação.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all tokens on password reset
                $user->tokens()->delete();
                $user->refreshTokens()
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => now()]);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->jsonSuccess(null, 'Senha redefinida com sucesso');
        }

        return $this->jsonError('Token inválido ou expirado', 'VALIDATION_ERROR', 422, [
            'token' => ['Token inválido ou expirado.'],
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->validated('current_password'), $user->password)) {
            return $this->jsonError('Senha atual incorreta', 'VALIDATION_ERROR', 422, [
                'current_password' => ['Senha atual incorreta.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->validated('new_password')),
        ]);

        // Audit: log password change
        $this->logAuthActivity($user, 'update', "Alterou senha: {$user->name}");

        return $this->jsonSuccess(null, 'Senha atualizada com sucesso');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'department' => 'nullable|string|max:100',
        ]);

        $user->update($validated);

        // Audit
        $this->logAuthActivity($user, 'update', "Perfil atualizado: {$user->name}");

        $user->load(['preferences', 'roles.permissions']);

        return $this->jsonSuccess(new UserResource($user), 'Perfil atualizado com sucesso');
    }

    // ── Private Helpers ──────────────────────────────────

    private function logAuthActivity($user, string $action, string $description): void
    {
        $activity = activity('auth')
            ->causedBy($user)
            ->withProperties([
                'action' => $action,
                'module' => 'auth',
                'resource_name' => $user->name,
            ])
            ->log($description);

        if ($activity instanceof Activity) {
            $activity->update([
                'ip_address' => Context::get('ip'),
                'user_agent' => Context::get('user_agent'),
                'request_id' => Context::get('request_id'),
                'trace_id' => Context::get('trace_id'),
                'origin' => 'api',
            ]);
        }
    }
}

