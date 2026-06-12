<?php

namespace App\Modules\WhatsApp\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppRaffleDraw extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_raffle_draws';

    protected $fillable = [
        'confirmation_code',
        'group_id',
        'group_subject',
        'campaign_name',
        'campaign_key',
        'eligible_participants_count',
        'winner_phone_hash',
        'winner_phone_encrypted',
        'phone_last_digits',
        'winner_had_photo',
        'photo_url',
        'drawn_by',
        'drawn_at',
        'provider',
        'provider_payload_hash',
        'reveal_count',
        'last_revealed_at',
    ];

    protected function casts(): array
    {
        return [
            'winner_phone_encrypted' => 'encrypted',
            'winner_had_photo' => 'boolean',
            'drawn_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'last_revealed_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function drawnBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'drawn_by');
    }

    public function reveals(): HasMany
    {
        return $this->hasMany(WhatsAppRafflePhoneReveal::class, 'draw_id');
    }
}
