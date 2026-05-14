# Review Checklist

Use este checklist para revisao de PR, diff local ou mudancas feitas por agente.

## Severidade

### Blocker

- Quebra build, teste principal ou gate obrigatorio sem explicacao.
- Falha de seguranca, auth, ownership ou tenant isolation.
- Contrato API quebrado sem migracao do frontend.
- Risco de perda de dados.

### Major

- Regressao funcional importante.
- Estado loading, error ou empty ausente em fluxo critico.
- Teste central faltando em regra de negocio nova.
- Performance ruim em tela de alto uso.

### Minor

- Nomenclatura inconsistente.
- Pequena duplicacao.
- Falta de doc auxiliar.
- Ajuste visual nao bloqueante.

## Escopo

- A mudanca resolve o pedido sem refatoracao lateral?
- Arquivos gerados foram alterados apenas quando necessario?
- `dist` versionado mudou somente por build intencional?

## Backend

- 401, 403 e 422 estao cobertos quando a rota exige?
- Ownership/escopo do usuario autenticado esta correto?
- Rotas especiais aparecem antes de `/{id}`?
- Parametros numericos usam constraint quando aplicavel?
- API manteve envelope `{ success, data, message, meta }`?
- Datas sao deterministicas em testes?
- Filas, jobs e webhooks sao idempotentes quando necessario?

## Frontend

- Server state usa TanStack Query?
- Existem estados loading, error, empty e success?
- Formularios relevantes usam React Hook Form + Zod?
- Nao foi introduzido `any` sem justificativa?
- A navegacao mobile continua usavel?
- Erros 401/403/422 sao tratados sem ocultar feedback importante?

## Contrato

- Mudanca de endpoint atualizou OpenAPI/client quando o fluxo estiver habilitado?
- Tipos do frontend continuam alinhados ao payload real?
- Payload publico nao perdeu campos obrigatorios como tokens publicos.

## Validacao

- Comandos relevantes foram executados?
- Falhas existentes foram separadas de falhas introduzidas?
- O resumo final lista o que passou, falhou e nao foi executado?
