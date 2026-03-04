<?php

namespace App\Support\Traits;

use Illuminate\Support\Facades\Context;
use Spatie\Activitylog\Models\Activity;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            static::logAuditActivity($model, 'create', "Criou {$model->getAuditResourceName()} em " . static::getAuditModule());
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if (empty($changes)) {
                return;
            }

            $before = collect($changes)->mapWithKeys(function ($value, $key) use ($model) {
                return [$key => $model->getOriginal($key)];
            })->toArray();

            static::logAuditActivity($model, 'update', "Atualizou {$model->getAuditResourceName()} em " . static::getAuditModule(), [
                'changes' => [
                    'before' => $before,
                    'after' => $changes,
                ],
            ]);
        });

        static::deleted(function ($model) {
            static::logAuditActivity($model, 'delete', "Removeu {$model->getAuditResourceName()} de " . static::getAuditModule());
        });
    }

    protected static function logAuditActivity($model, string $action, string $description, array $extraProps = []): void
    {
        $requestId = Context::get('request_id');
        $traceId = Context::get('trace_id');
        $ip = Context::get('ip');
        $userAgent = Context::get('user_agent');
        $origin = app()->runningInConsole() ? 'scheduler' : 'api';

        $properties = array_merge([
            'action' => $action,
            'module' => static::getAuditModule(),
            'resource_name' => $model->getAuditResourceName(),
        ], $extraProps);

        $activity = activity()
            ->performedOn($model)
            ->causedBy(auth()->user())
            ->withProperties($properties)
            ->log($description);

        // Persist extra columns directly on the activity record
        if ($activity instanceof Activity) {
            $activity->update([
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
                'trace_id' => $traceId,
                'origin' => $origin,
            ]);
        }
    }

    public static function getAuditModule(): string
    {
        return strtolower(class_basename(static::class));
    }

    public function getAuditResourceName(): string
    {
        return $this->name ?? $this->titulo ?? $this->title ?? $this->question ?? "#{$this->getKey()}";
    }
}
