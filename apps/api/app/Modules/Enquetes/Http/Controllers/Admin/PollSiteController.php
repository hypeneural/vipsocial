<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Http\Requests\Admin\StorePollSiteRequest;
use App\Modules\Enquetes\Http\Requests\Admin\UpdatePollSiteRequest;
use App\Modules\Enquetes\Models\PollSite;
use App\Modules\Enquetes\Services\PollSiteService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollSiteController extends BaseController
{
    public function __construct(private readonly PollSiteService $service)
    {
    }

    public function index(): JsonResponse
    {
        return $this->jsonSuccess(
            $this->service->list()
                ->map(fn(PollSite $site) => $this->service->serializeSite($site))
                ->values()
                ->all()
        );
    }

    public function store(StorePollSiteRequest $request): JsonResponse
    {
        try {
            $site = $this->service->create($request->validated());

            return $this->jsonCreated($this->service->serializeSite($site), 'Site criado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar site', 'POLL_SITE_CREATE_FAILED', 500);
        }
    }

    public function update(int $id, UpdatePollSiteRequest $request): JsonResponse
    {
        try {
            $site = $this->service->update($this->findSite($id), $request->validated());

            return $this->jsonSuccess($this->service->serializeSite($site), 'Site atualizado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar site', 'POLL_SITE_UPDATE_FAILED', 500);
        }
    }

    private function findSite(int $id): PollSite
    {
        $site = PollSite::query()->with('domains')->find($id);

        if ($site === null) {
            throw (new ModelNotFoundException())->setModel(PollSite::class, [$id]);
        }

        return $site;
    }
}
