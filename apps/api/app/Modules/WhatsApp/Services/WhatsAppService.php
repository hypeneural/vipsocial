<?php

namespace App\Modules\WhatsApp\Services;

use App\Modules\WhatsApp\Clients\WhatsAppProviderInterface;
use App\Modules\WhatsApp\Jobs\SendWhatsAppImageJob;
use App\Modules\WhatsApp\Jobs\SendWhatsAppLinkJob;
use App\Modules\WhatsApp\Jobs\SendWhatsAppTextJob;
use App\Modules\WhatsApp\Support\PhoneNormalizer;
use Illuminate\Support\Facades\Cache;
use Throwable;

class WhatsAppService
{
    public function __construct(
        private readonly WhatsAppProviderInterface $client,
        private readonly PhoneNormalizer $phoneNormalizer
    ) {
    }

    public function sendText(string $phone, string $message, array $options = []): array
    {
        $payload = array_filter([
            'phone' => $this->phoneNormalizer->normalize($phone),
            'message' => $message,
            'delayMessage' => $options['delayMessage'] ?? null,
            'delayTyping' => $options['delayTyping'] ?? null,
            'editMessageId' => $options['editMessageId'] ?? null,
        ], static fn($value) => $value !== null);

        return $this->client->post('send-text', $payload);
    }

    public function sendImage(string $phone, string $image, ?string $caption = null, array $options = []): array
    {
        $payload = array_filter([
            'phone' => $this->phoneNormalizer->normalize($phone),
            'image' => $image,
            'caption' => $caption,
            'messageId' => $options['messageId'] ?? null,
            'delayMessage' => $options['delayMessage'] ?? null,
            'viewOnce' => $options['viewOnce'] ?? null,
        ], static fn($value) => $value !== null);

        return $this->client->post('send-image', $payload);
    }

    public function sendLink(
        string $phone,
        string $message,
        string $image,
        string $linkUrl,
        string $title,
        string $linkDescription,
        string $linkType = 'LARGE'
    ): array {
        $payload = [
            'phone' => $this->phoneNormalizer->normalize($phone),
            'message' => $message,
            'image' => $image,
            'linkUrl' => $linkUrl,
            'title' => $title,
            'linkDescription' => $linkDescription,
            'linkType' => strtoupper($linkType),
        ];

        return $this->client->post('send-link', $payload);
    }

    public function status(): array
    {
        $ttl = max(1, (int) config('whatsapp.cache.status_ttl_sec', 15));

        return $this->rememberWithLock(
            key: 'whatsapp:zapi:status',
            ttlSec: $ttl,
            resolver: fn() => $this->client->get('status')
        );
    }

    public function qrCodeImage(): array
    {
        $ttl = max(1, (int) config('whatsapp.cache.qrcode_ttl_sec', 10));

        return $this->rememberWithLock(
            key: 'whatsapp:zapi:qrcode:image',
            ttlSec: $ttl,
            resolver: fn() => $this->client->get('qr-code/image')
        );
    }

    public function deviceInfo(): array
    {
        $ttl = max(1, (int) config('whatsapp.cache.device_ttl_sec', 30));

        return $this->rememberWithLock(
            key: 'whatsapp:zapi:device',
            ttlSec: $ttl,
            resolver: fn() => $this->client->get('device')
        );
    }

    public function disconnect(): array
    {
        $response = $this->client->get('disconnect');

        Cache::forget('whatsapp:zapi:status');
        Cache::forget('whatsapp:zapi:qrcode:image');
        Cache::forget('whatsapp:zapi:device');

        return $response;
    }

    public function groupMetadata(string $groupId): array
    {
        return $this->client->get('group-metadata/' . rawurlencode($groupId));
    }

    public function lightGroupMetadata(string $groupId): array
    {
        return $this->client->get('light-group-metadata/' . rawurlencode($groupId));
    }

    public function getContacts(int $page = 1, int $pageSize = 1000): array
    {
        return $this->client->get('contacts', [
            'page' => max(1, $page),
            'pageSize' => max(1, $pageSize),
        ]);
    }

    public function getChats(int $page = 1, int $pageSize = 1000): array
    {
        return $this->client->get('chats', [
            'page' => max(1, $page),
            'pageSize' => max(1, $pageSize),
        ]);
    }

    public function queueSendText(string $phone, string $message, array $options = [], ?string $queue = null): void
    {
        $job = new SendWhatsAppTextJob($phone, $message, $options);

        if (is_string($queue) && $queue !== '') {
            $job->onQueue($queue);
        }

        dispatch($job);
    }

    public function queueSendImage(
        string $phone,
        string $image,
        ?string $caption = null,
        array $options = [],
        ?string $queue = null
    ): void {
        $job = new SendWhatsAppImageJob($phone, $image, $caption, $options);

        if (is_string($queue) && $queue !== '') {
            $job->onQueue($queue);
        }

        dispatch($job);
    }

    public function queueSendLink(
        string $phone,
        string $message,
        string $image,
        string $linkUrl,
        string $title,
        string $linkDescription,
        string $linkType = 'LARGE',
        ?string $queue = null
    ): void {
        $job = new SendWhatsAppLinkJob($phone, $message, $image, $linkUrl, $title, $linkDescription, $linkType);

        if (is_string($queue) && $queue !== '') {
            $job->onQueue($queue);
        }

        dispatch($job);
    }

    private function rememberWithLock(string $key, int $ttlSec, callable $resolver): array
    {
        if (Cache::has($key)) {
            return (array) Cache::get($key);
        }

        $lock = $this->acquireLock("{$key}:lock", 10);

        try {
            if (Cache::has($key)) {
                return (array) Cache::get($key);
            }

            $data = (array) $resolver();
            Cache::put($key, $data, $ttlSec);

            return $data;
        } finally {
            $this->releaseLock($lock);
        }
    }

    private function acquireLock(string $key, int $seconds): mixed
    {
        try {
            $lock = Cache::lock($key, $seconds);
            if (is_object($lock) && method_exists($lock, 'get') && $lock->get()) {
                return $lock;
            }
        } catch (Throwable) {
            // Lock e opcional. Segue sem lock se nao estiver disponivel.
        }

        return null;
    }

    private function releaseLock(mixed $lock): void
    {
        if (!is_object($lock) || !method_exists($lock, 'release')) {
            return;
        }

        try {
            $lock->release();
        } catch (Throwable) {
            // Best effort.
        }
    }
}
