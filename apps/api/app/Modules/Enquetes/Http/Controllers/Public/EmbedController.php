<?php

namespace App\Modules\Enquetes\Http\Controllers\Public;

use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Support\PollStateResolver;
use Illuminate\Http\Response;
use Illuminate\Support\Js;

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
        $pollSettings = is_array($poll->settings) ? $poll->settings : [];
        $widgetTemplate = in_array(($pollSettings['widget_template'] ?? null), ['editorial_card', 'clean_white'], true)
            ? (string) $pollSettings['widget_template']
            : 'editorial_card';
        $config = [
            'placementPublicId' => $placement->public_id,
            'pollPublicId' => $poll->public_id,
            'bootUrl' => url('/api/v1/public/enquetes/placements/' . $placement->public_id . '/boot'),
            'sessionUrl' => url('/api/v1/public/enquetes/widget-sessions'),
            'voteUrl' => url('/api/v1/public/enquetes/' . $poll->public_id . '/vote'),
            'resultsUrl' => url('/api/v1/public/enquetes/' . $poll->public_id . '/results'),
            'eventsUrl' => url('/api/v1/public/enquetes/' . $poll->public_id . '/events'),
            'initialState' => $state,
        ];
        $configJson = Js::from($config);

        $html = <<<HTML
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Enquete TV VIP Social</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f8f1e7;
      --surface: #fffdf8;
      --surface-alt: #f7efe2;
      --border: #eadfcd;
      --ink: #23180e;
      --muted: #6e6254;
      --accent: #ff8000;
      --accent-soft: rgba(255, 128, 0, 0.14);
      --success: #1f9d58;
      --danger: #c2410c;
      --shadow: 0 24px 64px rgba(68, 42, 18, 0.14);
      --radius: 22px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background:
        radial-gradient(circle at top right, rgba(255, 128, 0, 0.18), transparent 36%),
        linear-gradient(180deg, #fbf5ed 0%, var(--bg) 100%);
      color: var(--ink);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    .card {
      max-width: 720px;
      margin: 0 auto;
      background: linear-gradient(180deg, var(--surface) 0%, #fff8ee 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .hero {
      padding: 20px 20px 12px;
      border-bottom: 1px solid rgba(234, 223, 205, 0.9);
      background:
        radial-gradient(circle at top left, rgba(255, 128, 0, 0.12), transparent 32%),
        linear-gradient(180deg, #fffaf2 0%, rgba(255, 255, 255, 0.94) 100%);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: #8a4d00;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 14px 0 8px;
      font-size: clamp(24px, 4vw, 34px);
      line-height: 1.05;
    }
    .subhead { margin: 0; color: var(--muted); font-size: 14px; }
    .body { padding: 20px; }
    .message {
      margin-bottom: 16px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(255, 128, 0, 0.18);
      background: rgba(255, 128, 0, 0.08);
      color: #824500;
      font-size: 14px;
      display: none;
    }
    .message.error { border-color: rgba(194, 65, 12, 0.18); background: rgba(194, 65, 12, 0.08); color: var(--danger); }
    .message.success { border-color: rgba(31, 157, 88, 0.2); background: rgba(31, 157, 88, 0.08); color: var(--success); }
    .stack { display: grid; gap: 14px; }
    .option {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 14px;
      align-items: center;
      width: 100%;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(234, 223, 205, 0.95);
      background: rgba(255, 255, 255, 0.88);
      cursor: pointer;
      transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease, background .16s ease;
      text-align: left;
    }
    .option:hover { transform: translateY(-1px); border-color: rgba(255, 128, 0, 0.34); box-shadow: 0 12px 24px rgba(68, 42, 18, 0.08); }
    .option.is-selected { border-color: rgba(255, 128, 0, 0.48); background: rgba(255, 128, 0, 0.08); }
    .option-marker {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 2px solid rgba(35, 24, 14, 0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #fff;
    }
    .option.is-selected .option-marker {
      border-color: var(--accent);
      background: var(--accent);
      box-shadow: inset 0 0 0 4px #fff;
    }
    .option-thumb {
      width: 68px;
      height: 68px;
      border-radius: 16px;
      object-fit: cover;
      border: 1px solid rgba(234, 223, 205, 0.95);
      background: #f6ecde;
    }
    .option-copy {
      min-width: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: center;
    }
    .option-text { min-width: 0; }
    .option-title { display: block; font-size: 15px; font-weight: 700; line-height: 1.2; }
    .option-description { margin-top: 4px; color: var(--muted); font-size: 13px; line-height: 1.35; }
    .vote-count { font-size: 12px; color: var(--muted); }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
      align-items: center;
      justify-content: space-between;
    }
    .button {
      appearance: none;
      border: none;
      border-radius: 999px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform .16s ease, opacity .16s ease, background .16s ease;
    }
    .button:hover { transform: translateY(-1px); }
    .button:disabled { cursor: not-allowed; opacity: .55; transform: none; }
    .button-primary { background: var(--accent); color: #fff; }
    .button-secondary { background: rgba(35, 24, 14, 0.06); color: var(--ink); }
    .hint { color: var(--muted); font-size: 12px; }
    .section {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid rgba(234, 223, 205, 0.9);
      display: none;
    }
    .section.is-visible { display: block; }
    .section h2 {
      margin: 0 0 12px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .result-row { display: grid; gap: 8px; margin-bottom: 14px; }
    .result-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      font-size: 14px;
    }
    .result-label { font-weight: 700; }
    .result-track {
      width: 100%;
      height: 10px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(35, 24, 14, 0.08);
    }
    .result-fill {
      height: 100%;
      width: 0;
      border-radius: 999px;
      background: linear-gradient(90deg, #ff8000 0%, #ffad52 100%);
      transition: width .35s ease;
    }
    .empty { color: var(--muted); font-size: 14px; }
    @media (max-width: 640px) {
      body { padding: 10px; }
      .hero, .body { padding: 16px; }
      .option { grid-template-columns: auto 1fr; }
      .vote-count { grid-column: 1 / -1; margin-left: 36px; }
    }
    body[data-template="clean_white"] {
      padding: 0;
      background: #ffffff;
      color: #222222;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    }
    body[data-template="clean_white"] .card {
      max-width: none;
      margin: 0;
      border: none;
      border-radius: 0;
      box-shadow: none;
      background: #ffffff;
    }
    body[data-template="clean_white"] .hero {
      padding: 20px 16px 10px;
      border-bottom: none;
      background: #ffffff;
      text-align: center;
    }
    body[data-template="clean_white"] .eyebrow {
      display: none;
    }
    body[data-template="clean_white"] h1 {
      margin-bottom: 10px;
      color: #2b2b2b;
      font-size: clamp(24px, 4vw, 32px);
    }
    body[data-template="clean_white"] h1::after {
      content: "";
      display: block;
      width: 64px;
      height: 3px;
      margin: 10px auto 0;
      border-radius: 999px;
      background: var(--accent);
    }
    body[data-template="clean_white"] .subhead {
      text-align: center;
      font-size: 13px;
    }
    body[data-template="clean_white"] .body {
      padding: 0 16px 20px;
    }
    body[data-template="clean_white"] .option {
      border-radius: 10px;
      background: #ffffff;
      border-color: #ececec;
      box-shadow: none;
    }
    body[data-template="clean_white"] .option:hover {
      background: #faf7f3;
      border-color: rgba(255, 128, 0, 0.28);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
      transform: scale(1.005);
    }
    body[data-template="clean_white"] .option.is-selected {
      background: #fff7eb;
      border-color: rgba(255, 128, 0, 0.42);
    }
    body[data-template="clean_white"] .button-primary {
      width: 100%;
      border-radius: 10px;
    }
    body[data-template="clean_white"] .actions {
      display: block;
    }
    body[data-template="clean_white"] .hint {
      display: block;
      margin-top: 10px;
      text-align: center;
    }
    body[data-template="clean_white"] .section {
      margin-top: 18px;
      padding-top: 16px;
    }
  </style>
</head>
<body data-template="{$widgetTemplate}">
  <main class="card" data-placement="{$placement->public_id}">
    <header class="hero">
      <span class="eyebrow">Enquete TV VIP Social</span>
      <h1 id="poll-question">Carregando enquete...</h1>
      <p class="subhead" id="poll-subhead">Aguarde enquanto o widget prepara a sessao segura de voto.</p>
    </header>
    <section class="body">
      <div id="widget-message" class="message"></div>
      <div id="widget-options" class="stack" aria-live="polite"></div>
      <div id="widget-actions" class="actions">
        <button id="vote-button" class="button button-primary" type="button" disabled>Registrar voto</button>
        <span id="selection-hint" class="hint"></span>
      </div>
      <section id="results-section" class="section" aria-live="polite">
        <h2>Resultados</h2>
        <div id="results-content"></div>
      </section>
    </section>
  </main>
  <script>
    const EMBED_CONFIG = {$configJson};

    const state = {
      boot: null,
      sessionToken: null,
      selected: [],
      hasAcceptedVote: false,
      showingResultsOnly: false,
    };

    const questionEl = document.getElementById('poll-question');
    const subheadEl = document.getElementById('poll-subhead');
    const messageEl = document.getElementById('widget-message');
    const optionsEl = document.getElementById('widget-options');
    const actionsEl = document.getElementById('widget-actions');
    const voteButtonEl = document.getElementById('vote-button');
    const selectionHintEl = document.getElementById('selection-hint');
    const resultsSectionEl = document.getElementById('results-section');
    const resultsContentEl = document.getElementById('results-content');

    const storageKey = 'tvvip:enquetes:session:' + EMBED_CONFIG.placementPublicId;
    const afterVoteStorageKey = 'tvvip:enquetes:after-vote:' + EMBED_CONFIG.pollPublicId + ':' + EMBED_CONFIG.placementPublicId;

    function resizeHost() {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        420
      );

      window.parent.postMessage({
        type: 'tvvip-enquete:resize',
        placementPublicId: EMBED_CONFIG.placementPublicId,
        height: height + 8,
      }, '*');
    }

    function setMessage(text, variant) {
      if (!text) {
        messageEl.style.display = 'none';
        messageEl.className = 'message';
        messageEl.textContent = '';
        resizeHost();
        return;
      }

      messageEl.style.display = 'block';
      messageEl.className = 'message' + (variant ? ' ' + variant : '');
      messageEl.textContent = text;
      resizeHost();
    }

    function currentPollSettings() {
      if (!state.boot || !state.boot.poll) {
        return { widget_template: 'editorial_card', result_value_mode: 'both' };
      }

      const settings = state.boot.poll.settings || {};

      return {
        widget_template: settings.widget_template === 'clean_white' ? 'clean_white' : 'editorial_card',
        result_value_mode: ['percentage', 'votes', 'both'].indexOf(settings.result_value_mode) !== -1
          ? settings.result_value_mode
          : 'both',
      };
    }

    function formatPercentageValue(value) {
      return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + '%';
    }

    function formatVotesValue(value) {
      var votes = Number(value || 0);
      return votes + ' ' + (votes === 1 ? 'voto' : 'votos');
    }

    function formatResultValue(option) {
      var mode = currentPollSettings().result_value_mode;
      var votesText = formatVotesValue(option && option.votes);
      var percentageText = formatPercentageValue(option && option.percentage);

      if (mode === 'percentage') {
        return percentageText;
      }

      if (mode === 'votes') {
        return votesText;
      }

      return votesText + ' (' + percentageText + ')';
    }

    function setVotingVisibility(showVoting) {
      state.showingResultsOnly = !showVoting;
      optionsEl.style.display = showVoting ? '' : 'none';
      actionsEl.style.display = showVoting ? '' : 'none';

      if (!showVoting) {
        state.selected = [];
      }

      resizeHost();
    }

    function resolveAfterVoteCacheExpiry() {
      if (!state.boot || !state.boot.poll) {
        return null;
      }

      var poll = state.boot.poll;

      if (poll.vote_limit_mode === 'once_ever') {
        return null;
      }

      if (poll.vote_limit_mode === 'once_per_window') {
        var minutes = Number(poll.vote_cooldown_minutes || 0);
        if (minutes <= 0) {
          return null;
        }

        return new Date(Date.now() + minutes * 60000).toISOString();
      }

      if (poll.vote_limit_mode === 'once_per_day') {
        var expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);
        return expiresAt.toISOString();
      }

      return null;
    }

    function saveAfterVoteCache(results) {
      if (!state.boot || state.boot.poll.results_visibility !== 'after_vote' || !results) {
        return;
      }

      try {
        window.localStorage.setItem(afterVoteStorageKey, JSON.stringify({
          placement_public_id: EMBED_CONFIG.placementPublicId,
          poll_public_id: EMBED_CONFIG.pollPublicId,
          expires_at: resolveAfterVoteCacheExpiry(),
          saved_at: new Date().toISOString(),
          results: results,
        }));
      } catch (error) {
        // Cache local e opcional.
      }
    }

    function readAfterVoteCache() {
      try {
        var raw = window.localStorage.getItem(afterVoteStorageKey);
        if (!raw) {
          return null;
        }

        var parsed = JSON.parse(raw);
        if (!parsed || parsed.poll_public_id !== EMBED_CONFIG.pollPublicId || parsed.placement_public_id !== EMBED_CONFIG.placementPublicId) {
          window.localStorage.removeItem(afterVoteStorageKey);
          return null;
        }

        if (parsed.expires_at && new Date(parsed.expires_at).getTime() <= Date.now()) {
          window.localStorage.removeItem(afterVoteStorageKey);
          return null;
        }

        return parsed.results || null;
      } catch (error) {
        window.localStorage.removeItem(afterVoteStorageKey);
        return null;
      }
    }

    function buildFingerprint() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
        const screenSize = window.screen ? [window.screen.width, window.screen.height].join('x') : 'na';
        return [navigator.userAgent, navigator.language, timezone, screenSize].join('||');
      } catch (error) {
        return null;
      }
    }

    async function request(url, options) {
      const response = await fetch(url, Object.assign({
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }, options || {}));

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success === false) {
        const error = new Error(payload.message || 'Falha ao carregar enquete.');
        error.payload = payload;
        error.status = response.status;
        throw error;
      }

      return payload.data;
    }

    async function trackEvent(eventType, extra) {
      if (!state.boot) return;

      try {
        await request(EMBED_CONFIG.eventsUrl, {
          method: 'POST',
          body: JSON.stringify({
            placement_public_id: EMBED_CONFIG.placementPublicId,
            session_token: state.sessionToken,
            event_type: eventType,
            option_public_id: extra && extra.optionPublicId ? extra.optionPublicId : null,
            meta: extra && extra.meta ? extra.meta : {},
          }),
        });
      } catch (error) {
        // Eventos nao devem quebrar a experiencia do widget.
      }
    }

    async function ensureSession() {
      const remembered = window.localStorage.getItem(storageKey);
      const sessionData = await request(EMBED_CONFIG.sessionUrl, {
        method: 'POST',
        body: JSON.stringify({
          placement_public_id: EMBED_CONFIG.placementPublicId,
          session_token: remembered || null,
          fingerprint: buildFingerprint(),
          meta: { embed: true, source: 'iframe' },
        }),
      });

      state.sessionToken = sessionData.session.session_token;
      window.localStorage.setItem(storageKey, state.sessionToken);
    }

    function leaderMeta(results) {
      const options = (results && results.options) || [];
      const maxVotes = Math.max(0, ...options.map((option) => option.votes || 0));

      if (maxVotes <= 0) {
        return { leaderIds: new Set(), hasTie: false };
      }

      const leaders = options.filter((option) => (option.votes || 0) === maxVotes);

      return {
        leaderIds: new Set(leaders.map((option) => option.option_id)),
        hasTie: leaders.length > 1,
      };
    }

    function renderResults(results) {
      const options = (results && results.options) || [];
      const totalVotes = results && typeof results.total_votes === 'number' ? results.total_votes : 0;

      resultsSectionEl.classList.add('is-visible');

      if (options.length === 0 || totalVotes === 0) {
        resultsContentEl.innerHTML = '<p class="empty">Ainda nao existem votos validos para esta enquete.</p>';
        resizeHost();
        return;
      }

      const meta = leaderMeta(results);

      resultsContentEl.innerHTML = options.map((option) => {
        const badge = meta.leaderIds.has(option.option_id)
          ? '<span style="margin-left:8px;padding:4px 8px;border-radius:999px;background:rgba(255,128,0,0.14);color:#8a4d00;font-size:11px;font-weight:700;">' + (meta.hasTie ? 'Empate' : 'Lider') + '</span>'
          : '';

        return '<div class="result-row">'
          + '<div class="result-head"><div><span class="result-label">' + option.label + '</span>' + badge + '</div><div>' + formatResultValue(option) + '</div></div>'
          + '<div class="result-track"><div class="result-fill" style="width:' + Number(option.percentage || 0) + '%"></div></div>'
          + '</div>';
      }).join('');

      resizeHost();
    }

    function shouldShowResultsOnLoad() {
      if (!state.boot) return false;

      const poll = state.boot.poll;
      const widgetState = state.boot.state;

      if (widgetState === 'ended_hide') {
        return false;
      }

      if (poll.results_visibility === 'live') {
        return true;
      }

      return poll.results_visibility === 'after_end' && String(widgetState).indexOf('ended_') === 0;
    }

    function renderStaticStateMessage(widgetState) {
      const messages = {
        not_started: 'Esta enquete ainda nao foi iniciada.',
        paused: 'Esta enquete esta temporariamente pausada.',
        ended_closed_message: 'Esta enquete foi encerrada.',
        ended_hide: 'Esta enquete nao esta mais disponivel.',
      };

      if (messages[widgetState]) {
        setMessage(messages[widgetState], widgetState === 'ended_hide' ? 'error' : '');
        voteButtonEl.disabled = true;
      }
    }

    function selectionLimitText() {
      if (!state.boot) return '';

      const poll = state.boot.poll;
      if (poll.selection_type === 'multiple' && poll.max_choices) {
        return 'Escolha ate ' + poll.max_choices + ' opcoes.';
      }

      return 'Escolha uma opcao.';
    }

    function isSelected(optionPublicId) {
      return state.selected.indexOf(optionPublicId) !== -1;
    }

    function renderOptions() {
      if (!state.boot) return;
      if (state.showingResultsOnly) {
        optionsEl.innerHTML = '';
        voteButtonEl.disabled = true;
        return;
      }

      const poll = state.boot.poll;
      const options = poll.options || [];
      const isVotingOpen = state.boot.state === 'accepting_votes';
      const multiple = poll.selection_type === 'multiple';

      selectionHintEl.textContent = selectionLimitText();

      optionsEl.innerHTML = options.map((option) => {
        const selected = isSelected(option.public_id);
        const description = option.description ? '<div class="option-description">' + option.description + '</div>' : '';
        const image = option.image_thumb_url || option.image_url
          ? '<img class="option-thumb" src="' + (option.image_thumb_url || option.image_url) + '" alt="' + option.label + '" loading="lazy">'
          : '';

        return '<button type="button" class="option' + (selected ? ' is-selected' : '') + '" data-option="' + option.public_id + '" ' + (isVotingOpen ? '' : 'disabled') + '>'
          + '<span class="option-marker"></span>'
          + '<div class="option-copy">'
          + image
          + '<div class="option-text"><span class="option-title">' + option.label + '</span>'
          + description + '</div>'
          + '</div>'
          + '<span class="vote-count">' + (multiple ? 'Multipla escolha' : 'Escolha unica') + '</span>'
          + '</button>';
      }).join('');

      optionsEl.querySelectorAll('[data-option]').forEach((button) => {
        button.addEventListener('click', async function () {
          const optionPublicId = this.getAttribute('data-option');
          if (!optionPublicId || !state.boot || state.boot.state !== 'accepting_votes') {
            return;
          }

          if (state.boot.poll.selection_type === 'single') {
            state.selected = [optionPublicId];
          } else if (isSelected(optionPublicId)) {
            state.selected = state.selected.filter((item) => item !== optionPublicId);
          } else {
            const maxChoices = Number(state.boot.poll.max_choices || 0);
            if (maxChoices > 0 && state.selected.length >= maxChoices) {
              setMessage('Voce pode selecionar no maximo ' + maxChoices + ' opcoes.', 'error');
              return;
            }

            state.selected = state.selected.concat(optionPublicId);
          }

          setMessage('', '');
          voteButtonEl.disabled = state.selected.length === 0;
          renderOptions();
          await trackEvent('option_selected', { optionPublicId: optionPublicId });
        });
      });

      voteButtonEl.disabled = !isVotingOpen || state.selected.length === 0;
      resizeHost();
    }

    async function loadResultsIfAllowed() {
      if (!shouldShowResultsOnLoad()) {
        resultsSectionEl.classList.remove('is-visible');
        resultsContentEl.innerHTML = '';
        resizeHost();
        return;
      }

      const results = await request(EMBED_CONFIG.resultsUrl);
      renderResults(results);
      await trackEvent('results_viewed', { meta: { source: 'auto' } });
    }

    function showResultsOnly(results, message, variant, persist) {
      if (persist && results) {
        saveAfterVoteCache(results);
      }

      setVotingVisibility(false);

      if (message) {
        setMessage(message, variant || '');
      }

      renderResults(results);
    }

    async function restoreAfterVoteResultsIfNeeded() {
      if (!state.boot || state.boot.poll.results_visibility !== 'after_vote') {
        return false;
      }

      var cachedResults = readAfterVoteCache();
      if (!cachedResults) {
        return false;
      }

      showResultsOnly(
        cachedResults,
        'Seu voto ja foi registrado neste navegador. Exibindo o resultado salvo.',
        'success',
        false
      );
      await trackEvent('results_viewed', { meta: { source: 'cached_after_vote' } });

      return true;
    }

    async function submitVote() {
      if (!state.boot || state.selected.length === 0) {
        return;
      }

      voteButtonEl.disabled = true;
      setMessage('', '');

      try {
        await trackEvent('vote_clicked', { meta: { selected: state.selected } });

        const response = await request(EMBED_CONFIG.voteUrl, {
          method: 'POST',
          body: JSON.stringify({
            placement_public_id: EMBED_CONFIG.placementPublicId,
            session_token: state.sessionToken,
            fingerprint: buildFingerprint(),
            option_public_ids: state.selected,
            meta: { source: 'iframe' },
          }),
        });

        state.hasAcceptedVote = true;
        setMessage(response.message || 'Voto registrado com sucesso.', 'success');

        if (response.results_available && response.results) {
          if (state.boot.poll.results_visibility === 'after_vote') {
            showResultsOnly(response.results, response.message || 'Voto registrado com sucesso.', 'success', true);
          } else {
            renderResults(response.results);
          }
          await trackEvent('results_viewed', { meta: { source: 'after_vote' } });
        }
      } catch (error) {
        var blockedPayload = error && error.payload && error.payload.data ? error.payload.data : null;
        if (blockedPayload && blockedPayload.results_available && blockedPayload.results) {
          showResultsOnly(
            blockedPayload.results,
            blockedPayload.message || 'Voce ja votou nesta enquete.',
            'success',
            true
          );
          await trackEvent('results_viewed', { meta: { source: 'blocked_after_vote' } });
          return;
        }

        const message = error && error.message ? error.message : 'Falha ao registrar voto.';
        setMessage(message, 'error');
      } finally {
        voteButtonEl.disabled = state.showingResultsOnly || state.selected.length === 0;
      }
    }

    async function init() {
      try {
        state.boot = await request(EMBED_CONFIG.bootUrl);
        questionEl.textContent = state.boot.poll.question || 'Enquete';
        subheadEl.textContent = state.boot.placement.article_title
          ? state.boot.placement.article_title
          : 'Vote e acompanhe o resultado em tempo real.';

        await ensureSession();
        renderStaticStateMessage(state.boot.state);
        renderOptions();
        await trackEvent('widget_loaded', { meta: { state: state.boot.state } });
        window.setTimeout(function () {
          trackEvent('widget_visible', { meta: { state: state.boot.state } });
        }, 250);
        if (await restoreAfterVoteResultsIfNeeded()) {
          return;
        }
        await loadResultsIfAllowed();
      } catch (error) {
        questionEl.textContent = 'Enquete indisponivel';
        subheadEl.textContent = 'Nao foi possivel carregar o widget.';
        optionsEl.innerHTML = '';
        voteButtonEl.disabled = true;
        setMessage(error && error.message ? error.message : 'Falha ao carregar a enquete.', 'error');
      }

      resizeHost();
    }

    voteButtonEl.addEventListener('click', submitVote);

    if ('ResizeObserver' in window) {
      new ResizeObserver(resizeHost).observe(document.body);
    }

    window.addEventListener('load', resizeHost);
    window.addEventListener('message', function (event) {
      if (event && event.data && event.data.type === 'tvvip-enquete:host-ready') {
        resizeHost();
      }
    });

    init();
  </script>
</body>
</html>
HTML;

        return $this->embedResponse($html, 'text/html; charset=UTF-8');
    }

    public function loader(string $placementPublicId): Response
    {
        PollPlacement::query()
            ->where('public_id', $placementPublicId)
            ->where('is_active', true)
            ->firstOrFail();

        $iframeUrl = route('enquetes.embed.show', ['placementPublicId' => $placementPublicId]);
        $script = <<<JAVASCRIPT
(function () {
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    currentScript = scripts[scripts.length - 1];
  }

  var placementPublicId = {$this->jsonLiteral($placementPublicId)};
  var iframeUrl = {$this->jsonLiteral($iframeUrl)};
  var minHeight = parseInt(currentScript.getAttribute('data-min-height') || '640', 10);
  var maxWidth = currentScript.getAttribute('data-max-width') || '720px';
  var targetSelector = currentScript.getAttribute('data-target');
  var host = targetSelector ? document.querySelector(targetSelector) : null;

  if (!host) {
    host = document.createElement('div');
    currentScript.parentNode.insertBefore(host, currentScript.nextSibling);
  }

  var wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = maxWidth;
  wrapper.style.margin = '0 auto';
  wrapper.style.overflow = 'hidden';

  var iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.loading = 'lazy';
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.style.width = '100%';
  iframe.style.height = minHeight + 'px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';
  iframe.style.background = 'transparent';

  wrapper.appendChild(iframe);
  host.appendChild(wrapper);

  function onMessage(event) {
    if (!event || !event.data || event.data.type !== 'tvvip-enquete:resize') {
      return;
    }

    if (event.data.placementPublicId !== placementPublicId) {
      return;
    }

    if (event.source !== iframe.contentWindow) {
      return;
    }

    var nextHeight = parseInt(event.data.height, 10);
    if (!isNaN(nextHeight)) {
      iframe.style.height = Math.max(nextHeight, minHeight) + 'px';
    }
  }

  window.addEventListener('message', onMessage, false);
})();
JAVASCRIPT;

        return $this->embedResponse($script, 'application/javascript; charset=UTF-8');
    }

    private function jsonLiteral(string $value): string
    {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '""';
    }

    private function embedResponse(string $content, string $contentType): Response
    {
        $response = response($content, 200, ['Content-Type' => $contentType]);
        $frameAncestors = trim((string) config('enquetes.embed.frame_ancestors', ''));

        $response->headers->remove('X-Frame-Options');
        $response->headers->set('Content-Security-Policy', $this->embedCsp($frameAncestors));
        $response->headers->set('Cross-Origin-Resource-Policy', 'cross-origin');

        return $response;
    }

    private function embedCsp(string $frameAncestors): string
    {
        $allowed = $frameAncestors !== '' ? $frameAncestors : '*';

        return "frame-ancestors {$allowed}; default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;";
    }
}
