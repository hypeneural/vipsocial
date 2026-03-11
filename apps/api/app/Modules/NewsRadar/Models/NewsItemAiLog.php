<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Exceptions\AiRequestException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Throwable;

class NewsItemAiLog extends Model
{
    protected $fillable = [
        'news_item_id',
        'stage',
        'status',
        'model',
        'tokens_used',
        'error_message',
        'meta_json',
    ];

    protected $casts = [
        'tokens_used' => 'integer',
        'meta_json' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'news_item_id');
    }

    public static function recordSuccess(
        NewsItem $item,
        string $stage,
        string $model,
        ?int $tokensUsed = null,
        array $meta = [],
    ): self {
        return self::create([
            'news_item_id' => $item->id,
            'stage' => $stage,
            'status' => 'success',
            'model' => $model,
            'tokens_used' => $tokensUsed,
            'error_message' => null,
            'meta_json' => $meta !== [] ? $meta : null,
        ]);
    }

    public static function recordFailure(
        NewsItem $item,
        string $stage,
        string $model,
        Throwable $throwable,
        array $meta = [],
    ): self {
        $resolvedStage = $throwable instanceof AiRequestException ? $throwable->stage : $stage;
        $resolvedModel = $throwable instanceof AiRequestException ? $throwable->model : $model;
        $context = $throwable instanceof AiRequestException ? $throwable->context : [];

        $metaJson = array_filter(
            array_merge([
                'exception_class' => $throwable::class,
                'exception_code' => self::normalizeScalar($throwable->getCode()),
            ], $context, $meta),
            static fn (mixed $value): bool => $value !== null && $value !== ''
        );

        return self::create([
            'news_item_id' => $item->id,
            'stage' => $resolvedStage,
            'status' => 'failed',
            'model' => $resolvedModel,
            'tokens_used' => null,
            'error_message' => mb_substr(self::normalizeMessage($throwable->getMessage()), 0, 2000),
            'meta_json' => $metaJson !== [] ? $metaJson : null,
        ]);
    }

    private static function normalizeMessage(string $message): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($message)) ?? trim($message);

        return $normalized !== '' ? $normalized : 'Falha desconhecida ao executar a IA.';
    }

    private static function normalizeScalar(mixed $value): int|string|null
    {
        if (is_int($value) || is_string($value)) {
            return $value;
        }

        if (is_float($value)) {
            return (string) $value;
        }

        return null;
    }
}
