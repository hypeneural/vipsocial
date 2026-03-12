# Documentação Técnica: Módulo "Prompt Templates de I.A."

Este documento define a arquitetura, regras de negócio e contratos de API para a evolução da inteligência artificial do News Radar da VIP Social News. Migraremos a abordagem atual ("Gerar com I.A." hardcoded) para um módulo de gestão de **Prompt Templates de I.A.**

---

## 1. Objetivo do Módulo

Permitir que usuários autenticados criem e operem "Templates de Prompts" customizados, que serão dinamicamente compilados pelo frontend com os dados das notícias extraídas, para agilizar fluxos editoriais diários via integrações gratuitas (ChatGPT/Claude).

---

## 2. Conceitos e Nomenclatura

Para garantir consistência na comunicação da equipe (Front, Back e Produto), adotaremos os seguintes termos em inglês no código e arquitetura:

*   **Prompt Template:** O "gabarito" salvo no banco de dados, que contém marcações (ex: `{{md_url}}`). É estático até ser processado.
*   **Compiled Prompt:** O texto literal e final. O resultado do Front ter injetado as variáveis da notícia atual no *Prompt Template*.
*   **Favorite Prompt:** O *Prompt Template* marcado como padrão por um usuário. Cada usuário pode ter **no máximo 1 favorito**.
*   **Prompt Manager:** A tela de configurações de CRUD (Create, Read, Update, Delete) localizada em `/raspagem/config/prompts-ia`.

---

## 3. Escopo V1

**Regras estritas para a primeira entrega (MVP):**
1.  A fonte de verdade do Template é o Banco (CRUD via Backend).
2.  A fonte de verdade da Compilação no V1 é inteiramente no Frontend (Backend não compila prompt textual na V1).
3.  O `public_token` da notícia é agora **contrato obrigatório** no schema de respostas do endpoint de Feed (`/api/v1/news-radar/items`). O front precisa dele na mão para não gerar chamadas extras (`N+1`) por card de notícia.
4.  O "Deeplink" (link via `window.open` para OpenAI/Anthropic envando o `?q=prompt_gigante`) é uma funcionalidade *Best-Effort* (conveniência de UI, não contrato inquebrável da plataforma). Em casos onde a compilação gerar um texto gigantesco além do limite de URI do browser, o fallback da UI é orientar o usuário a usar os botões "Copiar Prompt" e colar no painel da I.A manualmente.
5.  O comportamento de Exclusão (Delete) no V1 é de **Arquivamento** (Soft Delete Lógico via `is_active` e/ou `deleted_at`). A exclusão física permanente está fora do V1.

---

## 4. Arquitetura Backend

### 4.1 Tabela `user_ai_prompt_templates`

Tabela principal para armazenar os templates do usuário com flexibilidade futura.

```sql
CREATE TABLE user_ai_prompt_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,       -- FK para usuários
    name VARCHAR(100) NOT NULL,             -- Nome na listagem (ex: "Policial Urgente")
    slug VARCHAR(120) NULL,                 -- Amigável e Unico por User (Idx)
    description TEXT NULL,                  -- Nota orientadora
    content TEXT NOT NULL,                  -- O texto do Template com as Tags
    provider_target VARCHAR(50) DEFAULT 'generic', -- "generic", "chatgpt", "claude"
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,         -- O "Excluir" do V1 apenas desliga isso
    sort_order INT DEFAULT 0,               -- Ordem no list
    usage_count INT DEFAULT 0,              -- Reservado p/ futura ordenação
    last_used_at TIMESTAMP NULL,            -- Reservado p/ tracker de uso 
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,              -- Para Laravel SoftDeletes padrão
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices Recomendados para Otimização de Leitura
CREATE INDEX idx_user_active_sort ON user_ai_prompt_templates(user_id, is_active, sort_order);
CREATE INDEX idx_user_favorite ON user_ai_prompt_templates(user_id, is_favorite);
CREATE UNIQUE INDEX idx_user_slug ON user_ai_prompt_templates(user_id, slug);
```

### 4.2 Contratos de API (Endpoints)

Base Url: `GET /api/v1/user/ai-prompts` (Módulo User protegido por Sanctum).

*   `GET /` : Lista (Order: Favorite, is_active DESC, sort_order ASC, name ASC).
*   `POST /` : Cria um template.
*   `GET /{id}` : Lê detalhes.
*   `PUT /{id}` : Atualiza dados do template.
*   `DELETE /{id}` : Desativa (`is_active = false` ou Eloquent SoftDelete). Frontend trata como "Arquivar".
*   `GET /variables` : Retorna a lista estática oficial de variáveis suportadas.
*   `PUT /{id}/favorite` : SET Favorite. O backend (transacionalmente) define `is_favorite = 0` nos demais e `1` no requisitado.
*   `PUT /reorder` : Endpoint específico de "Batch Update" da ordenação.

**Contrato Payload de `/reorder`:**
```json
{
  "items": [
    { "id": 7, "sort_order": 1 },
    { "id": 12, "sort_order": 2 },
    { "id": 3, "sort_order": 3 }
  ]
}
```

### 4.3 Endpoint de Leitura do Markdown (Para I.A)

O acesso ao conteúdo das notícias pela I.A ocorre de foma pública (sem necessidade de enviar Token Bearer no Deeplink do ChatGPT):

* A rota pública é `GET /news/{publicToken}.md` registrada nativamente no backend (ex: `https://adm.tvvip.social/news/6f92b228-...-add81.md`).
* Esta arquitetura serve puro texto (garantindo ausência de bloqueios em CORS originárias do ChatGPT/Claude via `OPTIONS`), entregando o conteúdo sem forçar triggers de Downloads no Browser Humano, utilizando `.md` nominal como identificador forte de LLM input.

---

## 5. Arquitetura Frontend

A aplicação Front gerencia duas jornadas principais baseadas em `prompt-template-utils.ts`.

### 5.1 Catálogo Oficial de Variáveis (A Fonte da Verdade)

Para evitar vazamento de lógica ou bugs se o usuário tentar inventar `{{nome_do_gato}}`, o frontend usará um mapa fechado durante a compilação.

**Regras da Compilação:** 
1. Mapeamento Estrito: Apenas chaves deste mapa serão parseadas.
2. Graceful Degradation: Valores `nulos`/`undefined` no Feed (ex: notícia não tem autor) devem ser setados como string vazia `""` para não injetar a string `undefined` visível no texto final.
3. Tratamento Resíduo: Se o usuário escreveu uma variável desconhecida real (`{{teste_invalido}}`), a rotina `compilePrompt` deve **deixar ela intacta** no texto (pois ela não casou com nenhuma key oficial conhecida). E caso permaneçam tags com `{{` no texto final que não são a URL markdown, o modal do front exibe um Warning *"Este template contém variáveis não reconhecidas"*.

**Contrato de Mapeamento Oficial (`getAvailableVariables`):**

| Key (Chip UI) | Valor Final Exposto |
| :--- | :--- | 
| `{{md_url}}` | `https://adm.tvvip.social/news/{public_token}.md` |
| `{{item_title}}` | O titulo original da materia. |
| `{{item_source}}` | Nome do provedor RSS (ex: UOL). |
| `{{item_date}}` | Data convertida (ex: "12/03/2026 12:30"). |
| `{{item_excerpt}}` | Lead sintético (resumo). |
| `{{item_city}}` | Município (quando houver link geográfico). |
| `{{item_urgency}}`| Alta, Média, Baixa (se tipado). |
| `{{item_category}}`| Editoria (ex: "Política"). |
| `{{item_original_url}}`| URL suja na fonte nativa. |

*(Nota de Endpoint V1.5)*: Há um serviço planejado `GET /variables` para que a lista UI venha do backend e mantenha SOT, mas no V1 o uso de um Objeto/Dicionário/Map no `utils.ts` é seguro.

---

### 5.2 Fluxo no Gerenciador ("Prompt Manager")

Caminho Crítico: `/raspagem/config/prompts-ia`

1.  **Listagem (Data Table/Cards)**:
    *   Exibir `name`, `description`, badge `is_favorite`.
    *   Ações Inline: "Editar", "Arquivar" (chama DELETE), "Setar como Padrao", e Controles numéricos ou setas [↑ Subir] [↓ Descer] p/ Sort Order.
    *   "Duplicar": O Frontend V1 fará isso client-side (pega o registro, limpa `id`, adiciona " (Cópia)" no nome, e envia um `POST /`).
2.  **Formulário de Cadastro/Edição**:
    *   Name, Provider (Select: ChatGPT, Claude, Genérico), Description.
    *   **Área de Chips Interativos**: "Botões de atalho" acima do textarea para injetar o texto no cursor. Ex: `[ + Inserir Link ]`.
    *   **Template (Textarea)**.
    *   *Regra de Validação Soft:* Se no momento do `onChange` a textarea não constar o texto base `{{md_url}}`, levanta um Warning Amarelo no topo ("O seu prompt não embute a inteligência de link limpo"). Mas **permite Salvar.**

---

### 5.3 Fluxo Operacional ("Novo Gerar com I.A." no Feed)

O Botão "Gerar com I.A." não dispara mais a aba silenciosamente. 
Ele intercepta a view abrindo um **Modal Central de Interação**.

**Estrutura de UI do Modal:**

1.  **Header:** "✨ Gerar Assistência de Inteligência Artificial"
2.  **Controller:** Um `<select>` mostrando "Os Modelos (Templates)" disponíveis.
    *   O `<select>` deve auto-selecionar o `Favorite Prompt` (se houver), se não, o Index 0 (o menor Sort Order ASC, ativo).
3.  **Body Principal:** Uma grande `<textarea>` **Editável**.
    *   *(Trigger)*: Ao abrir o modal, ou ao trocar a opção no Select, o Form roda o Helper `compilePrompt()`. O retorno "limpo" (Compiled Prompt) preenche esse textarea. O redator vê o texto já pronto.
    *   *(Ajuste Fino)*: O redator pode, ali mesmo na textarea, reescrever ou apagar pedaços manuais (Edição de Last-Mile). 
4.  **Meta-Info Auxiliar (Chips)**: Um bloquinho opcional abaixo, pra checagem de contexto: [Fonte: SCC10] [Data: 23:40].
5.  **Rodapé Interativo:**
    *   Botão "Restaurar template original" (Se o redator digitou lixo na textarea editável, este action simplesmente roda `compilePrompt` novamente e joga por cima).
    *   Botões de Ação Final (Que puxam a String atual da Textarea processada, limitando dependências):
        *   `[ Abrir no ChatGPT ]`
        *   `[ Abrir no Claude ]`
        *   `[ Copiar Prompt para a Área de Transferência ]` (Fallback de ouro para contornar bloqueios de Deeplink)
        *   `[ Visualizar Markdown Gerado ]`

---

## 6. Evolução V2 (Planejamento Futuro)

Este banco e este modelo preveem uma arquitetura de "Recomendadores" sem quebras no V2.

Se houver tempo/verba futura, adicionaremos colunas `scope_type` (ex: "category") e `scope_value` (ex: "policial") na tabela.
Assim, o `<select>` do modal no frontend passará a testar o `newsItem.categories` em runtime. Se bater com o `scope_value` do prompt salvaguardado, aplicará ele sob uma header inteligente *"📝 Sugeridos para esta Notícia"* no Optiongroup.

O Frontend atual deverá ignorar campos não especificados no V1 e operar restritamente à relação de Usuário Logado vs Prompts de Usuário Logado.
