---
name: vip-investigate-codebase
description: Use para investigar uma area do monorepo antes de implementar: mapear arquivos, modulo similar, fluxo atual, riscos, comandos e plano. Nao altera arquivos.
---

## Objetivo

Levantar contexto minimo e confiavel antes de editar.

## Passos

1. Leia `AGENTS.md`.
2. Leia `docs/codex/context-map.md`.
3. Leia `docs/codex/known-failures.md`.
4. Localize o modulo ou feature mais parecido.
5. Leia apenas arquivos diretamente relevantes.
6. Monte plano incremental e validacoes necessarias.

## Saida Obrigatoria

- Arquitetura atual.
- Arquivos principais.
- Modulo similar.
- Riscos.
- Validacoes necessarias.
- Plano incremental.
- Perguntas abertas, se houver.

## Nao Usar Quando

- O pedido ja for uma correcao pequena e direta com escopo evidente.
- A tarefa exigir implementacao imediata sem fase de analise separada.
