<?php

namespace App\Modules\WhatsApp\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppRafflePhoneReveal extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_raffle_phone_reveals';

    protected $fillable = [
        'draw_id',
        'revealed_by',
        'revealed_at',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'revealed_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function draw(): BelongsTo
    {
        return $this->belongsTo(WhatsAppRaffleDraw::class, 'draw_id');
    }

    public function revealedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revealed_by');
    }
}
