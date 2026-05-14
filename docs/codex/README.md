# Codex Operating Docs

Esta pasta guarda a camada operacional para agentes neste monorepo.

## Fontes Oficiais Consultadas

- Custom instructions with AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Codex best practices: https://developers.openai.com/codex/learn/best-practices
- Agent Skills: https://developers.openai.com/codex/skills
- Configuration Reference: https://developers.openai.com/codex/config-reference

## Arquivos

- `context-map.md`: mapa rapido de areas, padroes e contratos.
- `known-failures.md`: baseline de falhas conhecidas para separar divida de regressao.
- `decision-hierarchy.md`: ordem de precedencia quando docs divergem.
- `validation-matrix.md`: define comandos por area alterada.
- `review-checklist.md`: checklist de revisao de diff/PR.
- `planning-template.md`: template para tarefas grandes.
- `prompt-patterns.md`: exemplos de prompts com objetivo, contexto, restricoes e pronto quando.

## Configuracao Repo-Scoped

- `.codex/config.toml`: defaults do Codex para este repo quando o projeto estiver marcado como confiavel.
