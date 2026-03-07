<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Http\Requests\Public\SubmitVoteRequest;
use App\Modules\Enquetes\Services\PollVoteService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class WidgetVoteController extends BaseController
{
    public function __construct(private readonly PollVoteService $service)
    {
    }

    public function store(string $pollPublicId, SubmitVoteRequest $request): JsonResponse
    {
        try {
            $result = $this->service->submit($pollPublicId, $request->validated(), $request);

            if ($result['accepted'] === false) {
                return response()->json([
                    'success' => false,
                    'data' => [
                        'accepted' => false,
                        'block_reason' => $result['block_reason'],
                        'results_available' => $result['results_available'] ?? false,
                        'results' => $result['results'] ?? null,
                    ],
                    'message' => $result['message'],
                ], (int) ($result['http_status'] ?? 409));
            }

            return $this->jsonSuccess([
                'accepted' => true,
                'message' => $result['message'],
                'results_available' => $result['results_available'],
                'results' => $result['results'],
            ], '');
        } catch (RuntimeException $e) {
            $code = $e->getMessage();
            $status = match ($code) {
                'POLL_NOT_ACCEPTING_VOTES' => 409,
                'POLL_OPTION_NOT_FOUND', 'POLL_SINGLE_SELECTION_REQUIRED', 'POLL_MAX_CHOICES_EXCEEDED' => 422,
                default => 400,
            };

            return $this->jsonError($code, $code, $status);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao registrar voto', 'POLL_VOTE_FAILED', 500);
        }
    }
}
