<?php

namespace App\Modules\WhatsApp\Http\Controllers;

use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use App\Modules\WhatsApp\Http\Requests\PaginatedListRequest;
use App\Modules\WhatsApp\Http\Requests\SendImageRequest;
use App\Modules\WhatsApp\Http\Requests\SendLinkRequest;
use App\Modules\WhatsApp\Http\Requests\SendTextRequest;
use App\Modules\WhatsApp\Services\WhatsAppService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

class WhatsAppController extends BaseController
{
    public function __construct(private readonly WhatsAppService $service)
    {
    }

    public function sendText(SendTextRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $async = (bool) ($validated['async'] ?? false);
        $queue = (string) ($validated['queue'] ?? '');

        if ($async) {
            return $this->execute(function () use ($validated, $queue) {
                $this->service->queueSendText(
                    phone: (string) $validated['phone'],
                    message: (string) $validated['message'],
                    options: (array) ($validated['options'] ?? []),
                    queue: $queue !== '' ? $queue : null
                );

                return [
                    'queued' => true,
                    'channel' => $queue !== '' ? $queue : 'default',
                ];
            }, status: 202, message: 'Mensagem enfileirada com sucesso');
        }

        return $this->execute(
            fn() => $this->service->sendText(
                phone: (string) $validated['phone'],
                message: (string) $validated['message'],
                options: (array) ($validated['options'] ?? [])
            )
        );
    }

    public function sendImage(SendImageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $async = (bool) ($validated['async'] ?? false);
        $queue = (string) ($validated['queue'] ?? '');

        if ($async) {
            return $this->execute(function () use ($validated, $queue) {
                $this->service->queueSendImage(
                    phone: (string) $validated['phone'],
                    image: (string) $validated['image'],
                    caption: $validated['caption'] ?? null,
                    options: (array) ($validated['options'] ?? []),
                    queue: $queue !== '' ? $queue : null
                );

                return [
                    'queued' => true,
                    'channel' => $queue !== '' ? $queue : 'default',
                ];
            }, status: 202, message: 'Imagem enfileirada com sucesso');
        }

        return $this->execute(
            fn() => $this->service->sendImage(
                phone: (string) $validated['phone'],
                image: (string) $validated['image'],
                caption: $validated['caption'] ?? null,
                options: (array) ($validated['options'] ?? [])
            )
        );
    }

    public function sendLink(SendLinkRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $async = (bool) ($validated['async'] ?? false);
        $queue = (string) ($validated['queue'] ?? '');

        if ($async) {
            return $this->execute(function () use ($validated, $queue) {
                $this->service->queueSendLink(
                    phone: (string) $validated['phone'],
                    message: (string) $validated['message'],
                    image: (string) $validated['image'],
                    linkUrl: (string) $validated['linkUrl'],
                    title: (string) $validated['title'],
                    linkDescription: (string) $validated['linkDescription'],
                    linkType: (string) ($validated['linkType'] ?? 'LARGE'),
                    queue: $queue !== '' ? $queue : null
                );

                return [
                    'queued' => true,
                    'channel' => $queue !== '' ? $queue : 'default',
                ];
            }, status: 202, message: 'Link enfileirado com sucesso');
        }

        return $this->execute(
            fn() => $this->service->sendLink(
                phone: (string) $validated['phone'],
                message: (string) $validated['message'],
                image: (string) $validated['image'],
                linkUrl: (string) $validated['linkUrl'],
                title: (string) $validated['title'],
                linkDescription: (string) $validated['linkDescription'],
                linkType: (string) ($validated['linkType'] ?? 'LARGE')
            )
        );
    }

    public function status(Request $request): JsonResponse
    {
        return $this->execute(
            fn() => $this->service->status($request->boolean('fresh'))
        );
    }

    public function qrCodeImage(Request $request): JsonResponse
    {
        return $this->execute(
            fn() => $this->service->qrCodeImage($request->boolean('fresh'))
        );
    }

    public function deviceInfo(Request $request): JsonResponse
    {
        return $this->execute(
            fn() => $this->service->deviceInfo($request->boolean('fresh'))
        );
    }

    public function connectionState(Request $request): JsonResponse
    {
        return $this->execute(
            fn() => $this->service->connectionState($request->boolean('fresh'))
        );
    }

    public function disconnect(): JsonResponse
    {
        return $this->execute(fn() => $this->service->disconnect());
    }

    public function groupMetadata(string $groupId): JsonResponse
    {
        return $this->execute(fn() => $this->service->groupMetadata($groupId));
    }

    public function lightGroupMetadata(string $groupId): JsonResponse
    {
        return $this->execute(fn() => $this->service->lightGroupMetadata($groupId));
    }

    public function contacts(PaginatedListRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->execute(
            fn() => $this->service->getContacts(
                page: (int) ($validated['page'] ?? 1),
                pageSize: (int) ($validated['pageSize'] ?? 1000)
            )
        );
    }

    public function chats(PaginatedListRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->execute(
            fn() => $this->service->getChats(
                page: (int) ($validated['page'] ?? 1),
                pageSize: (int) ($validated['pageSize'] ?? 1000)
            )
        );
    }

    private function execute(callable $resolver, int $status = 200, string $message = ''): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $resolver(),
                'message' => $message,
            ], $status);
        } catch (InvalidArgumentException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (WhatsAppProviderException $e) {
            return $this->jsonError(
                message: $e->getMessage(),
                code: 'WHATSAPP_PROVIDER_ERROR',
                status: $e->status(),
                errors: [
                    'provider_status' => $e->status(),
                    'provider_body' => $e->responseBody(),
                ]
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError(
                message: 'Erro inesperado ao processar operacao WhatsApp',
                code: 'WHATSAPP_INTERNAL_ERROR',
                status: 500
            );
        }
    }
}
