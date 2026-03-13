<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Controllers;

use App\Modules\NewsRadarWhatsApp\Actions\AddWhatsAppNewsBundleItemsAction;
use App\Modules\NewsRadarWhatsApp\Actions\CreateWhatsAppNewsBundleAction;
use App\Modules\NewsRadarWhatsApp\Actions\DuplicateWhatsAppNewsBundleAction;
use App\Modules\NewsRadarWhatsApp\Actions\EnsureWhatsAppNewsGroupAccessAction;
use App\Modules\NewsRadarWhatsApp\Actions\ManageWhatsAppNewsBundleStateAction;
use App\Modules\NewsRadarWhatsApp\Actions\PromoteWhatsAppBundleToNewsItemAction;
use App\Modules\NewsRadarWhatsApp\Actions\RemoveWhatsAppNewsBundleItemAction;
use App\Modules\NewsRadarWhatsApp\Actions\UpdateWhatsAppNewsBundleAction;
use App\Modules\NewsRadarWhatsApp\Http\Requests\AddWhatsAppNewsBundleItemsRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\ArchiveWhatsAppNewsBundleRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\PromoteWhatsAppNewsBundleRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\RemoveWhatsAppNewsBundleItemRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\ReopenWhatsAppNewsBundleRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\SetWhatsAppNewsBundleStarRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\StoreWhatsAppNewsBundleRequest;
use App\Modules\NewsRadarWhatsApp\Http\Requests\UpdateWhatsAppNewsBundleRequest;
use App\Modules\NewsRadarWhatsApp\Http\Resources\WhatsAppNewsBundleResource;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class WhatsAppNewsBundlesController extends BaseController
{
    public function __construct(
        private readonly CreateWhatsAppNewsBundleAction $createBundle,
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
        private readonly AddWhatsAppNewsBundleItemsAction $addItems,
        private readonly RemoveWhatsAppNewsBundleItemAction $removeItem,
        private readonly ManageWhatsAppNewsBundleStateAction $manageState,
        private readonly DuplicateWhatsAppNewsBundleAction $duplicateBundle,
        private readonly PromoteWhatsAppBundleToNewsItemAction $promoteBundle,
        private readonly EnsureWhatsAppNewsGroupAccessAction $ensureAccess,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $groupIds = UserWhatsAppNewsGroup::query()
            ->where('user_id', $request->user()->getKey())
            ->where('is_active', true)
            ->pluck('whatsapp_group_fk');

        $query = WhatsAppNewsBundle::query()
            ->with(['group', 'items.event'])
            ->whereIn('whatsapp_group_fk', $groupIds)
            ->orderByDesc('updated_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($groupFk = $request->input('group_fk')) {
            $query->where('whatsapp_group_fk', $groupFk);
        }

        return $this->jsonSuccess(
            WhatsAppNewsBundleResource::collection($query->get()),
            ''
        );
    }

    public function store(StoreWhatsAppNewsBundleRequest $request): JsonResponse
    {
        try {
            $bundle = $this->createBundle->execute(
                $request->user(),
                $request->validated('group_fk'),
                $request->validated('event_ids'),
                [
                    'title' => $request->validated('title'),
                    'creation_mode' => $request->validated('creation_mode'),
                ]
            );

            return $this->jsonCreated(
                new WhatsAppNewsBundleResource($bundle->load(['group', 'items.event'])),
                'Agrupamento editorial criado com sucesso'
            );
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_CREATE_FAILED', 422);
        } catch (Throwable $exception) {
            report($exception);

            return $this->jsonError('Falha ao criar o agrupamento editorial', 'WHATSAPP_BUNDLE_CREATE_FAILED', 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        return $this->jsonSuccess(
            new WhatsAppNewsBundleResource($bundle->load(['group', 'items.event.media'])),
            ''
        );
    }

    public function update(UpdateWhatsAppNewsBundleRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $bundle = $this->updateBundle->execute($request->user(), $bundle, $request->validated());

            return $this->jsonSuccess(
                new WhatsAppNewsBundleResource($bundle),
                'Agrupamento editorial atualizado com sucesso'
            );
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_CONFLICT', 409);
        }
    }

    public function addItems(AddWhatsAppNewsBundleItemsRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $bundle = $this->addItems->execute(
                $request->user(),
                $bundle,
                $request->validated('event_ids'),
                (int) $request->validated('lock_version')
            );

            return $this->jsonSuccess(new WhatsAppNewsBundleResource($bundle), 'Itens adicionados');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_ITEMS_ADD_FAILED', 409);
        }
    }

    public function removeItem(RemoveWhatsAppNewsBundleItemRequest $request, int $id, int $eventId): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $bundle = $this->removeItem->execute(
                $request->user(),
                $bundle,
                $eventId,
                (int) $request->validated('lock_version')
            );

            return $this->jsonSuccess(new WhatsAppNewsBundleResource($bundle), 'Item removido');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_ITEM_REMOVE_FAILED', 409);
        }
    }

    public function setStar(SetWhatsAppNewsBundleStarRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);
        $bundle = $this->manageState->setStarred($request->user(), $bundle, (bool) $request->validated('is_starred'));

        return $this->jsonSuccess(new WhatsAppNewsBundleResource($bundle), 'Marcacao atualizada');
    }

    public function archive(ArchiveWhatsAppNewsBundleRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $bundle = $this->manageState->archive($request->user(), $bundle, (int) $request->validated('lock_version'));

            return $this->jsonSuccess(new WhatsAppNewsBundleResource($bundle), 'Agrupamento editorial arquivado');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_ARCHIVE_FAILED', 409);
        }
    }

    public function reopen(ReopenWhatsAppNewsBundleRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $bundle = $this->manageState->reopen($request->user(), $bundle, (int) $request->validated('lock_version'));

            return $this->jsonSuccess(new WhatsAppNewsBundleResource($bundle), 'Agrupamento editorial reaberto');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_REOPEN_FAILED', 409);
        }
    }

    public function duplicate(Request $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);
        $bundle = $this->duplicateBundle->execute($request->user(), $bundle);

        return $this->jsonCreated(new WhatsAppNewsBundleResource($bundle), 'Agrupamento editorial duplicado com sucesso');
    }

    public function promote(PromoteWhatsAppNewsBundleRequest $request, int $id): JsonResponse
    {
        $bundle = $this->findAccessibleBundle($request->user()->getKey(), $id);

        try {
            $result = $this->promoteBundle->execute(
                $request->user(),
                $bundle,
                (int) $request->validated('lock_version')
            );

            return $this->jsonSuccess([
                'bundle' => new WhatsAppNewsBundleResource($result['bundle']),
                'news_item' => [
                    'id' => $result['news_item']->id,
                    'public_token' => $result['news_item']->public_token,
                    'title' => $result['news_item']->title,
                    'excerpt' => $result['news_item']->excerpt,
                    'news_source_id' => $result['news_item']->news_source_id,
                ],
                'created' => $result['created'],
            ], $result['created'] ? 'Agrupamento editorial promovido com sucesso' : 'Agrupamento editorial ja promovido');
        } catch (RuntimeException $exception) {
            return $this->jsonError($exception->getMessage(), 'WHATSAPP_BUNDLE_PROMOTE_FAILED', 409);
        }
    }

    private function findAccessibleBundle(int $userId, int $bundleId): WhatsAppNewsBundle
    {
        $bundle = WhatsAppNewsBundle::query()->findOrFail($bundleId);
        $this->ensureAccess->forBundle(\App\Models\User::query()->findOrFail($userId), $bundle);

        return $bundle;
    }
}
