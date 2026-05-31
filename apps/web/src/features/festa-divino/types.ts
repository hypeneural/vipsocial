export type FestaDivinoSection =
    | "dashboard"
    | "edicao"
    | "programacao"
    | "cardapio"
    | "conteudo"
    | "midia"
    | "faq"
    | "brinquedos"
    | "auditoria"
    | "health";

export interface FestaDivinoListParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    include?: string[];
    filters?: Record<string, string | number | boolean | null | undefined>;
}

export interface FestaDivinoEdition {
    id: number;
    ano: number;
    titulo: string;
    data_inicio_programacao: string | null;
    data_fim_programacao: string | null;
    data_inicio_festejos: string | null;
    data_fim_festejos: string | null;
    bandeireira_imperial?: string | null;
    comissao_organizadora?: string | null;
    texto_convite_principal?: string | null;
    tema_geral?: string | null;
    imagem_cartaz_url?: string | null;
    eventos_count?: number;
    dias_count?: number;
}

export interface FestaDivinoEditionPayload {
    ano: number;
    titulo: string;
    data_inicio_programacao: string;
    data_fim_programacao: string;
    data_inicio_festejos: string;
    data_fim_festejos: string;
    bandeireira_imperial?: string | null;
    comissao_organizadora?: string | null;
    texto_convite_principal?: string | null;
    imagem_cartaz_url?: string | null;
    tema_geral?: string | null;
}

export interface FestaDivinoDiaFesta {
    id: number;
    edicao_id: number;
    data_evento: string | null;
    nome: string;
    descricao?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    edicao?: FestaDivinoEdition;
}

export interface FestaDivinoDiaFestaPayload {
    edicao_id: number;
    data_evento: string;
    nome: string;
    descricao?: string | null;
}

export interface FestaDivinoDashboard {
    mode: "read_only" | "write_enabled";
    active_edition: FestaDivinoEdition | null;
    counts: Record<string, number>;
    alerts: Record<string, { severity: "ok" | "info" | "warning" | "error"; count: number }>;
}

export interface FestaDivinoHealth {
    status: "ok" | "degraded";
    mode: "read_only" | "write_enabled";
    connections: {
        read: {
            ok: boolean;
            driver: string | null;
            version: string | null;
            latency_ms: number;
            error?: string;
        };
    };
    tables: Record<string, { exists: boolean; count: number | null }>;
}

export interface FestaDivinoAuditUser {
    id: number;
    name: string | null;
    email: string | null;
}

export interface FestaDivinoAuditLog {
    id: number;
    user_id?: number | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    remote_connection: string;
    request_id?: string | null;
    ip_address?: string | null;
    created_at?: string | null;
    user?: FestaDivinoAuditUser | null;
}

export interface FestaDivinoCategoriaEvento {
    id: number;
    nome: string;
    descricao?: string | null;
    icone?: string | null;
    cor?: string | null;
    eventos_count?: number;
}

export interface FestaDivinoLocal {
    id: number;
    nome: string;
    endereco?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    descricao?: string | null;
    imagem_url?: string | null;
    acessibilidade?: string | null;
    eventos_count?: number;
}

export interface FestaDivinoAtracao {
    id: number;
    nome: string;
    tipo?: string | null;
    descricao?: string | null;
    imagem_url?: string | null;
    eventos_count?: number;
    papel_no_evento?: string | null;
    ordem_apresentacao?: number | null;
}

export interface FestaDivinoEvento {
    id: number;
    edicao_id: number;
    titulo: string;
    subtitulo?: string | null;
    descricao?: string | null;
    data_evento: string | null;
    hora_inicio: string | null;
    hora_fim?: string | null;
    duracao_estimada_minutos?: number | null;
    local_id: number;
    categoria_id: number;
    tema?: string | null;
    publico_alvo?: string | null;
    evento_pago: boolean;
    valor_ingresso?: string | number | null;
    link_ingresso?: string | null;
    observacao_ingresso?: string | null;
    destaque: boolean;
    imagem_destaque_url?: string | null;
    organizador_responsavel?: string | null;
    tags: string[];
    ativo: boolean;
    local?: FestaDivinoLocal;
    categoria?: FestaDivinoCategoriaEvento;
    atracoes?: FestaDivinoAtracao[];
}

export interface FestaDivinoEventoAtracaoPayload {
    id: number;
    papel_no_evento?: string | null;
    ordem_apresentacao?: number | null;
}

export interface FestaDivinoEventoPayload {
    edicao_id: number;
    titulo: string;
    subtitulo?: string | null;
    descricao?: string | null;
    data_evento: string;
    hora_inicio: string;
    hora_fim?: string | null;
    duracao_estimada_minutos?: number | null;
    local_id: number;
    categoria_id: number;
    tema?: string | null;
    publico_alvo?: string | null;
    evento_pago?: boolean;
    valor_ingresso?: string | number | null;
    link_ingresso?: string | null;
    observacao_ingresso?: string | null;
    destaque?: boolean;
    imagem_destaque_url?: string | null;
    organizador_responsavel?: string | null;
    tags?: string[];
    ativo?: boolean;
    atracoes?: FestaDivinoEventoAtracaoPayload[];
}

export interface FestaDivinoCardapioCategoria {
    id: number;
    nome: string;
    icone?: string | null;
    produtos_count?: number;
}

export interface FestaDivinoCardapioCategoriaPayload {
    nome: string;
    icone: string;
}

export interface FestaDivinoProduto {
    id: number;
    nome: string;
    preco: string | number;
    foto?: string | null;
    categoria_id: number;
    categoria?: FestaDivinoCardapioCategoria;
}

export interface FestaDivinoProdutoPayload {
    nome: string;
    preco: string | number;
    foto?: string | null;
    categoria_id: number;
}

export interface FestaDivinoNoticia {
    id: number;
    titulo: string;
    linha_apoio?: string | null;
    url: string;
    data_hora_publicacao: string | null;
    thumb_url?: string | null;
    data_cadastro?: string | null;
}

export interface FestaDivinoNoticiaPayload {
    titulo: string;
    linha_apoio?: string | null;
    url: string;
    data_hora_publicacao: string;
    thumb_url?: string | null;
}

export interface FestaDivinoTexto {
    id: number;
    texto_curto: string;
    texto_detalhado: string;
    categoria: string;
    icone_categoria?: string | null;
    criado_em?: string | null;
    atualizado_em?: string | null;
}

export interface FestaDivinoTextoPayload {
    texto_curto: string;
    texto_detalhado: string;
    categoria: string;
    icone_categoria?: string | null;
}

export interface FestaDivinoVideo {
    id: string;
    titulo: string;
    descricao?: string | null;
    thumb_url?: string | null;
    watch_url: string;
    embed_url: string;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface FestaDivinoVideoPayload {
    id?: string;
    titulo: string;
    descricao?: string | null;
    thumb_url?: string | null;
}

export interface FestaDivinoFaqCategory {
    id: number;
    nome: string;
    icone?: string | null;
    ordem: number;
    ativo: boolean;
    items_count?: number;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface FestaDivinoFaqCategoryPayload {
    nome: string;
    icone: string;
    ordem: number;
    ativo: boolean;
}

export interface FestaDivinoFaqItem {
    id: number;
    category_id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
    ativo: boolean;
    category?: FestaDivinoFaqCategory;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface FestaDivinoFaqItemPayload {
    category_id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
    ativo: boolean;
}

export interface FestaDivinoReorderPayload {
    items: Array<{
        id: number;
        ordem: number;
    }>;
}

export interface FestaDivinoStatusPayload {
    ativo: boolean;
}

export interface FestaDivinoBrinquedo {
    id: number;
    nome: string;
    descricao: string;
    video: string;
    thumb_url: string;
    ativo: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface FestaDivinoBrinquedoPayload {
    nome: string;
    descricao: string;
    video: string;
    thumb_url: string;
    ativo: boolean;
}

export interface FestaDivinoCategoriaEventoPayload {
    nome: string;
    descricao?: string | null;
    icone?: string | null;
    cor?: string | null;
}

export interface FestaDivinoLocalPayload {
    nome: string;
    endereco?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    descricao?: string | null;
    imagem_url?: string | null;
    acessibilidade?: string | null;
}

export interface FestaDivinoAtracaoPayload {
    nome: string;
    tipo?: string | null;
    descricao?: string | null;
    imagem_url?: string | null;
}
