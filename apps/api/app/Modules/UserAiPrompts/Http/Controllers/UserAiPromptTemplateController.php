<?php

namespace App\Modules\UserAiPrompts\Http\Controllers;

use App\Modules\UserAiPrompts\Enums\PromptProviderTarget;
use App\Modules\UserAiPrompts\Http\Requests\CreateStarterUserAiPromptRequest;
use App\Modules\UserAiPrompts\Http\Requests\ReorderUserAiPromptsRequest;
use App\Modules\UserAiPrompts\Http\Requests\SetFavoriteUserAiPromptRequest;
use App\Modules\UserAiPrompts\Http\Requests\StoreUserAiPromptRequest;
use App\Modules\UserAiPrompts\Http\Requests\TrackUserAiPromptUseRequest;
use App\Modules\UserAiPrompts\Http\Requests\UpdateUserAiPromptRequest;
use App\Modules\UserAiPrompts\Http\Resources\UserAiPromptTemplateResource;
use App\Modules\UserAiPrompts\Models\UserAiPromptTemplate;
use App\Modules\UserAiPrompts\Support\PromptTemplateCatalog;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAiPromptTemplateController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('ai_prompts.view'), 403);

        $templates = UserAiPromptTemplate::query()
            ->ownedBy($request->user()->id)
            ->ordered()
            ->paginate((int) $request->input('per_page', 50))
            ->withQueryString();

        return $this->jsonPaginated($templates, UserAiPromptTemplateResource::class);
    }

    public function store(StoreUserAiPromptRequest $request): JsonResponse
    {
        $user = $request->user();

        $template = UserAiPromptTemplate::create([
            'user_id' => $user->id,
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'content' => $request->validated('content'),
            'provider_target' => $request->validated('provider_target', PromptProviderTarget::Generic->value),
            'sort_order' => $this->nextSortOrder($user->id),
        ]);

        return $this->jsonCreated(new UserAiPromptTemplateResource($template));
    }

    public function starter(CreateStarterUserAiPromptRequest $request): JsonResponse
    {
        $user = $request->user();

        $hasActiveTemplates = UserAiPromptTemplate::query()
            ->ownedBy($user->id)
            ->exists();

        if ($hasActiveTemplates) {
            return $this->jsonError(
                'Starter template so pode ser criado quando o usuario nao possui templates ativos.',
                'AI_PROMPTS_STARTER_ALREADY_EXISTS',
                409,
            );
        }

        $starter = PromptTemplateCatalog::starterTemplate();

        $template = DB::transaction(function () use ($user, $starter) {
            UserAiPromptTemplate::query()
                ->ownedBy($user->id)
                ->update(['is_favorite' => false]);

            return UserAiPromptTemplate::create([
                'user_id' => $user->id,
                'name' => $starter['name'],
                'description' => $starter['description'],
                'content' => $starter['content'],
                'provider_target' => $starter['provider_target']->value,
                'is_favorite' => true,
                'sort_order' => $this->nextSortOrder($user->id),
                'usage_count' => 0,
                'last_used_at' => null,
            ]);
        });

        return $this->jsonCreated(new UserAiPromptTemplateResource($template));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()?->can('ai_prompts.view'), 403);

        $template = $this->findOwnedTemplate($request->user()->id, $id);

        return $this->jsonSuccess(new UserAiPromptTemplateResource($template));
    }

    public function update(UpdateUserAiPromptRequest $request, int $id): JsonResponse
    {
        $template = $this->findOwnedTemplate($request->user()->id, $id);

        $template->fill($request->validated());
        $template->save();

        return $this->jsonSuccess(
            new UserAiPromptTemplateResource($template->fresh()),
            'Template atualizado.',
        );
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()?->can('ai_prompts.delete'), 403);

        $template = $this->findOwnedTemplate($request->user()->id, $id);
        $template->forceFill(['is_favorite' => false])->save();
        $template->delete();

        return $this->jsonDeleted('Template arquivado.');
    }

    public function favorite(SetFavoriteUserAiPromptRequest $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $this->findOwnedTemplate($userId, $id);

        DB::transaction(function () use ($userId, $id) {
            UserAiPromptTemplate::query()
                ->ownedBy($userId)
                ->update(['is_favorite' => false]);

            UserAiPromptTemplate::query()
                ->ownedBy($userId)
                ->whereKey($id)
                ->update(['is_favorite' => true]);
        });

        return $this->jsonSuccess(
            new UserAiPromptTemplateResource($this->findOwnedTemplate($userId, $id)),
            'Template favorito atualizado.',
        );
    }

    public function reorder(ReorderUserAiPromptsRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $orderedIds = collect($request->validated('items'))
            ->map(fn (int $id): int => $id)
            ->values();

        $templates = UserAiPromptTemplate::query()
            ->ownedBy($userId)
            ->ordered()
            ->get(['id']);

        $ownedIds = $templates->pluck('id');

        abort_if(
            $orderedIds->diff($ownedIds)->isNotEmpty(),
            404,
            'Um ou mais templates nao pertencem ao usuario autenticado.'
        );

        $finalIds = $orderedIds
            ->merge($ownedIds->diff($orderedIds))
            ->values();

        DB::transaction(function () use ($userId, $finalIds) {
            foreach ($finalIds as $index => $templateId) {
                UserAiPromptTemplate::query()
                    ->ownedBy($userId)
                    ->whereKey($templateId)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        $orderedTemplates = UserAiPromptTemplate::query()
            ->ownedBy($userId)
            ->ordered()
            ->get();

        return $this->jsonSuccess(
            UserAiPromptTemplateResource::collection($orderedTemplates)->resolve($request),
            'Ordenacao atualizada.',
        );
    }

    public function variables(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('ai_prompts.view'), 403);

        return $this->jsonSuccess(PromptTemplateCatalog::variables());
    }

    public function trackUse(TrackUserAiPromptUseRequest $request, int $id): JsonResponse
    {
        $template = $this->findOwnedTemplate($request->user()->id, $id);

        $template->increment('usage_count');
        $template->forceFill(['last_used_at' => now()])->save();
        $template = $template->fresh();

        return $this->jsonSuccess([
            'id' => $template->id,
            'usage_count' => (int) $template->usage_count,
            'last_used_at' => $template->last_used_at,
        ], 'Uso registrado.');
    }

    private function findOwnedTemplate(int $userId, int $id): UserAiPromptTemplate
    {
        return UserAiPromptTemplate::query()
            ->ownedBy($userId)
            ->findOrFail($id);
    }

    private function nextSortOrder(int $userId): int
    {
        return (int) UserAiPromptTemplate::query()
            ->ownedBy($userId)
            ->max('sort_order') + 1;
    }
}
