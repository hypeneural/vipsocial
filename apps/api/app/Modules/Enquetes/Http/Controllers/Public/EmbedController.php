<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Support\PollStateResolver;
use Illuminate\Http\Response;

class EmbedController
{
    public function __construct(private readonly PollStateResolver $stateResolver)
    {
    }

    public function show(string $placementPublicId): Response
    {
        $placement = PollPlacement::query()
            ->with(['poll.options'])
            ->where('public_id', $placementPublicId)
            ->where('is_active', true)
            ->firstOrFail();

        $poll = $placement->poll;
        $state = $this->stateResolver->resolveWidgetState($poll);

        $question = e($poll->question);
        $placementId = e($placement->public_id);
        $stateLabel = e($state);

        $html = <<<HTML
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Enquete</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; padding: 24px; background: #f6f1e8; color: #1f2937; }
    .card { max-width: 720px; margin: 0 auto; background: #fffdf8; border: 1px solid #eadfcd; border-radius: 20px; padding: 24px; box-shadow: 0 20px 50px rgba(61, 43, 31, 0.08); }
    .eyebrow { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #efe2cd; color: #6b4f33; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    h1 { font-size: 28px; line-height: 1.1; margin: 16px 0 8px; }
    p { margin: 0; color: #6b7280; }
  </style>
</head>
<body>
  <main class="card">
    <span class="eyebrow">Embed enquete</span>
    <h1>{$question}</h1>
    <p>Placement: {$placementId}</p>
    <p>Estado atual: {$stateLabel}</p>
  </main>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
