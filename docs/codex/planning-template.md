# Planning Template

Use este modelo para tarefas com mais de uma area, mudancas de contrato ou risco de regressao.

## Objetivo

Descreva o resultado esperado em uma frase.

## Contexto

- Arquivos, modulos e docs relevantes.
- Modulo similar que deve guiar a implementacao.
- Erros ou comportamento atual.

## Restricoes

- Dependencias proibidas ou exigidas.
- Contratos que nao podem mudar.
- Regras de seguranca, permissao, timezone ou deploy.

## Impacto

Marque as areas impactadas:

- [ ] `apps/api`
- [ ] `apps/web`
- [ ] `gallery`
- [ ] `packages/api-contract`
- [ ] `packages/api-client`
- [ ] banco/migration
- [ ] permissoes/auth
- [ ] timezone/datas
- [ ] build/deploy/dist

## Validacao Planejada

Liste os comandos antes de implementar:

- `...`

## Plano

1. Levantar contexto minimo.
2. Implementar a menor mudanca coerente.
3. Adicionar ou ajustar testes.
4. Rodar validacoes relevantes.
5. Revisar diff e riscos.

## Pronto Quando

- Comportamento esperado foi confirmado.
- Validacoes relevantes foram executadas.
- Falhas restantes estao documentadas.
