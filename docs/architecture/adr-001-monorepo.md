# ADR-001: Monorepo com pnpm + Turborepo

## Status
Aceito

## Contexto
O VIPSocial Hub precisa de uma API Laravel e um frontend React. A equipe é pequena e precisa de manutenção simples com contexto previsível para desenvolvimento assistido por IA.

## Decisão
Usar **monorepo** com pnpm workspaces + Turborepo.

### Estrutura
- `apps/api` — Laravel 12
- `apps/web` — React + Vite
- `packages/*` — contratos, client gerado, configs compartilhadas

### Justificativa
- **Simplicidade:** sem overhead de microserviços
- **Contrato central:** OpenAPI como fonte de verdade front/back
- **CI unificado:** `turbo run lint test build`
- **IA-friendly:** pastas previsíveis, nomes padronizados

## Alternativas descartadas
- **Repos separados (front + back):** dificulta sincronização de tipos e contratos
- **Microserviços:** complexidade prematura para o tamanho do time

## Consequências
- Turborepo gerencia cache e paralelismo
- pnpm garante instalação eficiente
- Precisa de disciplina para manter fronteiras entre modules
