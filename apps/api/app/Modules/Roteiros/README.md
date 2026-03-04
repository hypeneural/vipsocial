# Módulo Roteiros — Golden Module 🏆

> **Este é o módulo de referência.** Todos os módulos futuros devem copiar esta estrutura.

## Entidades

| Entidade | Tabela | SoftDeletes |
|----------|--------|-------------|
| Roteiro | `roteiros` | ✅ |
| Matéria | `materias` | ❌ (cascade do roteiro) |
| Categoria | `categorias` | ✅ |
| Gaveta | `gavetas` | ✅ |
| Notícia Gaveta | `noticias_gaveta` | ❌ (cascade da gaveta) |

## Status do Roteiro

`rascunho` → `em_producao` → `revisao` → `aprovado` → `publicado` → `arquivado`

## Status da Matéria

`pendente` → `em_producao` → `pronto` → `aprovado` → `no_ar`

## Endpoints

### Roteiros `/api/v1/roteiros`
- `GET /` — listagem com filtros (status, programa, data, today, search) + includes + sorts
- `POST /` — criar com matérias inline
- `GET /{id}` — detalhe com matérias + categoria + createdBy
- `PUT /{id}` — atualizar
- `DELETE /{id}` — soft delete
- `POST /{id}/duplicate` — duplicar com matérias

### Matérias (nested) `/api/v1/roteiros/{id}/materias`
- `POST /` — adicionar
- `PUT /{materiaId}` — atualizar
- `DELETE /{materiaId}` — remover
- `PUT /reorder` — reordenar (`[{id, ordem}]`)

### Categorias `/api/v1/categorias`
- CRUD completo

### Gavetas `/api/v1/gavetas`
- CRUD + notícias nested

## Permissões

`roteiros.view`, `roteiros.create`, `roteiros.edit`, `roteiros.delete`, `roteiros.publish`

## Computed Fields

- `total_materias` — contagem de matérias
- `duracao_total` — soma das durações (mm:ss)
