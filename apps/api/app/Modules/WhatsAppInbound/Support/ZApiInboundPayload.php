<?php

namespace App\Modules\WhatsAppInbound\Support;

use Illuminate\Support\Carbon;

class ZApiInboundPayload
{
    public const KIND_TEXT = 'text';
    public const KIND_IMAGE = 'image';
    public const KIND_VIDEO = 'video';
    public const KIND_DOCUMENT = 'document';
    public const KIND_AUDIO = 'audio';
    public const KIND_LOCATION = 'location';
    public const KIND_CONTACT = 'contact';
    public const KIND_STICKER = 'sticker';
    public const KIND_UNKNOWN = 'unknown';

    public static function instanceId(array $payload): ?string
    {
        return self::firstString($payload, [
            'instanceId',
            'instance_id',
            'data.instanceId',
            'message.instanceId',
        ]);
    }

    public static function messageId(array $payload): ?string
    {
        return self::firstString($payload, [
            'messageId',
            'message_id',
            'id',
            'data.messageId',
            'message.id',
            'messages.0.messageId',
            'messages.0.id',
        ]);
    }

    public static function groupId(array $payload): ?string
    {
        return self::firstString($payload, [
            'phone',
            'groupId',
            'chatId',
            'remoteJid',
            'data.groupId',
            'data.chatId',
            'message.chatId',
            'message.remoteJid',
            'from',
        ]);
    }

    public static function chatName(array $payload): ?string
    {
        return self::firstString($payload, [
            'chatName',
            'data.chatName',
        ]);
    }

    public static function participantPhone(array $payload): ?string
    {
        return self::firstString($payload, [
            'participantPhone',
            'data.participantPhone',
        ]);
    }

    public static function participantLid(array $payload): ?string
    {
        return self::firstString($payload, [
            'participantLid',
            'data.participantLid',
        ]);
    }

    public static function senderName(array $payload): ?string
    {
        return self::firstString($payload, [
            'senderName',
            'data.senderName',
        ]);
    }

    public static function senderPhoto(array $payload): ?string
    {
        return self::firstString($payload, [
            'senderPhoto',
            'photo',
            'data.senderPhoto',
        ]);
    }

    public static function status(array $payload): ?string
    {
        return self::firstString($payload, [
            'status',
            'data.status',
        ]);
    }

    public static function providerEventType(array $payload): ?string
    {
        return self::firstString($payload, [
            'type',
            'data.type',
        ]);
    }

    public static function referenceMessageId(array $payload): ?string
    {
        return self::firstString($payload, [
            'referenceMessageId',
            'data.referenceMessageId',
        ]);
    }

    public static function isGroup(array $payload): bool
    {
        return self::firstBool($payload, [
            'isGroup',
            'data.isGroup',
        ]);
    }

    public static function isNewsletter(array $payload): bool
    {
        return self::firstBool($payload, [
            'isNewsletter',
            'data.isNewsletter',
        ]);
    }

    public static function fromMe(array $payload): bool
    {
        return self::firstBool($payload, [
            'fromMe',
            'data.fromMe',
        ]);
    }

    public static function isEdit(array $payload): bool
    {
        return self::firstBool($payload, [
            'isEdit',
            'data.isEdit',
        ]);
    }

    public static function isForwarded(array $payload): bool
    {
        return self::firstBool($payload, [
            'forwarded',
            'data.forwarded',
        ]);
    }

    public static function sentAt(array $payload): ?Carbon
    {
        $raw = self::firstNumeric($payload, [
            'momment',
            'moment',
            'timestamp',
            'data.momment',
        ]);

        if ($raw === null) {
            return null;
        }

        return $raw > 9999999999
            ? Carbon::createFromTimestampMs($raw)
            : Carbon::createFromTimestamp($raw);
    }

    public static function messageKind(array $payload): string
    {
        foreach ([
            self::KIND_IMAGE,
            self::KIND_VIDEO,
            self::KIND_DOCUMENT,
            self::KIND_AUDIO,
            self::KIND_LOCATION,
            self::KIND_CONTACT,
            self::KIND_STICKER,
            self::KIND_TEXT,
        ] as $kind) {
            if (is_array(data_get($payload, $kind))) {
                return $kind;
            }
        }

        return self::firstString($payload, ['messageType']) ?? self::KIND_UNKNOWN;
    }

    public static function textMessage(array $payload): ?string
    {
        return self::firstString($payload, [
            'text.message',
            'image.caption',
            'video.caption',
            'document.caption',
            'text',
        ]);
    }

    public static function textTitle(array $payload): ?string
    {
        return self::firstString($payload, [
            'text.title',
            'document.title',
        ]);
    }

    public static function textDescription(array $payload): ?string
    {
        return self::firstString($payload, [
            'text.description',
            'text.descritpion',
        ]);
    }

    public static function linkUrl(array $payload): ?string
    {
        return self::firstString($payload, [
            'text.url',
            'location.url',
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function mediaItems(array $payload): array
    {
        $items = [];

        $image = data_get($payload, 'image');
        if (is_array($image)) {
            $items[] = [
                'kind' => self::KIND_IMAGE,
                'source_url' => self::firstString(['image' => $image], ['image.imageUrl']),
                'thumbnail_source_url' => self::firstString(['image' => $image], ['image.thumbnailUrl']),
                'mime_type' => self::firstString(['image' => $image], ['image.mimeType']),
                'width' => self::firstNumeric(['image' => $image], ['image.width']),
                'height' => self::firstNumeric(['image' => $image], ['image.height']),
                'page_count' => null,
                'file_name' => null,
                'duration_ms' => null,
            ];
        }

        $video = data_get($payload, 'video');
        if (is_array($video)) {
            $items[] = [
                'kind' => self::KIND_VIDEO,
                'source_url' => self::firstString(['video' => $video], ['video.videoUrl']),
                'thumbnail_source_url' => self::firstString(['video' => $video], ['video.thumbnailUrl']),
                'mime_type' => self::firstString(['video' => $video], ['video.mimeType']),
                'width' => self::firstNumeric(['video' => $video], ['video.width']),
                'height' => self::firstNumeric(['video' => $video], ['video.height']),
                'page_count' => null,
                'file_name' => null,
                'duration_ms' => null,
            ];
        }

        $document = data_get($payload, 'document');
        if (is_array($document)) {
            $items[] = [
                'kind' => self::KIND_DOCUMENT,
                'source_url' => self::firstString(['document' => $document], ['document.documentUrl']),
                'thumbnail_source_url' => self::firstString(['document' => $document], ['document.thumbnailUrl']),
                'mime_type' => self::firstString(['document' => $document], ['document.mimeType']),
                'width' => null,
                'height' => null,
                'page_count' => self::firstNumeric(['document' => $document], ['document.pageCount']),
                'file_name' => self::firstString(['document' => $document], ['document.fileName', 'document.title']),
                'duration_ms' => null,
            ];
        }

        $audio = data_get($payload, 'audio');
        if (is_array($audio)) {
            $items[] = [
                'kind' => self::KIND_AUDIO,
                'source_url' => self::firstString(['audio' => $audio], ['audio.audioUrl']),
                'thumbnail_source_url' => null,
                'mime_type' => self::firstString(['audio' => $audio], ['audio.mimeType']),
                'width' => null,
                'height' => null,
                'page_count' => null,
                'file_name' => null,
                'duration_ms' => null,
            ];
        }

        return array_values(array_filter($items, static fn (array $item): bool => $item['source_url'] !== null));
    }

    private static function firstString(array $payload, array $paths): ?string
    {
        foreach ($paths as $path) {
            $value = data_get($payload, $path);

            if (is_string($value)) {
                $trimmed = trim($value);

                if ($trimmed !== '') {
                    return $trimmed;
                }
            }

            if (is_numeric($value)) {
                return (string) $value;
            }
        }

        return null;
    }

    private static function firstBool(array $payload, array $paths): bool
    {
        foreach ($paths as $path) {
            $value = data_get($payload, $path);

            if (is_bool($value)) {
                return $value;
            }

            if (is_numeric($value)) {
                return (bool) $value;
            }

            if (is_string($value) && $value !== '') {
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
        }

        return false;
    }

    private static function firstNumeric(array $payload, array $paths): ?int
    {
        foreach ($paths as $path) {
            $value = data_get($payload, $path);

            if (is_numeric($value)) {
                return (int) $value;
            }
        }

        return null;
    }
}
