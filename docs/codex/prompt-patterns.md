# Prompt Patterns

Use prompts com objetivo, contexto, restricoes e definicao de pronto.

## Implementacao

```text
Objetivo:
Implementar [feature/bugfix].

Contexto:
- Docs: ...
- Mapa rapido: `docs/codex/context-map.md`
- Falhas conhecidas: `docs/codex/known-failures.md`
- Modulo similar: ...
- Arquivos provaveis: ...

Restricoes:
- Nao adicionar dependencia.
- Manter envelope API.
- Usar TanStack Query no frontend.

Pronto quando:
- Testes relevantes passam.
- Lint/typecheck/build da area foram executados.
- Resumo final lista falhas restantes.
```

## Roteamento De Contexto

```text
Antes de implementar:
1. Leia AGENTS.md.
2. Leia docs/codex/context-map.md.
3. Leia docs/codex/known-failures.md.
4. Leia docs/codex/decision-hierarchy.md se houver conflito entre docs.
5. Escolha a skill repo-scoped aplicavel.
6. Liste validacao planejada antes de editar.
```

## Investigacao

```text
Analise [area] e responda com:
- arquitetura atual
- riscos
- arquivos principais
- comandos de validacao
- plano incremental
Nao altere arquivos ainda.
```

## Revisao

```text
Revise o diff como PR.
Priorize bugs, regressao de contrato, permissao, timezone, UX mobile e testes faltantes.
Liste findings com arquivo/linha.
```
