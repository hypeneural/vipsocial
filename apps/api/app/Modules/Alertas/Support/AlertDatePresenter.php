<?php

namespace App\Modules\Alertas\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

class AlertDatePresenter
{
    public static function timezone(): string
    {
        return (string) config('alertas.timezone', config('app.timezone', 'UTC'));
    }

    public static function fromStored(Model $model, string $attribute): ?CarbonImmutable
    {
        $raw = $model->getRawOriginal($attribute);

        if ($raw === null || $raw === '') {
            return null;
        }

        return CarbonImmutable::parse((string) $raw, self::timezone());
    }

    public static function isoFromStored(Model $model, string $attribute): ?string
    {
        return self::fromStored($model, $attribute)?->toIso8601String();
    }

    public static function isoFromValue(?CarbonInterface $value): ?string
    {
        return $value?->copy()->setTimezone(self::timezone())->toIso8601String();
    }
}
