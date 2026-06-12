<?php

use App\Modules\WhatsApp\Services\WhatsAppService;

it('validates the real zapi raffle group metadata payload', function (): void {
    if (getenv('ZAPI_REAL_TESTS') !== 'true') {
        $this->markTestSkipped('Set ZAPI_REAL_TESTS=true to call real Z-API endpoints.');
    }

    $groupId = (string) (getenv('ZAPI_REAL_GROUP_ID') ?: config('whatsapp.raffle.group_id'));

    $payload = app(WhatsAppService::class)->lightGroupMetadata($groupId);

    expect($payload)->toHaveKeys(['phone', 'participants']);
    expect($payload['phone'])->toBe($groupId);
    expect($payload['participants'])->toBeArray()->not->toBeEmpty();

    foreach ($payload['participants'] as $participant) {
        expect($participant)->toHaveKeys(['phone', 'isAdmin', 'isSuperAdmin']);
        expect($participant['phone'])->toMatch('/^\d{10,15}$/');
        expect($participant['isAdmin'])->toBeBool();
        expect($participant['isSuperAdmin'])->toBeBool();
    }
})->group('zapi-real');

it('validates the real zapi profile picture found or not-found payload', function (): void {
    if (getenv('ZAPI_REAL_TESTS') !== 'true') {
        $this->markTestSkipped('Set ZAPI_REAL_TESTS=true to call real Z-API endpoints.');
    }

    $groupId = (string) (getenv('ZAPI_REAL_GROUP_ID') ?: config('whatsapp.raffle.group_id'));
    $metadata = app(WhatsAppService::class)->lightGroupMetadata($groupId);
    $phone = collect($metadata['participants'] ?? [])
        ->pluck('phone')
        ->filter()
        ->first();

    expect($phone)->toBeString()->not->toBe('');

    $payload = app(WhatsAppService::class)->profilePicture($phone);

    expect($payload)->toHaveKey('link');

    if (($payload['link'] ?? null) === 'null') {
        expect($payload)->toHaveKey('errorMessage');
    } else {
        expect($payload['link'])->toBeString()->toStartWith('http');
    }
})->group('zapi-real');

it('validates profile picture empty phone guard without calling zapi', function (): void {
    if (getenv('ZAPI_REAL_TESTS') !== 'true') {
        $this->markTestSkipped('Set ZAPI_REAL_TESTS=true to run real endpoint suite.');
    }

    expect(fn() => app(WhatsAppService::class)->profilePicture(''))
        ->toThrow(InvalidArgumentException::class);
})->group('zapi-real');
