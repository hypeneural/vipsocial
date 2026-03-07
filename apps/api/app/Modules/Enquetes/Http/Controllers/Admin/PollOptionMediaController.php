<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Http\Requests\Admin\PollOptionImageRequest;
use App\Modules\Enquetes\Models\PollOption;
use App\Modules\Enquetes\Services\PollService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollOptionMediaController extends BaseController
{
    public function __construct(private readonly PollService $pollService)
    {
    }

    public function store(int $id, PollOptionImageRequest $request): JsonResponse
    {
        $option = $this->findOption($id);

        try {
            $option
                ->addMediaFromRequest('image')
                ->toMediaCollection('option_image');

            $option->refresh();

            return $this->jsonSuccess(
                $this->pollService->serializeOption($option),
                'Imagem da opcao atualizada com sucesso'
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao enviar imagem da opcao', 'POLL_OPTION_IMAGE_UPLOAD_FAILED', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $option = $this->findOption($id);

        try {
            $option->clearMediaCollection('option_image');
            $option->refresh();

            return $this->jsonSuccess(
                $this->pollService->serializeOption($option),
                'Imagem da opcao removida com sucesso'
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao remover imagem da opcao', 'POLL_OPTION_IMAGE_DELETE_FAILED', 500);
        }
    }

    private function findOption(int $id): PollOption
    {
        $option = PollOption::query()->find($id);

        if ($option === null) {
            throw (new ModelNotFoundException())->setModel(PollOption::class, [$id]);
        }

        return $option;
    }
}
