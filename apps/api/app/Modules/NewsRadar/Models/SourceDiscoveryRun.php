<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\DiscoveryRunStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SourceDiscoveryRun extends Model
{
    use HasUuids;

    protected $fillable = [
        'requested_url',
        'status',
        'result_json',
        'selector_test_snapshots',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'status' => DiscoveryRunStatus::class,
        'result_json' => 'array',
        'selector_test_snapshots' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function addSelectorTestSnapshot(string $url, string $selector, mixed $resultPreview): void
    {
        $snapshots = $this->selector_test_snapshots ?? [];
        $snapshots[] = [
            'url' => $url,
            'selector' => $selector,
            'result_preview' => $resultPreview,
            'tested_at' => now()->toIso8601String(),
        ];
        $this->update(['selector_test_snapshots' => $snapshots]);
    }
}
