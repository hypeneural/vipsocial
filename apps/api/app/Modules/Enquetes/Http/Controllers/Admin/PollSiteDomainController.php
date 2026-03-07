<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Http\Requests\Admin\StorePollSiteDomainRequest;
use App\Modules\Enquetes\Http\Requests\Admin\UpdatePollSiteDomainRequest;
use App\Modules\Enquetes\Models\PollSite;
use App\Modules\Enquetes\Models\PollSiteDomain;
use App\Modules\Enquetes\Services\PollSiteService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollSiteDomainController extends BaseController
{
    public function __construct(private readonly PollSiteService $service)
    {
    }

    public function index(int $id): JsonResponse
    {
        $site = PollSite::query()->with('domains')->find($id);

        if ($site === null) {
            throw (new ModelNotFoundException())->setModel(PollSite::class, [$id]);
        }

        return $this->jsonSuccess(
            $site->domains
                ->map(fn(PollSiteDomain $domain) => $this->service->serializeDomain($domain))
                ->values()
                ->all()
        );
    }

    public function store(int $id, StorePollSiteDomainRequest $request): JsonResponse
    {
        $site = PollSite::query()->find($id);

        if ($site === null) {
            throw (new ModelNotFoundException())->setModel(PollSite::class, [$id]);
        }

        try {
            $domain = $this->service->createDomain($site, $request->validated());

            return $this->jsonCreated($this->service->serializeDomain($domain), 'Dominio criado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar dominio', 'POLL_SITE_DOMAIN_CREATE_FAILED', 500);
        }
    }

    public function update(int $id, UpdatePollSiteDomainRequest $request): JsonResponse
    {
        try {
            $domain = $this->service->updateDomain($this->findDomain($id), $request->validated());

            return $this->jsonSuccess($this->service->serializeDomain($domain), 'Dominio atualizado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar dominio', 'POLL_SITE_DOMAIN_UPDATE_FAILED', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deleteDomain($this->findDomain($id));

            return $this->jsonDeleted('Dominio removido com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao remover dominio', 'POLL_SITE_DOMAIN_DELETE_FAILED', 500);
        }
    }

    private function findDomain(int $id): PollSiteDomain
    {
        $domain = PollSiteDomain::query()->find($id);

        if ($domain === null) {
            throw (new ModelNotFoundException())->setModel(PollSiteDomain::class, [$id]);
        }

        return $domain;
    }
}
