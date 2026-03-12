<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppBundleMarkdownExport extends Model
{
    protected $table = 'whatsapp_bundle_markdown_exports';

    protected $fillable = [
        'bundle_id',
        'bundle_lock_version',
        'markdown_text',
        'markdown_hash',
        'signed_token',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(WhatsAppNewsBundle::class, 'bundle_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
