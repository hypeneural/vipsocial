<?php

use App\Modules\WhatsAppInbound\Http\Controllers\ZApiInboundWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhook/zapi/inbound-message', [ZApiInboundWebhookController::class, 'store']);
