# 4. Inteligência Artificial e Enriquecimento Semântico

A extração crua do HTML é insuficiente para filtros avançados, categorizações corretas, sumarizações ou até mesmo a reformatação "jornalística" da notícia para as redes sociais (WhatsApp/Instagram).

O sistema integra a Inteligência Artificial (OpenAI) de forma assíncrona, operando exclusivamente nos registros já "baixados" no banco de dados. Este é o conceito de **Pipeline Pós-Extração (Post-Processing Layer)**.

## 4.1 Níveis de Enriquecimento (Custo vs Benefício)

Aplicações extensas de Prompts para todas as matérias raspadas gerarão custos altos de API. O ideal é o fatiamento da estratégia.

**Nível 1 (Básico, Rápido, Barato)**
Executado imediatamente via _Job_ na Fila de Enriquecimento assim que o Crawler cria um novo registro ou salva metadados suficientes da matéria. Foco restrito: Mapeamento de Entidades, Geolocalização Básica e Classificação Tópica usando **Structured Outputs**.
*   **Prompt (JSON Schema Strict):** Determinar `Tema/Categoria` (Polícia, Política, Esporte, Comunidade...), Extrair a `Cidade` (Se citada no subtítulo / corpo) e as `Entidades Principais` (Vereador XYZ, Prefeitura, PM, Acidente Terrestre).
*   **Benefício:** Permite ativar rapidamente gatilhos lógicos do sistema (ex: "Enviar Push Notification Imediato para assinantes do filtro 'Acidente na Cidade X'").

**Nível 2 (Jornalístico / Redacional)**
Condicional ao Nível 1. É ativado se a Relevância do Nível 1 for alta, ou se os dados básicos indicam uma "notícia âncora", e não meramente a "Licitação Nº 54 da Câmara de Tijucas".
*   **Prompt:** Extração explícita da técnica do **5W1H** (O quê, Quem, Quando, Onde, Por que, Como), Sugestões de Título _Clickbait/Viral_ formatados, Resumo de leitor rápido (Bullet-points), Possíveis Pautas de Continuação e Avaliação de Viés (Institucional, Denúncia, Factual).
*   **Aplicação Prática:** A pauta no VIP Social já entra semi-pronta para ser revisada, diagramada na capa ou convertida em Roteiro de Vídeo pela equipe de jornalismo.

**Nível 3 (Lote / Histórico - Batch API)**
O reprocessamento de mil, ou dez mil matérias retroativas do ano passado, visando gerar embeddings, unificar tags despadronizadas ou corrigir a taxonomia de Cidades, ocorrerá por *Batch API JSONL* (assíncrono em 24h pagando metade do custo por token estipulado pela OpenAI). O uso do pacote de processamento em Lote não onera a API no horário comercial.

## 4.2. Estrutura de Retorno Tipado (Structured Outputs)

Historicamente, delegar Extração de Dados JSONs para a IA exigia Prompts complexos repletos de "Retorne apenas em formato JSON com essas chaves e escape as aspas". No Laravel, o método adotado obriga a API (`openai-php/laravel`) a obedecer ao pé da letra as _keys_ e os _tipos de dados_ esperados:

```json
{
  "city": "Tijucas",
  "state_abbr": "SC",
  "theme": "politica",
  "urgency": "alta",
  "relevance_score": 0.85,
  "five_ws": {
    "who": ["Câmara de Vereadores", "Prefeito X"],
    "what": "Votação do Plano Diretor é adiada por protestos.",
    "where": "Plenário da Câmara de Tijucas",
    "when": "Terça-feira (27)",
    "why": "Moradores alegam falta de audiência prévia nos bairros.",
    "how": "Interrupção da sessão ordinária."
  },
  "entities": [
    {"type": "organization", "name": "Câmara de Vereadores de Tijucas"},
    {"type": "concept", "name": "Plano Diretor"},
    {"type": "person", "name": "Prefeito X"}
  ]
}
```

O uso de enums na declaração do JSON Schema do prompt impede que o GPT retorne `Tema: Politicagem` ou `Politica Municipal` invés da string `politica` esperada.

A Fila (`EnrichNewsItemWithAIJob`) recebe este objeto decodificado estritamente validado e faz a gravação dos relacionamentos Polimórficos de `Tags`/`Categorias`/`Localidades` com a Notícia.

## 4.3 Embeddings (Busca Semântica & Desduplicação)

Uma fraqueza do Crawling é a inserção duplicada. Portais diferentes replicam releases oficiais usando sinônimos no título. Exemplo de desduplicação e recomendação usando _Embeddings_ (`vector search`):

**O Problema (Títulos Idênticos Semanticamente):**
*   Câmara: _João assume presidência da Câmara_.
*   Portal VIP: _Sessão solene marca posse de João como novo presidente do legislativo tijucano_.
*   Blog 3: _Novo chefe da câmara de Tijucas é empossado_.

A concatenação de `Título` + `Súmula (Lide)` do crawler resultará na requisição de uma API de Embeddings (ex: `text-embedding-3-small`). O array matemático dos "Tokens" salvos na Tabela/DB Vetorial (como os suportados recentemente nativamente em PostgreSQL / PgVector / Redis) será comparado aos Embeddings de Matérias recém captadas nas últimas 48 horas (*Cosine Similarity Algorythm*).

Se o grau de similaridade (Cosine Distance) ultrapassar 0.85 ou 0.90, o sistema amarra as duas notícias em Cluster: "Mesmo Evento Jornalístico".

Na visualização do Painel/Frontend, a aplicação sugere para a redação: *"Esses três portais postaram sobre este evento. O Portal A teve a matéria extraída 2 horas antes do Portal C. Use as informações de todos eles no momento de re-redigir em sua própria matéria final."*

A mesma matriz vetorial serve também para o leitor no Frontend: *Módulo "Leia também"*; buscando matérias do banco histórico onde as Coordenadas Semânticas aproximem-se do Artigo corrente, descartando a pesada técnica obsoleta do `LIKE %palavra%` em buscas textuais SQL.
