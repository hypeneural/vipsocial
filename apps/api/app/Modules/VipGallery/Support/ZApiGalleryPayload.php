<?php

namespace App\Modules\VipGallery\Support;

use App\Modules\VipGallery\Models\VipGalleryWebhookLog;

class ZApiGalleryPayload
{
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
            'groupId',
            'chatId',
            'remoteJid',
            'data.chatId',
            'data.groupId',
            'message.chatId',
            'message.remoteJid',
            'from',
            'phone',
        ]);
    }

    public static function participantPhone(array $payload): ?string
    {
        return self::firstString($payload, [
            'participantPhone',
            'participant.phone',
            'phone',
            'senderPhone',
            'data.phone',
            'message.sender.phone',
            'sender.phone',
            'participant',
        ]);
    }

    public static function senderName(array $payload): ?string
    {
        return self::firstString($payload, [
            'senderName',
            'pushName',
            'participantName',
            'sender.name',
            'data.senderName',
            'message.senderName',
        ]);
    }

    public static function caption(array $payload): ?string
    {
        return self::firstString($payload, [
            'caption',
            'image.caption',
            'data.caption',
            'data.image.caption',
            'message.caption',
            'messages.0.caption',
        ]);
    }

    public static function textBody(array $payload): ?string
    {
        return self::firstString($payload, [
            'text.message',
            'text.body',
            'text',
            'body',
            'messageText',
            'data.body',
            'data.text',
            'data.text.message',
            'data.text.body',
            'message.text',
            'message.body',
            'message.extendedTextMessage.text',
            'messages.0.text.body',
        ]);
    }

    public static function imageUrl(array $payload): ?string
    {
        return self::firstString($payload, [
            'image.url',
            'image.imageUrl',
            'imageUrl',
            'data.image.url',
            'data.image.imageUrl',
            'body.imageUrl',
            'content.url',
            'message.image.url',
            'messages.0.image.url',
        ]);
    }

    public static function referenceMessageId(array $payload): ?string
    {
        return self::firstString($payload, [
            'referenceMessageId',
            'quotedMsgId',
            'contextInfo.stanzaId',
            'data.contextInfo.stanzaId',
            'message.contextInfo.stanzaId',
            'message.extendedTextMessage.contextInfo.stanzaId',
            'messages.0.contextInfo.stanzaId',
        ]);
    }

    public static function detectedType(array $payload): string
    {
        if (self::isImage($payload)) {
            return VipGalleryWebhookLog::TYPE_IMAGE;
        }

        if (self::textBody($payload) !== null) {
            return VipGalleryWebhookLog::TYPE_TEXT_COMMAND;
        }

        return VipGalleryWebhookLog::TYPE_INVALID;
    }

    public static function isImage(array $payload): bool
    {
        if (self::firstBool($payload, ['isImage', 'data.isImage', 'message.isImage'])) {
            return true;
        }

        $messageType = self::firstString($payload, [
            'type',
            'message.type',
            'data.type',
            'messages.0.type',
        ]);

        return in_array(strtolower((string) $messageType), ['image', 'picture'], true)
            || self::imageUrl($payload) !== null;
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
            if (data_get($payload, $path) === true) {
                return true;
            }
        }

        return false;
    }
}
