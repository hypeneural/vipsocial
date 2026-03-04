# ADR-004: Padrão de Datas e Timezone

## Status
Aceito

## Contexto
O sistema tem roteiros, externas, alertas, publicações e agendamentos que dependem de datas/horários corretos.

## Decisão
- **Banco de dados:** salva tudo em **UTC**
- **API:** responde em **ISO 8601** (`2026-03-03T17:00:00Z`)
- **Campos date-only:** `YYYY-MM-DD` (sem timezone)
- **Conversão:** Frontend converte para timezone do usuário
- **config/app.php:** `timezone => 'UTC'`

## Consequências
- Model casts devem usar `'datetime:Y-m-d\TH:i:s\Z'`
- Frontend precisa de lib de timezone (ex: `date-fns-tz` ou `dayjs`)
- Agendamentos (alertas, enquetes) salvam em UTC, exibem em local
