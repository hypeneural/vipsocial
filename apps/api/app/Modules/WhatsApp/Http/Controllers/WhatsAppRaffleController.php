<?php

namespace App\Modules\WhatsApp\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\WhatsApp\Actions\DrawWhatsAppRaffleAction;
use App\Modules\WhatsApp\Actions\RevealWhatsAppRafflePhoneAction;
use App\Modules\WhatsApp\Exceptions\WhatsAppRaffleException;
use App\Modules\WhatsApp\Http\Requests\DrawWhatsAppRaffleRequest;
use App\Modules\WhatsApp\Http\Requests\RevealWhatsAppRafflePhoneRequest;
use App\Modules\WhatsApp\Models\WhatsAppRaffleDraw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppRaffleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 50);
        $campaignKey = trim((string) $request->query('campaign_key', ''));

        $draws = WhatsAppRaffleDraw::query()
            ->with('drawnBy:id,name,email')
            ->when($campaignKey !== '', fn($query) => $query->where('campaign_key', $campaignKey))
            ->latest('drawn_at')
            ->latest('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $draws->through(fn(WhatsAppRaffleDraw $draw): array => $this->serializeHistoryDraw($draw))->items(),
            'meta' => [
                'current_page' => $draws->currentPage(),
                'last_page' => $draws->lastPage(),
                'per_page' => $draws->perPage(),
                'total' => $draws->total(),
            ],
        ]);
    }

    public function draw(
        DrawWhatsAppRaffleRequest $request,
        DrawWhatsAppRaffleAction $action
    ): JsonResponse {
        try {
            $draw = $action->execute($request->user(), $request->validated());
        } catch (WhatsAppRaffleException $e) {
            return $this->error($e);
        }

        return response()->json([
            'success' => true,
            'data' => $draw,
        ]);
    }

    public function revealPhone(
        RevealWhatsAppRafflePhoneRequest $request,
        WhatsAppRaffleDraw $draw,
        RevealWhatsAppRafflePhoneAction $action
    ): JsonResponse {
        try {
            $reveal = $action->execute(
                $draw,
                $request->user(),
                $request->ip(),
                (string) $request->userAgent()
            );
        } catch (WhatsAppRaffleException $e) {
            return $this->error($e);
        }

        return response()->json([
            'success' => true,
            'data' => $reveal,
        ]);
    }

    private function serializeHistoryDraw(WhatsAppRaffleDraw $draw): array
    {
        return [
            'draw_id' => $draw->id,
            'confirmation_code' => $draw->confirmation_code,
            'group_id' => $draw->group_id,
            'group_name' => $draw->group_subject,
            'campaign_name' => $draw->campaign_name,
            'campaign_key' => $draw->campaign_key,
            'phone_masked' => '****' . $draw->phone_last_digits,
            'phone_last_digits' => $draw->phone_last_digits,
            'photo_url' => $draw->photo_url,
            'winner_had_photo' => $draw->winner_had_photo,
            'eligible_participants_count' => $draw->eligible_participants_count,
            'reveal_count' => $draw->reveal_count,
            'last_revealed_at' => $draw->last_revealed_at?->toJSON(),
            'drawn_at' => $draw->drawn_at?->toJSON(),
            'drawn_by' => $draw->drawnBy ? [
                'id' => $draw->drawnBy->id,
                'name' => $draw->drawnBy->name,
                'email' => $draw->drawnBy->email,
            ] : null,
        ];
    }

    private function error(WhatsAppRaffleException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'code' => $e->errorCode(),
        ], $e->httpStatus());
    }
}
