<?php

namespace App\Modules\Users\Http\Controllers;

use App\Models\User;
use App\Models\UserPreference;
use App\Modules\Auth\Http\Resources\UserResource;
use App\Modules\Users\Http\Requests\CreateUserRequest;
use App\Modules\Users\Http\Requests\UpdateUserRequest;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class UserController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $users = QueryBuilder::for(User::class)
            ->allowedFilters([
                AllowedFilter::exact('role'),
                AllowedFilter::exact('department'),
                AllowedFilter::exact('active'),
                AllowedFilter::partial('search', 'name'),
            ])
            ->allowedSorts(['name', 'email', 'created_at', 'last_login_at'])
            ->allowedIncludes(['preferences'])
            ->defaultSort('-created_at')
            ->paginate($request->get('per_page', 15));

        return $this->jsonPaginated($users, UserResource::class);
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'phone' => $request->validated('phone'),
            'role' => $request->validated('role', 'journalist'),
            'department' => $request->validated('department'),
            'active' => true,
        ]);

        $user->assignRole($request->validated('role', 'journalist'));
        UserPreference::create(['user_id' => $user->id]);
        $user->load('preferences');

        return $this->jsonCreated(new UserResource($user));
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['preferences', 'roles.permissions'])->findOrFail($id);

        return $this->jsonSuccess(new UserResource($user));
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validated();
        unset($data['password']);

        if ($request->has('password') && $request->validated('password')) {
            $data['password'] = Hash::make($request->validated('password'));
        }

        $oldRole = $user->role;
        $user->update($data);

        if (isset($data['role']) && $data['role'] !== $oldRole) {
            $user->syncRoles([$data['role']]);
        }

        $user->load('preferences');

        return $this->jsonSuccess(new UserResource($user), 'Usuário atualizado');
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return $this->jsonDeleted('Usuário removido');
    }

    public function toggleActive(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['active' => !$user->active]);

        return $this->jsonSuccess(
            new UserResource($user),
            $user->active ? 'Usuário ativado' : 'Usuário desativado'
        );
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $prefs = UserPreference::firstOrCreate(['user_id' => $user->id]);

        $prefs->update($request->only([
            'theme',
            'language',
            'notifications_email',
            'notifications_push',
            'notifications_whatsapp',
            'sidebar_collapsed',
            'dashboard_widgets',
        ]));

        return $this->jsonSuccess($prefs, 'Preferências atualizadas');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120', 'dimensions:min_width=256,min_height=256'],
        ]);

        $user = $request->user();

        try {
            $user->clearMediaCollection('avatar');

            $user
                ->addMedia($validated['avatar'])
                ->usingName("avatar-{$user->id}")
                ->toMediaCollection('avatar');

            $avatarUrl = $user->getFirstMediaUrl('avatar', 'md') ?: $user->getFirstMediaUrl('avatar');
            $avatarThumbUrl = $user->getFirstMediaUrl('avatar', 'thumb') ?: $avatarUrl;

            $user->forceFill([
                'avatar_url' => $avatarUrl ?: null,
            ])->saveQuietly();

            return $this->jsonSuccess([
                'avatar_url' => $avatarUrl,
                'avatar_thumb_url' => $avatarThumbUrl,
                'avatar_md_url' => $avatarUrl,
            ], 'Avatar atualizado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao enviar avatar', 'USER_AVATAR_UPLOAD_FAILED', 500);
        }
    }
}
