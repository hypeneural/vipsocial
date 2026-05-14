# Decision Hierarchy

Quando houver conflito entre documentos, use esta ordem:

1. Pedido explicito do usuario nesta tarefa.
2. `AGENTS.md` mais proximo do diretorio alterado.
3. Plano de execucao especifico da feature, se existir.
4. `docs/AI_GUIDE.md`.
5. `docs/codex/*`.
6. README geral.
7. Codigo existente no modulo mais parecido.

## Regra

Se uma doc de arquitetura divergir de um plano de execucao aprovado, o plano de execucao vence para o escopo da entrega atual, e a doc divergente deve ser atualizada como parte do fechamento.

## Prompt Templates De I.A.

Para Prompt Templates de I.A., a fonte de verdade do V1 e:

- `docs/ai_prompts_templates_execution_plan.md`

Se `docs/ai_prompts_templates_architecture.md` divergir do plano de execucao:

- o plano de execucao vence para V1;
- a arquitetura deve ser atualizada antes de finalizar a entrega.
