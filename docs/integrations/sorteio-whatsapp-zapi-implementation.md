# Sorteio WhatsApp Z-API - Plano de Implementacao

Data: 2026-06-12
Status: planejamento tecnico revisado com TDD, testes reais opt-in e melhorias de UI.

## 1) Objetivo

Criar o `Sortear do Grupo` como uma tela fullscreen em:

```txt
https://adm.tvvip.social/engajamento/sorteador
```

O item deve aparecer no menu lateral dentro de `Engajamento`, mas o clique deve abrir uma nova guia. A nova guia deve carregar a tela do sorteador sem menu lateral, topbar, bottom nav, FAB ou `AppShell`.

Fluxo alvo:

1. Usuario autenticado clica em `Engajamento > Sortear do Grupo` no menu lateral.
2. O link abre `/engajamento/sorteador` em nova guia.
3. A tela fullscreen mostra o botao grande `SORTEAR`.
4. Ao clicar, o frontend chama o backend imediatamente e inicia a animacao em paralelo.
5. O backend consulta o grupo na Z-API pela mesma instancia ja configurada.
6. O backend filtra participantes, sorteia, busca foto somente do vencedor e salva auditoria.
7. O frontend segura a revelacao ate completar o tempo minimo de animacao.
8. A tela mostra foto opcional, `Parabens!`, telefone final mascarado e codigo de confirmacao.
9. Um botao pequeno permite revelar o telefone completo por endpoint separado, permissionado e auditado.
10. Depois da revelacao, a UI mostra `Copiar telefone`.

## 2) Validacao em docs oficiais e stack atual

Docs oficiais consultadas:

- Z-API `light-group-metadata`: `https://developer.z-api.io/en/group/light-group-metadata`
- Z-API `group-metadata`: `https://developer.z-api.io/en/group/metadata-group`
- Z-API `profile-picture`: `https://developer.z-api.io/en/contacts/get-profile-picture`
- Laravel 12 HTTP client testing: `https://laravel.com/docs/12.x/http-client#testing`
- Laravel 12 preventing stray requests: `https://laravel.com/docs/12.x/http-client#preventing-stray-requests`
- Laravel 12 encrypted casts: `https://laravel.com/docs/12.x/eloquent-mutators#encrypted-casting`
- Laravel 12 atomic locks: `https://laravel.com/docs/12.x/cache#atomic-locks`
- Laravel 12 authorization middleware: `https://laravel.com/docs/12.x/authorization#via-middleware`
- PHPUnit 11.5 attributes/groups: `https://docs.phpunit.de/en/11.5/attributes.html`
- PHP `random_int`: `https://www.php.net/manual/en/function.random-int.php`
- React Router `Link`: `https://reactrouter.com/api/components/Link`
- Vitest fake timers: `https://vitest.dev/guide/mocking/timers`
- Motion accessibility: `https://motion.dev/docs/react-accessibility`

Stack atual validada no repo:

- Backend: Laravel 12, Sanctum, Spatie Permission, Pest 3 e PHPUnit 11.5.
- Frontend: React 18, React Router `6.30.1`, TanStack Query, shadcn/ui, Tailwind e Vitest.
- Animacao: `framer-motion` ja existe em `apps/web/package.json`; nao precisa dependencia nova.
- Client HTTP frontend: `apps/web/src/services/api.ts`.
- Layout admin: `AppShell` injeta sidebar/topbar/mobile nav/FAB; a pagina fullscreen nao deve usa-lo.
- Menu lateral: `DesktopSidebar.tsx` e `MobileNav.tsx` tem listas locais de navegacao.
- Z-API: `WhatsAppService` ja tem `lightGroupMetadata($groupId)` e `ZApiClient` ja usa `ZAPI_*`.
- Testes backend atuais ja usam `Http::fake()`, `Http::assertSent()` e `Sanctum::actingAs()`.
- `apps/api/phpunit.xml` usa sqlite em memoria no ambiente de teste, `CACHE_STORE=array` e `QUEUE_CONNECTION=sync`.

Conclusoes da validacao:

1. Usar `light-group-metadata`, porque a Z-API informa que ele retorna participantes sem buscar link de convite.
2. Usar `profile-picture?phone=...` somente para o vencedor, com telefone validado.
3. Nunca chamar `profile-picture` com telefone vazio, porque o provider pode responder erro 500.
4. Usar `random_int` para sorteio, pois o PHP documenta resultado uniforme e criptograficamente seguro.
5. Usar `Cache::lock()` para impedir sorteios concorrentes por grupo/campanha.
6. Usar `Http::fake()` e `Http::preventStrayRequests()` nos testes automatizados que nao sao reais.
7. Usar grupos do PHPUnit/Pest para isolar testes reais da Z-API, nunca rodando por padrao no CI.
8. Usar permissao separada para visualizar, sortear, revelar telefone e consultar historico.
9. Usar encrypted cast do Laravel para armazenar o telefone completo recuperavel, com coluna `TEXT`.
10. Abrir nova guia com link normal/React Router `Link` usando `target="_blank"` e `rel="noopener noreferrer"`.
11. A rota `/engajamento/sorteador` deve ser protegida por auth, mas renderizada sem `AppShell`.
12. Testar a maquina de animacao com fake timers do Vitest.

## 3) Arquitetura de alto nivel

O fluxo deve ser:

```txt
Sortear -> backend define vencedor -> frontend anima expectativa -> frontend revela resultado seguro -> usuario pode revelar telefone completo
```

O frontend nao deve sortear visualmente. Ele so anima. O vencedor real sempre vem do backend.

Isso evita tres problemas:

- a animacao parecer escolher um participante diferente do resultado real;
- o telefone completo ficar disponivel no navegador antes da acao de revelacao;
- falta de trilha de auditoria para quem revelou o telefone.

## 4) Backend proposto

### Endpoints

```txt
POST /api/v1/whatsapp/raffle/draw
POST /api/v1/whatsapp/raffle/draws/{draw}/reveal-phone
GET  /api/v1/whatsapp/raffle/draws
```

`GET /draws` e opcional no MVP visual, mas recomendado para auditoria e historico.

### Permissoes

Criar permissoes explicitas no `RoleAndPermissionSeeder`:

```txt
whatsapp.raffle.view
whatsapp.raffle.draw
whatsapp.raffle.reveal-phone
whatsapp.raffle.history
```

Nao reaproveitar `whatsapp.publish`, porque visualizar a tela, sortear, revelar telefone e publicar/enviar mensagem sao acoes distintas.

Rotas recomendadas:

```php
Route::get('/raffle/draws', [WhatsAppRaffleController::class, 'index'])
    ->middleware(['auth:sanctum', 'can:whatsapp.raffle.history']);

Route::post('/raffle/draw', [WhatsAppRaffleController::class, 'draw'])
    ->middleware(['auth:sanctum', 'can:whatsapp.raffle.draw', 'throttle:raffle']);

Route::post('/raffle/draws/{draw}/reveal-phone', [WhatsAppRaffleController::class, 'revealPhone'])
    ->middleware(['auth:sanctum', 'can:whatsapp.raffle.reveal-phone', 'throttle:raffle-reveal']);
```

Obs.: dentro de `apps/api/app/Modules/WhatsApp/routes.php`, essas rotas entram no grupo `prefix('whatsapp')`, portanto o path final fica `/api/v1/whatsapp/raffle/...`.

### Configuracao

Adicionar em `apps/api/config/whatsapp.php`:

```php
'raffle' => [
    'group_id' => env('WHATSAPP_RAFFLE_GROUP_ID', ''),
    'campaign_name' => env('WHATSAPP_RAFFLE_CAMPAIGN_NAME', 'SORTEIO VIP | Camisa do Brasil'),
    'campaign_key' => env('WHATSAPP_RAFFLE_CAMPAIGN_KEY', 'camisa-brasil'),
    'exclude_admins' => filter_var(env('WHATSAPP_RAFFLE_EXCLUDE_ADMINS', true), FILTER_VALIDATE_BOOLEAN),
    'excluded_phones' => array_values(array_filter(array_map(
        static fn (string $phone): string => preg_replace('/\D+/', '', trim($phone)) ?: '',
        explode(',', (string) env('WHATSAPP_RAFFLE_EXCLUDED_PHONES', ''))
    ))),
    'phone_last_digits' => max(4, (int) env('WHATSAPP_RAFFLE_PHONE_LAST_DIGITS', 5)),
    'allow_phone_reveal' => filter_var(env('WHATSAPP_RAFFLE_ALLOW_PHONE_REVEAL', true), FILTER_VALIDATE_BOOLEAN),
    'lock_ttl_seconds' => max(5, (int) env('WHATSAPP_RAFFLE_LOCK_TTL_SECONDS', 10)),
],
```

Adicionar em `apps/api/.env.example`:

```env
WHATSAPP_RAFFLE_GROUP_ID=120363407637460643-group
WHATSAPP_RAFFLE_CAMPAIGN_NAME="SORTEIO VIP | Camisa do Brasil | Copa 2026"
WHATSAPP_RAFFLE_CAMPAIGN_KEY=camisa-brasil-copa-2026
WHATSAPP_RAFFLE_EXCLUDE_ADMINS=true
WHATSAPP_RAFFLE_EXCLUDED_PHONES=554896553954
WHATSAPP_RAFFLE_PHONE_LAST_DIGITS=5
WHATSAPP_RAFFLE_ALLOW_PHONE_REVEAL=true
WHATSAPP_RAFFLE_LOCK_TTL_SECONDS=10
```

Nao adicionar tempo de animacao no backend. Esse valor e comportamento visual e deve ficar no frontend.

### Arquivos backend

Novos:

- `apps/api/app/Modules/WhatsApp/Actions/DrawWhatsAppRaffleAction.php`
- `apps/api/app/Modules/WhatsApp/Actions/RevealWhatsAppRafflePhoneAction.php`
- `apps/api/app/Modules/WhatsApp/Http/Controllers/WhatsAppRaffleController.php`
- `apps/api/app/Modules/WhatsApp/Http/Requests/DrawWhatsAppRaffleRequest.php`
- `apps/api/app/Modules/WhatsApp/Http/Requests/RevealWhatsAppRafflePhoneRequest.php`
- `apps/api/app/Modules/WhatsApp/Models/WhatsAppRaffleDraw.php`
- `apps/api/app/Modules/WhatsApp/Models/WhatsAppRafflePhoneReveal.php`
- `apps/api/database/migrations/{timestamp}_create_whatsapp_raffle_draws_table.php`
- `apps/api/database/migrations/{timestamp}_create_whatsapp_raffle_phone_reveals_table.php`

Alterados:

- `apps/api/app/Modules/WhatsApp/Services/WhatsAppService.php`
- `apps/api/app/Modules/WhatsApp/routes.php`
- `apps/api/config/whatsapp.php`
- `apps/api/.env.example`
- `apps/api/database/seeders/RoleAndPermissionSeeder.php`

### Service Z-API

Reaproveitar `WhatsAppService` e adicionar:

```php
public function profilePicture(string $phone): array
{
    $normalizedPhone = preg_replace('/\D+/', '', $phone) ?: '';

    if ($normalizedPhone === '') {
        throw new InvalidArgumentException('Phone is required to fetch profile picture.');
    }

    return $this->client->get('profile-picture', ['phone' => $normalizedPhone]);
}
```

O retorno sem foto deve ser tratado como ausencia de foto quando vier:

```json
{
  "link": "null",
  "errorMessage": "item-not-found"
}
```

### Regra de sorteio

`DrawWhatsAppRaffleAction`:

1. Resolver `group_id`, `campaign_name` e `campaign_key` pela config ou request validado.
2. Adquirir lock por grupo/campanha:

```php
Cache::lock("whatsapp-raffle:draw:{$groupId}:{$campaignKey}", $ttl)->block(3, function () {
    // executa sorteio
});
```

3. Buscar participantes via `WhatsAppService::lightGroupMetadata($groupId)`.
4. Normalizar telefones para digitos.
5. Remover telefones invalidos.
6. Remover owner.
7. Remover `WHATSAPP_RAFFLE_EXCLUDED_PHONES`.
8. Remover admins/super admins quando `exclude_admins=true`.
9. Deduplicar por telefone normalizado.
10. Se nao houver elegiveis, retornar erro controlado.
11. Sortear com `random_int(0, $eligible->count() - 1)`.
12. Buscar foto somente do vencedor.
13. Salvar auditoria com telefone hash e telefone criptografado.
14. Gerar `confirmation_code` curto.
15. Retornar somente payload seguro.

Nao refazer sorteio quando o vencedor nao tiver foto.

### Response de sorteio

```json
{
  "success": true,
  "data": {
    "draw_id": "01J...",
    "confirmation_code": "BR-8F42",
    "group_id": "120363407637460643-group",
    "group_name": "SORTEIO VIP | Camisa do Brasil",
    "campaign_name": "SORTEIO VIP | Camisa do Brasil | Copa 2026",
    "campaign_key": "camisa-brasil-copa-2026",
    "phone_masked": "****68144",
    "phone_last_digits": "68144",
    "photo_url": "https://...",
    "eligible_participants_count": 120,
    "can_reveal_phone": true,
    "drawn_at": "2026-06-12T16:00:00Z"
  },
  "message": "Sorteio realizado com sucesso"
}
```

Esse endpoint nunca retorna `phone_full`.

### Response de revelacao

```json
{
  "success": true,
  "data": {
    "draw_id": "01J...",
    "confirmation_code": "BR-8F42",
    "phone_full": "554791568144",
    "phone_formatted": "+55 47 91568-144",
    "revealed_at": "2026-06-12T16:01:12Z"
  },
  "message": "Telefone revelado com sucesso"
}
```

Se `WHATSAPP_RAFFLE_ALLOW_PHONE_REVEAL=false`, retornar erro controlado:

```json
{
  "success": false,
  "message": "Revelacao de telefone desabilitada",
  "code": "WHATSAPP_RAFFLE_REVEAL_DISABLED"
}
```

Se existir sorteio concorrente:

```json
{
  "success": false,
  "message": "Ja existe um sorteio em andamento.",
  "code": "WHATSAPP_RAFFLE_LOCKED"
}
```

Se nao houver participante elegivel:

```json
{
  "success": false,
  "message": "Nenhum participante elegivel encontrado.",
  "code": "WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS"
}
```

### Banco de dados

Tabela `whatsapp_raffle_draws`:

- `id` ULID primary.
- `confirmation_code` string(20), index.
- `group_id` string(80), index.
- `group_subject` string(255) nullable.
- `campaign_name` string(255) nullable.
- `campaign_key` string(120), index.
- `eligible_participants_count` unsigned integer.
- `winner_phone_hash` string(64).
- `winner_phone_encrypted` text.
- `phone_last_digits` string(10).
- `winner_had_photo` boolean.
- `photo_url` text nullable.
- `drawn_by` foreignId users nullable.
- `drawn_at` timestamp.
- `provider` string(50) default `zapi`.
- `provider_payload_hash` string(64) nullable.
- `reveal_count` unsigned integer default 0.
- `last_revealed_at` timestamp nullable.
- timestamps.

Model:

```php
protected function casts(): array
{
    return [
        'winner_phone_encrypted' => 'encrypted',
        'winner_had_photo' => 'boolean',
        'drawn_at' => 'datetime',
        'last_revealed_at' => 'datetime',
    ];
}
```

Tabela `whatsapp_raffle_phone_reveals`:

- `id` ULID primary.
- `draw_id` foreign ULID para `whatsapp_raffle_draws`.
- `revealed_by` foreignId users nullable.
- `revealed_at` timestamp.
- `ip_address` string(45) nullable.
- `user_agent` text nullable.
- timestamps.

Hash:

```php
hash_hmac('sha256', $winnerPhone, config('app.key'))
```

## 5) Frontend proposto

### Rota e layout

Criar a rota:

```txt
/engajamento/sorteador
```

No `App.tsx`:

```tsx
const EngajamentoSorteador = lazy(() => import("./pages/engajamento/Sorteador"));

<Route element={<ProtectedRoute />}>
  <Route path="/engajamento/sorteador" element={<EngajamentoSorteador />} />
</Route>
```

A pagina `Sorteador.tsx` nao deve usar `AppShell`. Ela deve renderizar layout proprio fullscreen:

```tsx
export default function Sorteador() {
  return <RaffleFullscreenShell />;
}
```

Se a tela precisar ficar totalmente limpa, tambem ajustar `RouteAwareOfflineIndicator` para nao renderizar o indicador em `/engajamento/sorteador`.

### Menu lateral

Adicionar `Sortear do Grupo` dentro de `Engajamento`, nao em `Alertas WhatsApp`.

Desktop:

- Arquivo: `apps/web/src/components/layout/DesktopSidebar.tsx`
- Importar icone, por exemplo `Shuffle` ou `Gift`.
- Estender `MenuItem` com `openInNewTab?: boolean`.
- Adicionar child com `requiredPermission: "whatsapp.raffle.view"`:

```ts
{
  icon: Shuffle,
  label: "Sortear do Grupo",
  path: "/engajamento/sorteador",
  requiredPermission: "whatsapp.raffle.view",
  openInNewTab: true,
}
```

- Ao renderizar `PrefetchLink`, passar:

```tsx
target={child.openInNewTab ? "_blank" : undefined}
rel={child.openInNewTab ? "noopener noreferrer" : undefined}
```

Mobile:

- Arquivo: `apps/web/src/components/layout/MobileNav.tsx`
- Estender child com `openInNewTab?: boolean`.
- Adicionar `Sortear do Grupo` dentro de `Engajamento`.
- Renderizar `Link` com `target` e `rel` quando `openInNewTab=true`.
- Fechar o sheet no clique.

Motivo: `PrefetchLink` repassa props de `LinkProps`, e React Router `Link` e um wrapper de `<a>`, entao atributos de link como `target`/`rel` sao compativeis.

### Estrutura frontend

Novos:

```txt
apps/web/src/features/whatsapp-raffle/
  api/
    whatsappRaffle.service.ts
    whatsappRaffle.service.test.ts
  hooks/
    useWhatsAppRaffleDraw.ts
    useRevealWhatsAppRafflePhone.ts
    useRaffleAnimationMachine.ts
    useRaffleAnimationMachine.test.ts
  types/
    index.ts
  components/
    RaffleFullscreenShell.tsx
    RaffleDrawPanel.tsx
    RaffleDrawPanel.test.tsx
    BigDrawButton.tsx
    RaffleStage.tsx
    RaffleSpinAnimation.tsx
    FakePhoneTicker.tsx
    WinnerRevealCard.tsx
    WinnerPhoto.tsx
    RevealPhoneButton.tsx
    RaffleErrorState.tsx
    RaffleEmptyState.tsx
    RaffleConfetti.tsx
  utils/
    formatPhone.ts
    generateFakePhoneEndings.ts
    raffleTiming.ts
```

Alterados:

- `apps/web/src/App.tsx`
- `apps/web/src/components/layout/DesktopSidebar.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`
- `apps/web/src/pages/engajamento/Sorteador.tsx`

### API frontend

Types:

```ts
export type RaffleUiState =
  | "idle"
  | "requesting"
  | "preparing"
  | "shuffling"
  | "slowing-down"
  | "revealing-winner"
  | "success"
  | "revealing-phone"
  | "phone-revealed"
  | "error"
  | "empty";

export interface WhatsAppRaffleResult {
  draw_id: string;
  confirmation_code: string;
  group_id: string;
  group_name: string | null;
  campaign_name: string | null;
  campaign_key: string;
  phone_masked: string;
  phone_last_digits: string;
  photo_url: string | null;
  eligible_participants_count: number;
  can_reveal_phone: boolean;
  drawn_at: string;
}

export interface WhatsAppRaffleRevealPhoneResult {
  draw_id: string;
  confirmation_code: string;
  phone_full: string;
  phone_formatted: string;
  revealed_at: string;
}
```

Service:

```ts
const ENDPOINT = "/whatsapp/raffle";

draw(): Promise<ApiEnvelope<WhatsAppRaffleResult>> {
  return api.post(`${ENDPOINT}/draw`);
}

revealPhone(drawId: string): Promise<ApiEnvelope<WhatsAppRaffleRevealPhoneResult>> {
  return api.post(`${ENDPOINT}/draws/${drawId}/reveal-phone`);
}
```

Hooks:

- `useWhatsAppRaffleDraw()`
- `useRevealWhatsAppRafflePhone()`
- `useRaffleAnimationMachine()`

### Maquina visual de fases

Tempos:

```ts
export const RAFFLE_TIMING = {
  preparingAtMs: 150,
  shufflingAtMs: 600,
  slowingDownAtMs: 2200,
  revealAtMs: 3200,
  revealWinnerMs: 500,
  minTotalMs: 3200,
} as const;
```

Sequencia:

```txt
idle
requesting + preparing
shuffling
slowing-down
revealing-winner
success
revealing-phone
phone-revealed
```

Regra principal:

- O backend e chamado imediatamente no clique.
- A animacao roda em paralelo.
- Se o backend responder antes de `minTotalMs`, a UI aguarda.
- Se o backend demorar mais que `minTotalMs`, a UI revela assim que o backend responder.
- Se o backend falhar, a UI vai para `error`.
- Se o backend retornar `WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS`, a UI vai para `empty`.
- Timers devem ser limpos no unmount.
- Duplo clique deve ser bloqueado enquanto o estado estiver em request/animacao.

Hook recomendado:

```ts
export function useRaffleAnimationMachine() {
  const [state, setState] = useState<RaffleUiState>("idle");
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((delay: number, nextState: RaffleUiState) => {
    const timer = window.setTimeout(() => setState(nextState), delay);
    timersRef.current.push(timer);
  }, []);

  const playDrawAnimation = useCallback(async <T,>(request: Promise<T>): Promise<T> => {
    clearTimers();
    setState("requesting");

    const startedAt = Date.now();

    schedule(RAFFLE_TIMING.preparingAtMs, "preparing");
    schedule(RAFFLE_TIMING.shufflingAtMs, "shuffling");
    schedule(RAFFLE_TIMING.slowingDownAtMs, "slowing-down");

    try {
      const result = await request;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(RAFFLE_TIMING.minTotalMs - elapsed, 0);

      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, remaining);
        timersRef.current.push(timer);
      });

      setState("revealing-winner");

      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, RAFFLE_TIMING.revealWinnerMs);
        timersRef.current.push(timer);
      });

      setState("success");

      return result;
    } catch (error) {
      setState("error");
      throw error;
    }
  }, [clearTimers, schedule]);

  useEffect(() => clearTimers, [clearTimers]);

  return { state, setState, playDrawAnimation };
}
```

### Visual e UX

Tela inicial:

- Titulo: `Sorteador do Grupo`
- Subtitulo: `Clique para sortear um participante do grupo VIP`
- Botao: `SORTEAR`
- Texto pequeno: `Sorteio seguro e auditado`

Durante o sorteio:

- Fundo fullscreen dark com gradiente laranja `#ff8000`.
- Botao `SORTEAR` gigante com pulse glow.
- Ao clicar, botao vira uma maquina visual de sorteio.
- Cards/finais ficticios passam rapidamente.
- Movimento desacelera.
- Tela da flash laranja.
- Confetes simples.
- Foto aparece com zoom/fade, somente se existir.
- Texto `Parabens!` entra com destaque.
- Telefone final aparece por ultimo.

Textos por fase:

- `Buscando participantes...`
- `Misturando a sorte...`
- `Quase la...`
- `Preparando o vencedor...`

Resultado:

- Foto opcional central.
- `Parabens!`
- `Telefone final 68144`
- `Sorteado entre 120 participantes`
- `Codigo do sorteio: BR-8F42`
- Botao pequeno: `Revelar telefone completo`
- Aviso: `A revelacao sera registrada para auditoria.`

Se nao tiver foto, nao mostrar placeholder obrigatorio. Aumentar o destaque do texto.

### Fake phone ticker

Durante o embaralhamento, nao mostrar telefones reais. Usar finais ficticios:

```ts
export function generateFakePhoneEnding(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}
```

Exemplo visual:

```txt
Embaralhando participantes...
Final *****48391
Final *****92810
Final *****68144
```

O final real so aparece em `success`, vindo do backend.

### Revelar telefone completo

O botao deve ser pequeno, secundario e separado do resultado principal.

Antes de revelar:

```txt
[ Revelar telefone completo ]
A revelacao sera registrada para auditoria.
```

Durante:

```txt
Revelando...
```

Depois:

```txt
Telefone completo
+55 47 91568-144

[ Copiar telefone ]
```

`Copiar telefone` nao precisa endpoint novo. Usa o valor retornado por `reveal-phone`.

### Estados de erro

Mapa:

```ts
export const raffleErrorMessages = {
  WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS:
    "Nenhum participante elegivel encontrado.",
  WHATSAPP_RAFFLE_REVEAL_DISABLED:
    "A revelacao do telefone esta desativada.",
  WHATSAPP_RAFFLE_LOCKED:
    "Ja existe um sorteio em andamento. Tente novamente em instantes.",
  default:
    "Nao foi possivel realizar o sorteio. Tente novamente.",
} as const;
```

Acoes:

- Erro no sorteio: botao `Tentar novamente`.
- Sem participantes: botao `Atualizar`.
- Erro ao revelar telefone: manter resultado e permitir tentar revelar de novo.

### Acessibilidade

Usar `framer-motion`, que ja esta no projeto.

Regras:

- `AnimatePresence` para troca de fases.
- `useReducedMotion` ou `MotionConfig reducedMotion="user"` para respeitar preferencia do usuario.
- Em reduced motion, trocar giros/escala por fade/opacity.
- Botao `SORTEAR` deve ter foco visivel e `disabled` durante request.
- Mudancas de fase devem usar `aria-live="polite"`.
- Imagem do vencedor deve lidar com falha de carregamento sem quebrar o layout.

### Modo demo

Permitir `?demo=true` apenas em local/staging:

- nao chamar endpoint real de sorteio;
- usar payload mockado local;
- testar animacao e apresentacao;
- em producao, ignorar `demo=true` ou redirecionar para modo normal.

No backend, nao criar rota demo publica.

## 6) TDD e testes

### Principio

Implementar em TDD:

1. Escrever teste falhando.
2. Implementar o minimo para passar.
3. Refatorar mantendo teste verde.
4. Rodar teste focado antes de seguir para o proximo comportamento.

Separar tres categorias:

- testes deterministas com fixtures e `Http::fake()`;
- testes de endpoint interno da aplicacao;
- testes reais opt-in contra a Z-API e o grupo real.

### Fixtures sanitizadas

Criar fixtures com o formato real da Z-API, mas sem PII real:

```txt
apps/api/tests/Fixtures/zapi/light-group-metadata.real-shape.json
apps/api/tests/Fixtures/zapi/group-metadata.real-shape.json
apps/api/tests/Fixtures/zapi/profile-picture.success.json
apps/api/tests/Fixtures/zapi/profile-picture.not-found.json
```

Regra de seguranca:

- nao commitar telefones reais do grupo;
- nao commitar `lid` real;
- nao commitar token, instance token, client token ou URL assinada real de foto;
- manter nomes/campos iguais aos da Z-API, trocando valores por dados ficticios estaveis.

Exemplo de fixture sanitizada:

```json
{
  "phone": "120363000000000000-group",
  "description": "",
  "owner": "5511999999999",
  "subject": "SORTEIO VIP | Camisa do Brasil",
  "name": "SORTEIO VIP | Camisa do Brasil",
  "creation": 1778763759000,
  "invitationLink": null,
  "adminOnlyMessage": true,
  "adminOnlySettings": true,
  "requireAdminApproval": false,
  "isGroupAnnouncement": true,
  "participants": [
    {
      "phone": "5511888888888",
      "lid": "100000000000000@lid",
      "isAdmin": false,
      "isSuperAdmin": false
    },
    {
      "phone": "5511777777777",
      "lid": "200000000000000@lid",
      "isAdmin": true,
      "isSuperAdmin": false
    }
  ],
  "subjectTime": 1778763759000,
  "subjectOwner": "5511999999999"
}
```

### Testes backend deterministas

Criar:

```txt
apps/api/tests/Unit/WhatsApp/ZApiRafflePayloadShapeTest.php
apps/api/tests/Unit/WhatsApp/DrawWhatsAppRaffleActionTest.php
apps/api/tests/Feature/WhatsAppRaffleTest.php
```

`ZApiRafflePayloadShapeTest` deve validar fixtures:

- `phone` do grupo e string terminando em `-group`;
- `participants` existe e e array;
- cada participante tem `phone` string quando visivel;
- `lid` pode existir e deve ser string quando presente;
- `isAdmin` e `isSuperAdmin` sao booleanos ou normalizados para booleanos;
- `owner`, `subject`, `name`, `subjectTime` e `subjectOwner` sao opcionais/tolerantes conforme o payload;
- profile picture com foto tem `link` URL;
- profile picture sem foto aceita `link: "null"` e `errorMessage: "item-not-found"`.

`DrawWhatsAppRaffleActionTest` deve cobrir:

- busca metadata via `light-group-metadata`;
- normaliza telefones;
- exclui owner;
- exclui admins e super admins quando config ligada;
- respeita `WHATSAPP_RAFFLE_EXCLUDED_PHONES`;
- deduplica telefones;
- retorna erro quando nao houver elegiveis;
- usa `random_int` em faixa valida por meio de injecao de seletor/test double ou teste de limites;
- nao refaz sorteio quando vencedor nao tem foto;
- chama `profile-picture` somente com telefone valido;
- salva `winner_phone_hash`;
- salva `winner_phone_encrypted`;
- nao salva telefone completo em coluna plana;
- gera `confirmation_code`;
- lock por grupo/campanha impede concorrencia.

`WhatsAppRaffleTest` deve cobrir endpoints:

- `draw` exige autenticacao;
- `draw` exige `whatsapp.raffle.draw`;
- `draw` retorna 200 com payload seguro;
- `draw` nunca retorna `phone_full`;
- `draw` retorna `confirmation_code`, `campaign_name` e `campaign_key`;
- `draw` mapeia `WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS`;
- `draw` mapeia `WHATSAPP_RAFFLE_LOCKED`;
- `reveal-phone` exige autenticacao;
- `reveal-phone` exige `whatsapp.raffle.reveal-phone`;
- `reveal-phone` retorna telefone completo apenas apos clique;
- `reveal-phone` incrementa `reveal_count`;
- `reveal-phone` salva auditoria com usuario, IP e user agent;
- `reveal-phone` respeita `WHATSAPP_RAFFLE_ALLOW_PHONE_REVEAL=false`;
- `Http::assertSent()` valida URL, query `phone` e header `Client-Token`;
- `Http::preventStrayRequests()` impede chamada externa acidental.

Exemplo de padrao:

```php
Http::preventStrayRequests();
Http::fake([
    'api.z-api.io/instances/*/token/*/light-group-metadata/*' => Http::response($metadataFixture),
    'api.z-api.io/instances/*/token/*/profile-picture*' => Http::response($pictureFixture),
]);
```

### Testes reais da Z-API

Criar suite real opt-in:

```txt
apps/api/tests/Feature/WhatsAppRaffleRealZApiTest.php
```

Marcar com grupo:

```php
#[Group('zapi-real')]
```

ou, se for Pest:

```php
->group('zapi-real');
```

Esses testes nunca rodam por padrao. Rodam apenas quando:

```env
ZAPI_REAL_TESTS=true
ZAPI_REAL_GROUP_ID=120363407637460643-group
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
```

Nao usar as credenciais coladas em prompt no codigo, no teste ou na doc. Ler sempre do `.env`. Como os tokens foram compartilhados no prompt, a recomendacao operacional e rotacionar esses segredos na Z-API.

Testes reais obrigatorios:

1. `light-group-metadata` retorna shape real do grupo:
   - `phone` igual a `ZAPI_REAL_GROUP_ID`;
   - `participants` e array;
   - payload tem `subject` ou `name` quando disponivel;
   - cada participante tem shape tolerante: `phone` string quando visivel, `lid` string quando presente, `isAdmin`/`isSuperAdmin` booleanos ou normalizaveis;
   - se houver telefones visiveis, pelo menos um telefone normalizado deve ter 12 ou 13 digitos.

2. `profile-picture` retorna shape real para um participante real:
   - escolher o primeiro participante com `phone` valido vindo do metadata;
   - resposta aceita `link` URL quando houver foto;
   - resposta aceita `link: "null"` com `errorMessage: "item-not-found"` quando nao houver foto;
   - nao testar telefone vazio contra o provider real.

3. Endpoint interno `POST /api/v1/whatsapp/raffle/draw` com grupo real:
   - roda em banco de teste;
   - nao envia mensagem ao WhatsApp;
   - pode persistir auditoria somente no sqlite de teste;
   - retorna payload seguro;
   - nao retorna telefone completo;
   - retorna `draw_id`, `confirmation_code`, `phone_last_digits`, `eligible_participants_count` e `can_reveal_phone`.

Teste real de reveal deve ser separado e mais restrito:

```env
WHATSAPP_RAFFLE_REAL_REVEAL_TEST=true
```

Motivo: mesmo que a revelacao nao altere a Z-API, ela valida fluxo sensivel com telefone completo. Deve ser uma decisao explicita de quem esta rodando localmente.

Comandos PowerShell:

```powershell
cd apps/api
$env:ZAPI_REAL_TESTS='true'
$env:ZAPI_REAL_GROUP_ID='120363407637460643-group'
php artisan test --group=zapi-real
```

Comandos bash:

```bash
cd apps/api
ZAPI_REAL_TESTS=true ZAPI_REAL_GROUP_ID=120363407637460643-group php artisan test --group=zapi-real
```

### Captura de fixture real

Opcional, mas recomendado:

```txt
apps/api/app/Modules/WhatsApp/Console/CaptureZApiRaffleFixturesCommand.php
```

Comando:

```bash
php artisan whatsapp:raffle:capture-fixtures --group=120363407637460643-group
```

O comando deve:

- chamar a Z-API real usando `.env`;
- remover ou substituir telefones reais;
- substituir `lid` real por valores ficticios;
- substituir link real de foto por `https://example.test/profile-picture.jpg`;
- preservar campos, tipos e formato estrutural;
- gravar somente fixture sanitizada em `tests/Fixtures/zapi`.

Esse comando nao e obrigatorio para o MVP, mas reduz risco de fixture manual ficar diferente do provider.

### Testes frontend

Criar:

```txt
apps/web/src/features/whatsapp-raffle/api/whatsappRaffle.service.test.ts
apps/web/src/features/whatsapp-raffle/hooks/useRaffleAnimationMachine.test.ts
apps/web/src/features/whatsapp-raffle/components/RaffleDrawPanel.test.tsx
```

Cobrir:

- renderiza botao inicial;
- clique chama `draw`;
- `draw` usa endpoint `/whatsapp/raffle/draw`;
- mantem animacao minima de `3200ms` com fake timers;
- passa por `requesting`, `preparing`, `shuffling`, `slowing-down`, `revealing-winner` e `success`;
- limpa timers no unmount;
- nao mostra telefone completo apos `draw`;
- mostra `phone_last_digits` no resultado;
- mostra `confirmation_code`;
- nao mostra foto quando `photo_url=null`;
- botao revelar chama endpoint separado;
- nao mostra botao revelar se `can_reveal_phone=false`;
- erro de draw mostra mensagem amigavel;
- `WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS` renderiza empty state;
- erro de reveal mantem resultado e permite nova tentativa;
- apos reveal, mostra `Copiar telefone`;
- reduced motion usa animacao simplificada.

Usar `vi.useFakeTimers()` nos testes do hook e da animacao.

## 7) Sequencia de implementacao

### Fase 0 - Contrato e TDD

1. Criar fixtures sanitizadas da Z-API.
2. Criar testes de shape da Z-API.
3. Criar testes falhando dos endpoints internos.
4. Criar testes falhando da action de sorteio.
5. Criar testes falhando da maquina de animacao frontend.

### Fase 1 - Configuracao backend

1. Adicionar `whatsapp.raffle`.
2. Atualizar `.env.example`.
3. Criar permissoes no seeder.

### Fase 2 - Persistencia

1. Criar `whatsapp_raffle_draws`.
2. Criar `whatsapp_raffle_phone_reveals`.
3. Criar models com ULID e casts.

### Fase 3 - Z-API service

1. Manter `lightGroupMetadata()`.
2. Adicionar `profilePicture()`.
3. Garantir que telefone vazio falhe antes da chamada externa.

### Fase 4 - Sorteio

1. Criar `DrawWhatsAppRaffleAction`.
2. Implementar lock, filtros, dedupe, `random_int`, foto e auditoria.
3. Gerar `confirmation_code`.
4. Garantir que `phone_full` nunca sai no payload de draw.

### Fase 5 - Revelacao de telefone

1. Criar `RevealWhatsAppRafflePhoneAction`.
2. Descriptografar telefone.
3. Incrementar `reveal_count`.
4. Salvar log com usuario, IP e user agent.
5. Retornar `phone_full` e `phone_formatted`.

### Fase 6 - Endpoints

1. Criar controller fino.
2. Criar requests com authorize.
3. Registrar rotas.
4. Mapear codigos de erro controlados.

### Fase 7 - Frontend API

1. Criar service.
2. Criar types.
3. Criar hooks de mutations.

### Fase 8 - Frontend fullscreen

1. Criar `/engajamento/sorteador` sem `AppShell`.
2. Criar `RaffleFullscreenShell`.
3. Criar maquina de animacao.
4. Criar componentes visuais.
5. Implementar reveal e copy.
6. Implementar empty/error states.

### Fase 9 - Menu

1. Adicionar `Sortear do Grupo` no menu lateral de `Engajamento`.
2. Abrir em nova guia com `target="_blank"` e `rel="noopener noreferrer"`.
3. Usar permissao `whatsapp.raffle.view` para visibilidade.

### Fase 10 - Teste real opt-in

1. Rodar testes deterministas.
2. Rodar teste real de provider com `ZAPI_REAL_TESTS=true`.
3. Rodar endpoint interno com grupo real em banco de teste.
4. Registrar resultado da validacao e qualquer divergencia no JSON real.

## 8) Validacoes

Backend focado:

```bash
cd apps/api
php artisan test --filter=WhatsAppRaffle
php artisan test --filter=ZApiRafflePayloadShape
php artisan route:list --path=api/v1/whatsapp
```

Backend real opt-in:

```bash
cd apps/api
ZAPI_REAL_TESTS=true ZAPI_REAL_GROUP_ID=120363407637460643-group php artisan test --group=zapi-real
```

PowerShell:

```powershell
cd apps/api
$env:ZAPI_REAL_TESTS='true'
$env:ZAPI_REAL_GROUP_ID='120363407637460643-group'
php artisan test --group=zapi-real
```

Frontend focado:

```bash
cd apps/web
pnpm vitest run src/features/whatsapp-raffle
```

Backend amplo:

```bash
pnpm validate:api
```

Frontend amplo:

```bash
pnpm validate:web
```

Contrato, se OpenAPI/client forem atualizados:

```bash
pnpm validate:contract
```

Baseline conhecido:

- `pnpm validate:web` tem falhas legadas registradas.
- `pnpm validate:api` tem falhas legadas em testes especificos e Pint.
- `pnpm validate:contract` tem falha conhecida no client TypeScript ainda nao configurado.

Nao afirmar validacao completa sem separar essas falhas.

## 9) Criterios de aceite

1. `Sortear do Grupo` aparece no menu lateral em `Engajamento`.
2. O clique abre `https://adm.tvvip.social/engajamento/sorteador` em nova guia.
3. A nova guia nao mostra menu lateral, topbar, bottom nav, FAB ou `AppShell`.
4. A rota continua protegida por autenticacao.
5. A visibilidade da tela usa `whatsapp.raffle.view`.
6. A acao de sortear usa `whatsapp.raffle.draw`.
7. A acao de revelar telefone usa `whatsapp.raffle.reveal-phone`.
8. O botao `SORTEAR` e grande, centralizado e usa `#ff8000`.
9. O clique chama apenas o backend interno.
10. O frontend exibe fases animadas: preparando, embaralhando, desacelerando e revelando.
11. A animacao tem duracao minima de `3200ms` configurada no frontend.
12. O backend define o vencedor; a animacao nao altera o resultado.
13. A UI nao exibe telefones reais durante o embaralhamento.
14. Participantes sao buscados por `light-group-metadata`.
15. Sorteio usa `random_int`.
16. Admins, super admins, owner e excluidos sao removidos.
17. Telefones duplicados sao deduplicados antes do sorteio.
18. Foto e buscada somente para o vencedor.
19. Falta de foto nao altera o vencedor.
20. Se nao houver foto, nenhum placeholder obrigatorio aparece.
21. Endpoint de sorteio nao retorna telefone completo.
22. Resultado mostra `Parabens!`, telefone final e codigo de confirmacao.
23. Telefone completo so e retornado por `reveal-phone`.
24. Revelacao do telefone completo e auditada.
25. Apos revelar, aparece botao `Copiar telefone`.
26. Telefone completo nao fica em texto puro no banco.
27. Erros de sorteio e revelacao tem mensagens amigaveis.
28. UI respeita reduced motion.
29. Botoes ficam disabled durante chamadas.
30. Lock/rate limit evitam sorteio concorrente ou duplo clique.
31. Testes backend deterministas validam o shape real da Z-API por fixture sanitizada.
32. Testes de endpoint validam que o JSON de draw nao vaza `phone_full`.
33. Testes reais opt-in validam o grupo real na Z-API.
34. Testes frontend cobrem maquina de estados, tempo minimo e reveal.

## 10) Pendencias de produto

Confirmar antes de implementar:

1. Cada clique autorizado gera novo sorteio ou deve existir um unico vencedor por campanha?
2. O historico de sorteios entra no MVP da tela fullscreen ou fica apenas no banco?
3. Quais perfis recebem `whatsapp.raffle.view`, `whatsapp.raffle.draw`, `whatsapp.raffle.reveal-phone` e `whatsapp.raffle.history`?
4. A lista de excluidos tera apenas env ou precisa tela administrativa?
5. A tela fullscreen deve ter botao discreto de voltar/fechar ou nenhum controle de navegacao?
6. O modo `?demo=true` deve existir em staging ou apenas local?
7. A campanha sera fixa em `.env` no MVP ou selecionavel pela UI?

## 11) Riscos e decisoes

- Credenciais coladas em prompt devem ser rotacionadas na Z-API.
- Testes reais dependem de rede, estado da instancia e participantes do grupo; por isso sao opt-in e fora do CI padrao.
- O endpoint real da Z-API pode retornar participante sem `phone` visivel; o parser deve ser tolerante e excluir sem quebrar.
- Links de foto do WhatsApp expiram; fixtures devem usar URL ficticia e testes reais devem aceitar ausencia de foto.
- O cache lock com `CACHE_STORE=array` em teste nao simula concorrencia entre processos; teste de lock deve focar comportamento da camada e erro controlado.
- `winner_phone_encrypted` com cast encrypted nao pode ser consultado por valor; consultas devem usar `winner_phone_hash`.
