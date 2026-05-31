<?php

use App\Models\User;
use App\Models\UserPreference;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

beforeEach(function () {
    configureFestaDivinoReadConnection();
    createFestaDivinoReadSchema();
    seedFestaDivinoReadData();

    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

    $this->admin = User::factory()->create(['role' => 'admin', 'active' => true]);
    $this->admin->assignRole('admin');
    UserPreference::create(['user_id' => $this->admin->id]);
});

function configureFestaDivinoReadConnection(): void
{
    Config::set('database.connections.festa_divino_read', [
        'driver' => 'sqlite',
        'database' => ':memory:',
        'prefix' => '',
        'foreign_key_constraints' => true,
    ]);

    Config::set('database.connections.festa_divino_write', [
        'driver' => 'sqlite',
        'database' => ':memory:',
        'prefix' => '',
        'foreign_key_constraints' => true,
    ]);

    Config::set('festa-divino.read_connection', 'festa_divino_read');
    Config::set('festa-divino.write_connection', 'festa_divino_write');
    Config::set('festa-divino.write_enabled', false);

    DB::purge('festa_divino_read');
    DB::purge('festa_divino_write');
}

function createFestaDivinoReadSchema(): void
{
    $schema = Schema::connection('festa_divino_read');

    foreach ([
        'Evento_Atracao',
        'Programacao_Eventos',
        'Edicao_Festa',
        'Categorias_Evento',
        'Locais_Festa',
        'Atracoes',
        'dias_festa_evento',
        'categoria',
        'produto',
        'noticias_festa',
        'youtube_videos',
        'shorts_videos',
        'divino_textos',
        'faq_item',
        'faq_category',
        'brinquedos',
    ] as $table) {
        $schema->dropIfExists($table);
    }

    $schema->create('Edicao_Festa', function (Blueprint $table) {
        $table->increments('id_edicao');
        $table->unsignedSmallInteger('ano_festa');
        $table->string('titulo_festa');
        $table->date('data_inicio_programacao');
        $table->date('data_fim_programacao');
        $table->date('data_inicio_festejos');
        $table->date('data_fim_festejos');
        $table->string('bandeireira_imperial')->nullable();
        $table->text('comissao_organizadora')->nullable();
        $table->text('texto_convite_principal')->nullable();
        $table->string('imagem_cartaz_url')->nullable();
        $table->string('tema_geral_festa')->nullable();
    });

    $schema->create('Categorias_Evento', function (Blueprint $table) {
        $table->increments('id_categoria');
        $table->string('nome_categoria', 100);
        $table->text('descricao_categoria')->nullable();
        $table->string('icone_categoria', 100)->nullable();
        $table->string('cor_categoria', 7)->nullable();
    });

    $schema->create('Locais_Festa', function (Blueprint $table) {
        $table->increments('id_local');
        $table->string('nome_local');
        $table->string('endereco_local')->nullable();
        $table->decimal('latitude', 10, 8)->nullable();
        $table->decimal('longitude', 11, 8)->nullable();
        $table->text('descricao_local')->nullable();
        $table->string('imagem_local_url')->nullable();
        $table->text('acessibilidade_info')->nullable();
    });

    $schema->create('Atracoes', function (Blueprint $table) {
        $table->increments('id_atracao');
        $table->string('nome_atracao');
        $table->string('tipo_atracao', 100)->nullable();
        $table->text('descricao_atracao')->nullable();
        $table->string('imagem_atracao_url')->nullable();
    });

    $schema->create('Programacao_Eventos', function (Blueprint $table) {
        $table->increments('id_evento');
        $table->unsignedInteger('id_edicao_festa');
        $table->string('titulo_evento');
        $table->string('subtitulo_evento')->nullable();
        $table->text('descricao_geral_evento')->nullable();
        $table->date('data_evento');
        $table->time('hora_inicio');
        $table->time('hora_fim')->nullable();
        $table->integer('duracao_estimada_minutos')->nullable();
        $table->unsignedInteger('id_local');
        $table->unsignedInteger('id_categoria');
        $table->string('tema_evento')->nullable();
        $table->string('publico_alvo')->nullable();
        $table->boolean('evento_pago')->default(false);
        $table->decimal('valor_ingresso', 10, 2)->nullable();
        $table->string('link_ingresso')->nullable();
        $table->text('observacao_ingresso')->nullable();
        $table->boolean('evento_destaque')->default(false);
        $table->string('imagem_destaque_url')->nullable();
        $table->text('organizador_responsavel')->nullable();
        $table->longText('tags')->nullable();
        $table->boolean('ativo')->default(true);
        $table->timestamp('data_criacao')->nullable();
        $table->timestamp('data_atualizacao')->nullable();
    });

    $schema->create('Evento_Atracao', function (Blueprint $table) {
        $table->increments('id_evento_atracao');
        $table->unsignedInteger('id_evento');
        $table->unsignedInteger('id_atracao');
        $table->string('papel_no_evento', 100)->nullable();
        $table->integer('ordem_apresentacao')->default(0);
    });

    $schema->create('dias_festa_evento', function (Blueprint $table) {
        $table->increments('id_dia_festa_evento');
        $table->unsignedInteger('id_edicao');
        $table->date('data_evento');
        $table->string('nome_principal_evento_dia')->nullable();
        $table->text('descricao_dia')->nullable();
        $table->timestamps();
    });

    $schema->create('categoria', function (Blueprint $table) {
        $table->increments('id_categoria');
        $table->string('nome_categoria', 100);
        $table->string('icone_categoria', 100);
    });

    $schema->create('produto', function (Blueprint $table) {
        $table->increments('id_produto');
        $table->string('nome_produto', 100);
        $table->decimal('preco', 10, 2);
        $table->string('foto')->nullable();
        $table->unsignedInteger('id_categoria');
    });

    $schema->create('noticias_festa', function (Blueprint $table) {
        $table->increments('id_noticia');
        $table->string('titulo');
        $table->text('linha_apoio')->nullable();
        $table->string('url_noticia', 512);
        $table->dateTime('data_hora_publicacao');
        $table->string('url_thumb', 512)->nullable();
        $table->timestamp('data_cadastro')->nullable();
    });

    $schema->create('youtube_videos', function (Blueprint $table) {
        $table->string('id', 20)->primary();
        $table->string('title');
        $table->text('description');
        $table->timestamp('create_at')->nullable();
        $table->timestamp('update_at')->nullable();
        $table->string('thumb_url')->nullable();
    });

    $schema->create('shorts_videos', function (Blueprint $table) {
        $table->string('id', 64)->primary();
        $table->text('title');
        $table->dateTime('created_at')->nullable();
        $table->dateTime('updated_at')->nullable();
        $table->string('thumb_url')->nullable();
    });

    $schema->create('divino_textos', function (Blueprint $table) {
        $table->increments('id');
        $table->string('texto_curto');
        $table->text('texto_detalhado');
        $table->string('categoria', 100);
        $table->string('icone_categoria', 100)->nullable();
        $table->dateTime('criado_em')->nullable();
        $table->dateTime('atualizado_em')->nullable();
    });

    $schema->create('faq_category', function (Blueprint $table) {
        $table->increments('id');
        $table->string('name', 100);
        $table->string('icon', 50);
        $table->unsignedSmallInteger('display_order')->default(1);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    $schema->create('faq_item', function (Blueprint $table) {
        $table->id();
        $table->unsignedInteger('category_id');
        $table->text('question');
        $table->text('answer');
        $table->unsignedSmallInteger('display_order')->default(1);
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    $schema->create('brinquedos', function (Blueprint $table) {
        $table->increments('id');
        $table->string('nome', 100);
        $table->string('descricao');
        $table->string('video');
        $table->boolean('active')->default(true);
        $table->timestamps();
        $table->string('thumb_url');
    });
}

function seedFestaDivinoReadData(): void
{
    $db = DB::connection('festa_divino_read');

    $db->table('Edicao_Festa')->insert([
        'id_edicao' => 1,
        'ano_festa' => 2026,
        'titulo_festa' => 'Festa do Divino 2026',
        'data_inicio_programacao' => '2026-05-31',
        'data_fim_programacao' => '2026-06-08',
        'data_inicio_festejos' => '2026-06-05',
        'data_fim_festejos' => '2026-06-08',
        'tema_geral_festa' => 'Unidade e fe',
    ]);

    $db->table('Categorias_Evento')->insert([
        'id_categoria' => 1,
        'nome_categoria' => 'Missa',
        'descricao_categoria' => 'Celebracoes religiosas',
        'icone_categoria' => 'Church',
        'cor_categoria' => '#AA0000',
    ]);

    $db->table('Locais_Festa')->insert([
        'id_local' => 1,
        'nome_local' => 'Igreja Matriz',
        'endereco_local' => 'Centro',
        'latitude' => -27.24000000,
        'longitude' => -48.63000000,
    ]);

    $db->table('Atracoes')->insert([
        'id_atracao' => 1,
        'nome_atracao' => 'Coral Paroquial',
        'tipo_atracao' => 'Musica',
    ]);

    $db->table('Programacao_Eventos')->insert([
        [
            'id_evento' => 1,
            'id_edicao_festa' => 1,
            'titulo_evento' => 'Missa de Abertura',
            'subtitulo_evento' => null,
            'descricao_geral_evento' => null,
            'data_evento' => '2026-06-05',
            'hora_inicio' => '19:00:00',
            'hora_fim' => '20:00:00',
            'duracao_estimada_minutos' => 60,
            'id_local' => 1,
            'id_categoria' => 1,
            'tema_evento' => null,
            'publico_alvo' => null,
            'evento_pago' => false,
            'valor_ingresso' => null,
            'link_ingresso' => null,
            'observacao_ingresso' => null,
            'evento_destaque' => true,
            'imagem_destaque_url' => null,
            'organizador_responsavel' => null,
            'tags' => json_encode(['missa', 'abertura']),
            'ativo' => true,
            'data_criacao' => '2026-05-01 10:00:00',
            'data_atualizacao' => '2026-05-01 10:00:00',
        ],
        [
            'id_evento' => 2,
            'id_edicao_festa' => 1,
            'titulo_evento' => 'Procissao',
            'subtitulo_evento' => null,
            'descricao_geral_evento' => null,
            'data_evento' => '2026-06-06',
            'hora_inicio' => '10:00:00',
            'hora_fim' => null,
            'duracao_estimada_minutos' => null,
            'id_local' => 1,
            'id_categoria' => 1,
            'tema_evento' => null,
            'publico_alvo' => null,
            'evento_pago' => false,
            'valor_ingresso' => null,
            'link_ingresso' => null,
            'observacao_ingresso' => null,
            'evento_destaque' => false,
            'imagem_destaque_url' => null,
            'organizador_responsavel' => null,
            'tags' => json_encode(['procissao']),
            'ativo' => true,
            'data_criacao' => '2026-05-01 10:00:00',
            'data_atualizacao' => '2026-05-01 10:00:00',
        ],
    ]);

    $db->table('Evento_Atracao')->insert([
        'id_evento_atracao' => 1,
        'id_evento' => 1,
        'id_atracao' => 1,
        'papel_no_evento' => 'Participacao',
        'ordem_apresentacao' => 1,
    ]);

    $db->table('categoria')->insert([
        'id_categoria' => 1,
        'nome_categoria' => 'Comidas',
        'icone_categoria' => 'Utensils',
    ]);

    $db->table('produto')->insert([
        'id_produto' => 1,
        'nome_produto' => 'Pastel',
        'preco' => 12.50,
        'foto' => '/assets/pastel.jpg',
        'id_categoria' => 1,
    ]);

    $db->table('noticias_festa')->insert([
        'id_noticia' => 1,
        'titulo' => 'Programacao oficial divulgada',
        'linha_apoio' => 'Confira os principais eventos.',
        'url_noticia' => 'https://festadodivinovip.com.br/noticias/programacao',
        'data_hora_publicacao' => '2026-05-20 09:30:00',
        'url_thumb' => 'https://festadodivinovip.com.br/assets/noticia.jpg',
        'data_cadastro' => '2026-05-20 09:00:00',
    ]);

    $db->table('divino_textos')->insert([
        'id' => 1,
        'texto_curto' => 'Historia da festa',
        'texto_detalhado' => 'Texto detalhado sobre a tradicao.',
        'categoria' => 'Historia',
        'icone_categoria' => 'BookOpen',
        'criado_em' => '2026-05-01 10:00:00',
        'atualizado_em' => '2026-05-02 10:00:00',
    ]);

    $db->table('youtube_videos')->insert([
        'id' => 'abc123DIVINO',
        'title' => 'Video oficial',
        'description' => 'Descricao do video oficial.',
        'create_at' => '2026-05-21 11:00:00',
        'update_at' => '2026-05-21 11:30:00',
        'thumb_url' => 'https://img.youtube.com/vi/abc123DIVINO/hqdefault.jpg',
    ]);

    $db->table('shorts_videos')->insert([
        'id' => 'shorts123DIVINO',
        'title' => 'Short oficial',
        'created_at' => '2026-05-22 12:00:00',
        'updated_at' => '2026-05-22 12:30:00',
        'thumb_url' => 'https://img.youtube.com/vi/shorts123DIVINO/hqdefault.jpg',
    ]);

    $db->table('faq_category')->insert([
        'id' => 1,
        'name' => 'Geral',
        'icon' => 'HelpCircle',
        'display_order' => 1,
        'is_active' => true,
        'created_at' => '2026-05-01 10:00:00',
        'updated_at' => '2026-05-01 10:00:00',
    ]);

    $db->table('faq_item')->insert([
        'id' => 1,
        'category_id' => 1,
        'question' => 'Quando comeca?',
        'answer' => 'No dia 31 de maio.',
        'display_order' => 1,
        'is_active' => true,
        'created_at' => '2026-05-01 10:00:00',
        'updated_at' => '2026-05-01 10:00:00',
    ]);

    $db->table('brinquedos')->insert([
        'id' => 1,
        'nome' => 'Roda gigante',
        'descricao' => 'Brinquedo classico',
        'video' => '/assets/videos/roda.mp4',
        'active' => true,
        'created_at' => '2026-05-01 10:00:00',
        'updated_at' => '2026-05-01 10:00:00',
        'thumb_url' => '/assets/images/roda.jpg',
    ]);
}

test('dashboard exige autenticacao', function () {
    $this->getJson('/api/v1/festa-divino/dashboard')
        ->assertUnauthorized();
});

test('dashboard exige permissao de visualizacao', function () {
    $user = User::factory()->create(['role' => 'analyst', 'active' => true]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/festa-divino/dashboard')
        ->assertForbidden();
});

test('dashboard read-only retorna contagens e alertas operacionais', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/dashboard')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.mode', 'read_only')
        ->assertJsonPath('data.active_edition.ano', 2026)
        ->assertJsonPath('data.counts.programacao_eventos', 2)
        ->assertJsonPath('data.counts.produtos', 1)
        ->assertJsonPath('data.alerts.events_without_attractions.count', 1);
});

test('lista eventos da programacao com filtros e payload normalizado', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/eventos?filter[data_evento]=2026-06-05&include=local,categoria,atracoes')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.titulo', 'Missa de Abertura')
        ->assertJsonPath('data.0.data_evento', '2026-06-05')
        ->assertJsonPath('data.0.ativo', true)
        ->assertJsonPath('data.0.destaque', true)
        ->assertJsonPath('data.0.tags.0', 'missa')
        ->assertJsonPath('data.0.local.nome', 'Igreja Matriz')
        ->assertJsonPath('data.0.categoria.nome', 'Missa')
        ->assertJsonPath('data.0.atracoes.0.nome', 'Coral Paroquial');
});

test('lista categorias de eventos com contagem e filtro de busca', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/categorias?filter[search]=Mis')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Missa')
        ->assertJsonPath('data.0.cor', '#AA0000')
        ->assertJsonPath('data.0.eventos_count', 2);
});

test('busca categoria de evento por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/categorias/1')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.nome', 'Missa')
        ->assertJsonPath('data.eventos_count', 2);
});

test('lista locais com contagem e filtro de busca', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/locais?filter[search]=Matriz')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Igreja Matriz')
        ->assertJsonPath('data.0.latitude', '-27.24000000')
        ->assertJsonPath('data.0.eventos_count', 2);
});

test('busca local por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/locais/1')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.nome', 'Igreja Matriz')
        ->assertJsonPath('data.eventos_count', 2);
});

test('lista atracoes com contagem e filtro de busca', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/atracoes?filter[search]=Coral')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Coral Paroquial')
        ->assertJsonPath('data.0.tipo', 'Musica')
        ->assertJsonPath('data.0.eventos_count', 1);
});

test('busca atracao por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/atracoes/1')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.nome', 'Coral Paroquial')
        ->assertJsonPath('data.eventos_count', 1);
});

test('lista categorias do cardapio com contagem de produtos', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/cardapio/categorias?filter[search]=Com')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Comidas')
        ->assertJsonPath('data.0.icone', 'Utensils')
        ->assertJsonPath('data.0.produtos_count', 1);
});

test('lista produtos do cardapio com categoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/cardapio/produtos?filter[search]=Pastel&include=categoria')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Pastel')
        ->assertJsonPath('data.0.preco', '12.50')
        ->assertJsonPath('data.0.categoria.nome', 'Comidas');
});

test('busca produto do cardapio por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/cardapio/produtos/1?include=categoria')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.nome', 'Pastel')
        ->assertJsonPath('data.categoria.id', 1);
});

test('lista noticias com ordenacao por publicacao', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/conteudo/noticias?filter[search]=oficial')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.titulo', 'Programacao oficial divulgada')
        ->assertJsonPath('data.0.url', 'https://festadodivinovip.com.br/noticias/programacao')
        ->assertJsonPath('data.0.thumb_url', 'https://festadodivinovip.com.br/assets/noticia.jpg');
});

test('lista textos editoriais por categoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/conteudo/textos?filter[categoria]=Historia')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.texto_curto', 'Historia da festa')
        ->assertJsonPath('data.0.categoria', 'Historia');
});

test('lista videos com urls derivadas', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/midia/videos?filter[search]=oficial')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 'abc123DIVINO')
        ->assertJsonPath('data.0.titulo', 'Video oficial')
        ->assertJsonPath('data.0.watch_url', 'https://www.youtube.com/watch?v=abc123DIVINO')
        ->assertJsonPath('data.0.embed_url', 'https://www.youtube.com/embed/abc123DIVINO');
});

test('lista shorts com urls derivadas', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/midia/shorts?filter[search]=oficial')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 'shorts123DIVINO')
        ->assertJsonPath('data.0.titulo', 'Short oficial')
        ->assertJsonPath('data.0.watch_url', 'https://www.youtube.com/shorts/shorts123DIVINO')
        ->assertJsonPath('data.0.embed_url', 'https://www.youtube.com/embed/shorts123DIVINO');
});

test('lista categorias do faq com contagem de itens', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/faq/categorias?filter[is_active]=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Geral')
        ->assertJsonPath('data.0.icone', 'HelpCircle')
        ->assertJsonPath('data.0.ordem', 1)
        ->assertJsonPath('data.0.ativo', true)
        ->assertJsonPath('data.0.items_count', 1);
});

test('lista perguntas do faq com categoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/faq/items?filter[category_id]=1&include=category')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.pergunta', 'Quando comeca?')
        ->assertJsonPath('data.0.resposta', 'No dia 31 de maio.')
        ->assertJsonPath('data.0.ativo', true)
        ->assertJsonPath('data.0.category.nome', 'Geral');
});

test('busca pergunta do faq por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/faq/items/1?include=category')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.category.id', 1)
        ->assertJsonPath('data.ordem', 1);
});

test('crud de categoria do faq valida ativo ordem dependencias reorder e auditoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/categorias', [
            'nome' => 'Acesso',
            'icone' => 'MapPin',
            'ordem' => 2,
            'ativo' => true,
        ])
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/categorias', [
            'nome' => 'Acesso',
            'icone' => 'MapPin',
            'ordem' => 2,
            'ativo' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Acesso')
        ->assertJsonPath('data.ordem', 2)
        ->assertJsonPath('data.ativo', true);

    $categoryId = DB::connection('festa_divino_read')
        ->table('faq_category')
        ->where('name', 'Acesso')
        ->value('id');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/faq/categorias/$categoryId", [
            'nome' => 'Acesso e estrutura',
            'icone' => 'Map',
            'ordem' => 3,
            'ativo' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Acesso e estrutura')
        ->assertJsonPath('data.ativo', false);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/api/v1/festa-divino/faq/categorias/$categoryId/status", ['ativo' => true])
        ->assertOk()
        ->assertJsonPath('data.ativo', true);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson('/api/v1/festa-divino/faq/categorias/reorder', [
            'items' => [
                ['id' => 1, 'ordem' => 2],
                ['id' => $categoryId, 'ordem' => 1],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.0.id', $categoryId)
        ->assertJsonPath('data.0.ordem', 1);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/categorias', [
            'nome' => '',
            'icone' => '',
            'ordem' => 0,
            'ativo' => 'sim',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome', 'icone', 'ordem', 'ativo']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/faq/categorias/1')
        ->assertStatus(409)
        ->assertJsonPath('code', 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES');

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/faq/categorias/$categoryId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('faq_category')->whereKey($categoryId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'faq_categoria')->count())->toBe(5);
});

test('crud de pergunta do faq valida categoria status reorder e auditoria', function () {
    $payload = [
        'category_id' => 1,
        'pergunta' => 'Onde estacionar?',
        'resposta' => 'Use os estacionamentos sinalizados no entorno da festa.',
        'ordem' => 2,
        'ativo' => true,
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/items', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/items', $payload)
        ->assertCreated()
        ->assertJsonPath('data.pergunta', 'Onde estacionar?')
        ->assertJsonPath('data.category_id', 1)
        ->assertJsonPath('data.ativo', true);

    $itemId = DB::connection('festa_divino_read')
        ->table('faq_item')
        ->where('question', 'Onde estacionar?')
        ->value('id');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/faq/items/$itemId", [
            'category_id' => 1,
            'pergunta' => 'Onde posso estacionar?',
            'resposta' => 'Procure as areas sinalizadas pela organizacao.',
            'ordem' => 3,
            'ativo' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.pergunta', 'Onde posso estacionar?')
        ->assertJsonPath('data.ativo', false);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/api/v1/festa-divino/faq/items/$itemId/status", ['ativo' => true])
        ->assertOk()
        ->assertJsonPath('data.ativo', true);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson('/api/v1/festa-divino/faq/items/reorder', [
            'items' => [
                ['id' => 1, 'ordem' => 2],
                ['id' => $itemId, 'ordem' => 1],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.0.id', $itemId)
        ->assertJsonPath('data.0.ordem', 1);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/faq/items', [
            'category_id' => 999,
            'pergunta' => '',
            'resposta' => '',
            'ordem' => 0,
            'ativo' => 'sim',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id', 'pergunta', 'resposta', 'ordem', 'ativo']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/faq/items/$itemId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('faq_item')->whereKey($itemId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'faq_item')->count())->toBe(5);
});

test('lista brinquedos com filtro ativo', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/brinquedos?filter[active]=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.nome', 'Roda gigante')
        ->assertJsonPath('data.0.video', '/assets/videos/roda.mp4')
        ->assertJsonPath('data.0.thumb_url', '/assets/images/roda.jpg')
        ->assertJsonPath('data.0.ativo', true);
});

test('busca brinquedo por id', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/brinquedos/1')
        ->assertOk()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.nome', 'Roda gigante')
        ->assertJsonPath('data.ativo', true);
});

test('crud de brinquedo valida midia status e auditoria', function () {
    $payload = [
        'nome' => 'Carrossel',
        'descricao' => 'Brinquedo familiar para todas as idades.',
        'video' => '/assets/videos/carrossel.mp4',
        'thumb_url' => '/assets/images/carrossel.jpg',
        'ativo' => true,
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/brinquedos', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/brinquedos', $payload)
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Carrossel')
        ->assertJsonPath('data.video', '/assets/videos/carrossel.mp4')
        ->assertJsonPath('data.thumb_url', '/assets/images/carrossel.jpg')
        ->assertJsonPath('data.ativo', true);

    $brinquedoId = DB::connection('festa_divino_read')
        ->table('brinquedos')
        ->where('nome', 'Carrossel')
        ->value('id');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/brinquedos/$brinquedoId", [
            'nome' => 'Carrossel iluminado',
            'descricao' => 'Brinquedo familiar com iluminacao especial.',
            'video' => 'https://festadodivinovip.com.br/assets/videos/carrossel.mp4',
            'thumb_url' => 'https://festadodivinovip.com.br/assets/images/carrossel.jpg',
            'ativo' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Carrossel iluminado')
        ->assertJsonPath('data.ativo', false);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/api/v1/festa-divino/brinquedos/$brinquedoId/status", ['ativo' => true])
        ->assertOk()
        ->assertJsonPath('data.ativo', true);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/brinquedos', [
            'nome' => '',
            'descricao' => '',
            'video' => 'video invalido',
            'thumb_url' => 'imagem invalida',
            'ativo' => 'sim',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome', 'descricao', 'video', 'thumb_url', 'ativo']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/brinquedos/$brinquedoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('brinquedos')->whereKey($brinquedoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'brinquedo')->count())->toBe(4);
});

test('health check valida conexao e tabelas esperadas', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/health')
        ->assertOk()
        ->assertJsonPath('data.status', 'ok')
        ->assertJsonPath('data.mode', 'read_only')
        ->assertJsonPath('data.connections.read.ok', true)
        ->assertJsonPath('data.tables.Programacao_Eventos.exists', true)
        ->assertJsonPath('data.tables.fotos.exists', false);
});

test('auditoria exige permissao especifica', function () {
    $user = User::factory()->create(['role' => 'journalist', 'active' => true]);
    $user->assignRole('journalist');

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/festa-divino/audit-logs')
        ->assertForbidden();
});

test('lista auditoria com filtros e payload seguro', function () {
    DB::table('festa_divino_audit_logs')->insert([
        [
            'user_id' => $this->admin->id,
            'action' => 'update',
            'entity_type' => 'brinquedo',
            'entity_id' => '1',
            'old_values' => json_encode(['nome' => 'Roda gigante', 'active' => false]),
            'new_values' => json_encode(['nome' => 'Roda gigante', 'active' => true]),
            'remote_connection' => 'festa_divino_write',
            'request_id' => 'req-brinquedo',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Teste local',
            'created_at' => now()->subDay(),
        ],
        [
            'user_id' => null,
            'action' => 'delete',
            'entity_type' => 'faq_item',
            'entity_id' => '2',
            'old_values' => json_encode(['question' => 'Pergunta antiga']),
            'new_values' => null,
            'remote_connection' => 'festa_divino_write',
            'request_id' => 'req-faq',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Teste local',
            'created_at' => now(),
        ],
    ]);

    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/audit-logs?filter[entity_type]=brinquedo&include=user&sort=-created_at')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.action', 'update')
        ->assertJsonPath('data.0.entity_type', 'brinquedo')
        ->assertJsonPath('data.0.entity_id', '1')
        ->assertJsonPath('data.0.old_values.nome', 'Roda gigante')
        ->assertJsonPath('data.0.new_values.active', true)
        ->assertJsonPath('data.0.user.id', $this->admin->id)
        ->assertJsonMissingPath('data.0.user_agent');
});

test('write guard bloqueia mutacoes quando modulo esta read-only', function () {
    Config::set('festa-divino.write_enabled', false);

    expect(fn () => FestaDivinoWriteGuard::assertCanWrite())
        ->toThrow(HttpException::class);
});

test('write guard permite mutacoes quando escrita esta habilitada', function () {
    Config::set('festa-divino.write_enabled', true);

    FestaDivinoWriteGuard::assertCanWrite();

    expect(true)->toBeTrue();
});

function enableFestaDivinoWritesForTest(): void
{
    Config::set('festa-divino.write_enabled', true);
    Config::set('festa-divino.write_connection', 'festa_divino_read');
}

test('crud de edicao da festa valida datas dependencias e auditoria', function () {
    $payload = [
        'ano' => 2027,
        'titulo' => 'Festa do Divino 2027',
        'data_inicio_programacao' => '2027-05-30',
        'data_fim_programacao' => '2027-06-07',
        'data_inicio_festejos' => '2027-06-04',
        'data_fim_festejos' => '2027-06-07',
        'bandeireira_imperial' => 'Maria da Silva',
        'comissao_organizadora' => 'Equipe paroquial',
        'texto_convite_principal' => 'Venha participar da festa.',
        'imagem_cartaz_url' => 'https://festadodivinovip.com.br/cartaz-2027.jpg',
        'tema_geral' => 'Fe e comunidade',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/edicoes', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/edicoes?sort=-ano_festa')
        ->assertOk()
        ->assertJsonPath('data.0.titulo', 'Festa do Divino 2026');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/edicoes', $payload)
        ->assertCreated()
        ->assertJsonPath('data.ano', 2027)
        ->assertJsonPath('data.comissao_organizadora', 'Equipe paroquial')
        ->assertJsonPath('data.texto_convite_principal', 'Venha participar da festa.');

    $edicaoId = DB::connection('festa_divino_read')
        ->table('Edicao_Festa')
        ->where('ano_festa', 2027)
        ->value('id_edicao');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/edicoes/$edicaoId", array_merge($payload, [
            'titulo' => 'Festa do Divino 2027 atualizada',
            'tema_geral' => null,
        ]))
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Festa do Divino 2027 atualizada')
        ->assertJsonPath('data.tema_geral', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/edicoes', array_merge($payload, [
            'ano' => 2028,
            'data_fim_programacao' => '2027-05-29',
            'data_fim_festejos' => '2027-06-03',
            'imagem_cartaz_url' => 'cartaz-sem-protocolo',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_fim_programacao', 'data_fim_festejos', 'imagem_cartaz_url']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/edicoes/1')
        ->assertStatus(409)
        ->assertJsonPath('code', 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES');

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/edicoes/$edicaoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('Edicao_Festa')->whereKey($edicaoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'edicao_festa')->count())->toBe(3);
});

test('crud de dia da festa valida periodo da edicao e auditoria', function () {
    $payload = [
        'edicao_id' => 1,
        'data_evento' => '2026-06-05',
        'nome' => 'Abertura dos festejos',
        'descricao' => 'Primeiro dia da programacao principal.',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/dias', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->getJson('/api/v1/festa-divino/programacao/dias')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/dias', $payload)
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Abertura dos festejos')
        ->assertJsonPath('data.edicao.id', 1);

    $diaId = DB::connection('festa_divino_read')
        ->table('dias_festa_evento')
        ->where('nome_principal_evento_dia', 'Abertura dos festejos')
        ->value('id_dia_festa_evento');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/programacao/dias/$diaId", array_merge($payload, [
            'data_evento' => '2026-06-06',
            'nome' => 'Sabado da festa',
            'descricao' => null,
        ]))
        ->assertOk()
        ->assertJsonPath('data.data_evento', '2026-06-06')
        ->assertJsonPath('data.descricao', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/dias', [
            'edicao_id' => 999,
            'data_evento' => 'data-invalida',
            'nome' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['edicao_id', 'data_evento', 'nome']);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/dias', array_merge($payload, [
            'data_evento' => '2026-06-09',
            'nome' => 'Fora do periodo',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_evento']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/programacao/dias/$diaId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('dias_festa_evento')->whereKey($diaId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'dia_festa')->count())->toBe(3);
});

test('crud de categoria de evento respeita write guard validacao auditoria e dependentes', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/categorias', [
            'nome' => 'Cortejo',
            'cor' => '#123ABC',
        ])
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/categorias', [
            'nome' => 'Cortejo',
            'descricao' => 'Cortejos e encontros culturais',
            'icone' => 'Music',
            'cor' => '#123ABC',
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Cortejo')
        ->assertJsonPath('data.cor', '#123ABC');

    $categoryId = DB::connection('festa_divino_read')
        ->table('Categorias_Evento')
        ->where('nome_categoria', 'Cortejo')
        ->value('id_categoria');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/programacao/categorias/$categoryId", [
            'nome' => 'Cortejo Imperial',
            'descricao' => 'Cortejos oficiais',
            'icone' => 'Crown',
            'cor' => '#654321',
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Cortejo Imperial')
        ->assertJsonPath('data.cor', '#654321');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/categorias', [
            'nome' => 'Cor invalida',
            'cor' => 'vermelho',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['cor']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/programacao/categorias/1')
        ->assertStatus(409)
        ->assertJsonPath('code', 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES');

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/programacao/categorias/$categoryId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('Categorias_Evento')->whereKey($categoryId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'programacao_categoria')->count())->toBe(3);
});

test('crud de local valida coordenadas bloqueia dependentes e audita', function () {
    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/locais', [
            'nome' => 'Parque Central',
            'endereco' => 'Rua Principal',
            'latitude' => -27.12345678,
            'longitude' => -48.12345678,
            'descricao' => 'Area externa da festa',
            'imagem_url' => 'https://example.com/parque.jpg',
            'acessibilidade' => 'Acesso por rampa',
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Parque Central')
        ->assertJsonPath('data.latitude', '-27.12345678');

    $localId = DB::connection('festa_divino_read')
        ->table('Locais_Festa')
        ->where('nome_local', 'Parque Central')
        ->value('id_local');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/programacao/locais/$localId", [
            'nome' => 'Parque Central Atualizado',
            'endereco' => 'Rua Principal, 100',
            'latitude' => -27.87654321,
            'longitude' => -48.87654321,
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Parque Central Atualizado');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/locais', [
            'nome' => 'Local invalido',
            'latitude' => -100,
            'longitude' => -48,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['latitude']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/programacao/locais/1')
        ->assertStatus(409);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/programacao/locais/$localId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('Locais_Festa')->whereKey($localId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'programacao_local')->count())->toBe(3);
});

test('crud de atracao bloqueia dependentes e audita', function () {
    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/atracoes', [
            'nome' => 'Banda do Divino',
            'tipo' => 'Musica',
            'descricao' => 'Apresentacao cultural',
            'imagem_url' => 'https://example.com/banda.jpg',
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Banda do Divino');

    $atracaoId = DB::connection('festa_divino_read')
        ->table('Atracoes')
        ->where('nome_atracao', 'Banda do Divino')
        ->value('id_atracao');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/programacao/atracoes/$atracaoId", [
            'nome' => 'Banda Imperial do Divino',
            'tipo' => 'Musica',
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Banda Imperial do Divino');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/atracoes', [
            'nome' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/programacao/atracoes/1')
        ->assertStatus(409);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/programacao/atracoes/$atracaoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('Atracoes')->whereKey($atracaoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'programacao_atracao')->count())->toBe(3);
});

test('crud de evento sincroniza atracoes status exclusao e auditoria', function () {
    $payload = [
        'edicao_id' => 1,
        'titulo' => 'Show da Banda do Divino',
        'subtitulo' => 'Palco principal',
        'descricao' => 'Apresentacao musical aberta ao publico.',
        'data_evento' => '2026-06-07',
        'hora_inicio' => '21:00',
        'hora_fim' => '23:00',
        'duracao_estimada_minutos' => 120,
        'local_id' => 1,
        'categoria_id' => 1,
        'tema' => 'Celebracao',
        'publico_alvo' => 'Familias',
        'evento_pago' => true,
        'valor_ingresso' => '15.50',
        'link_ingresso' => 'https://festadodivinovip.com.br/ingressos',
        'observacao_ingresso' => 'Venda antecipada.',
        'destaque' => true,
        'imagem_destaque_url' => 'https://festadodivinovip.com.br/assets/show.jpg',
        'organizador_responsavel' => 'Comissao da festa',
        'tags' => ['show', 'domingo'],
        'ativo' => true,
        'atracoes' => [
            ['id' => 1, 'papel_no_evento' => 'Show principal', 'ordem_apresentacao' => 1],
        ],
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/eventos', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    DB::connection('festa_divino_read')->table('Atracoes')->insert([
        'id_atracao' => 2,
        'nome_atracao' => 'Grupo Folclorico',
        'tipo_atracao' => 'Danca',
    ]);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/eventos', $payload)
        ->assertCreated()
        ->assertJsonPath('data.titulo', 'Show da Banda do Divino')
        ->assertJsonPath('data.hora_inicio', '21:00:00')
        ->assertJsonPath('data.evento_pago', true)
        ->assertJsonPath('data.destaque', true)
        ->assertJsonPath('data.tags.0', 'show')
        ->assertJsonPath('data.atracoes.0.id', 1);

    $eventoId = DB::connection('festa_divino_read')
        ->table('Programacao_Eventos')
        ->where('titulo_evento', 'Show da Banda do Divino')
        ->value('id_evento');

    expect(DB::connection('festa_divino_read')->table('Evento_Atracao')->where('id_evento', $eventoId)->count())->toBe(1);

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/programacao/eventos/$eventoId", array_merge($payload, [
            'titulo' => 'Show Cultural do Divino',
            'hora_inicio' => '20:30',
            'hora_fim' => '22:30',
            'evento_pago' => false,
            'valor_ingresso' => null,
            'link_ingresso' => null,
            'destaque' => false,
            'tags' => ['cultural'],
            'atracoes' => [
                ['id' => 2, 'papel_no_evento' => 'Abertura', 'ordem_apresentacao' => 1],
            ],
        ]))
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Show Cultural do Divino')
        ->assertJsonPath('data.evento_pago', false)
        ->assertJsonPath('data.destaque', false)
        ->assertJsonPath('data.tags.0', 'cultural')
        ->assertJsonPath('data.atracoes.0.id', 2);

    expect(DB::connection('festa_divino_read')->table('Evento_Atracao')->where('id_evento', $eventoId)->pluck('id_atracao')->all())->toBe([2]);

    $this->actingAs($this->admin, 'sanctum')
        ->patchJson("/api/v1/festa-divino/programacao/eventos/$eventoId/status", [
            'ativo' => false,
            'destaque' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.ativo', false)
        ->assertJsonPath('data.destaque', true);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/programacao/eventos/$eventoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('Programacao_Eventos')->where('id_evento', $eventoId)->exists())->toBeFalse();
    expect(DB::connection('festa_divino_read')->table('Evento_Atracao')->where('id_evento', $eventoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'programacao_evento')->count())->toBe(4);
});

test('crud de evento valida relacionamentos horarios e atracoes duplicadas', function () {
    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/programacao/eventos', [
            'edicao_id' => 999,
            'titulo' => '',
            'data_evento' => '2026-06-07',
            'hora_inicio' => '21:00',
            'hora_fim' => '20:00',
            'local_id' => 999,
            'categoria_id' => 999,
            'tags' => ['ok', ''],
            'atracoes' => [
                ['id' => 1],
                ['id' => 1],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'edicao_id',
            'titulo',
            'hora_fim',
            'local_id',
            'categoria_id',
            'tags.1',
            'atracoes',
        ]);
});

test('crud de categoria do cardapio respeita write guard validacao dependentes e auditoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/categorias', [
            'nome' => 'Bebidas',
            'icone' => 'CupSoda',
        ])
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/categorias', [
            'nome' => 'Bebidas',
            'icone' => 'CupSoda',
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Bebidas')
        ->assertJsonPath('data.icone', 'CupSoda');

    $categoryId = DB::connection('festa_divino_read')
        ->table('categoria')
        ->where('nome_categoria', 'Bebidas')
        ->value('id_categoria');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/cardapio/categorias/$categoryId", [
            'nome' => 'Bebidas geladas',
            'icone' => 'GlassWater',
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Bebidas geladas')
        ->assertJsonPath('data.icone', 'GlassWater');

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/categorias', [
            'nome' => '',
            'icone' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome', 'icone']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/cardapio/categorias/1')
        ->assertStatus(409)
        ->assertJsonPath('code', 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES');

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/cardapio/categorias/$categoryId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('categoria')->whereKey($categoryId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'cardapio_categoria')->count())->toBe(3);
});

test('crud de produto do cardapio valida categoria preco e auditoria', function () {
    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/produtos', [
            'nome' => 'Cachorro quente',
            'preco' => '18.00',
            'foto' => '/assets/cachorro.jpg',
            'categoria_id' => 1,
        ])
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/produtos', [
            'nome' => 'Cachorro quente',
            'preco' => '18.00',
            'foto' => '/assets/cachorro.jpg',
            'categoria_id' => 1,
        ])
        ->assertCreated()
        ->assertJsonPath('data.nome', 'Cachorro quente')
        ->assertJsonPath('data.preco', '18.00')
        ->assertJsonPath('data.categoria.id', 1);

    $produtoId = DB::connection('festa_divino_read')
        ->table('produto')
        ->where('nome_produto', 'Cachorro quente')
        ->value('id_produto');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/cardapio/produtos/$produtoId", [
            'nome' => 'Cachorro quente completo',
            'preco' => '22.50',
            'foto' => null,
            'categoria_id' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Cachorro quente completo')
        ->assertJsonPath('data.preco', '22.50')
        ->assertJsonPath('data.foto', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/cardapio/produtos', [
            'nome' => '',
            'preco' => '-1',
            'categoria_id' => 999,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome', 'preco', 'categoria_id']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/cardapio/produtos/$produtoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('produto')->whereKey($produtoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'cardapio_produto')->count())->toBe(3);
});

test('crud de noticia valida urls datas e auditoria', function () {
    $payload = [
        'titulo' => 'Nova programacao da festa',
        'linha_apoio' => 'Confira os destaques do fim de semana.',
        'url' => 'https://festadodivinovip.com.br/noticias/nova-programacao',
        'data_hora_publicacao' => '2026-05-25 14:30',
        'thumb_url' => 'https://festadodivinovip.com.br/assets/nova-programacao.jpg',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/noticias', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/noticias', $payload)
        ->assertCreated()
        ->assertJsonPath('data.titulo', 'Nova programacao da festa')
        ->assertJsonPath('data.url', 'https://festadodivinovip.com.br/noticias/nova-programacao');

    $noticiaId = DB::connection('festa_divino_read')
        ->table('noticias_festa')
        ->where('titulo', 'Nova programacao da festa')
        ->value('id_noticia');

    expect(DB::connection('festa_divino_read')
        ->table('noticias_festa')
        ->where('id_noticia', $noticiaId)
        ->value('data_cadastro'))
        ->not->toBeNull();

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/conteudo/noticias/$noticiaId", array_merge($payload, [
            'titulo' => 'Programacao atualizada',
            'linha_apoio' => null,
            'thumb_url' => null,
        ]))
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Programacao atualizada')
        ->assertJsonPath('data.linha_apoio', null)
        ->assertJsonPath('data.thumb_url', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/noticias', [
            'titulo' => '',
            'url' => 'site-sem-protocolo',
            'data_hora_publicacao' => '25/05/2026',
            'thumb_url' => 'imagem',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['titulo', 'url', 'data_hora_publicacao', 'thumb_url']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/conteudo/noticias/$noticiaId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('noticias_festa')->whereKey($noticiaId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'conteudo_noticia')->count())->toBe(3);
});

test('crud de texto editorial valida campos e auditoria', function () {
    $payload = [
        'texto_curto' => 'A origem da tradicao',
        'texto_detalhado' => 'Conteudo editorial detalhado sobre a origem da festa.',
        'categoria' => 'Historia',
        'icone_categoria' => 'BookOpen',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/textos', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/textos', $payload)
        ->assertCreated()
        ->assertJsonPath('data.texto_curto', 'A origem da tradicao')
        ->assertJsonPath('data.categoria', 'Historia');

    $textoId = DB::connection('festa_divino_read')
        ->table('divino_textos')
        ->where('texto_curto', 'A origem da tradicao')
        ->value('id');

    $this->actingAs($this->admin, 'sanctum')
        ->putJson("/api/v1/festa-divino/conteudo/textos/$textoId", array_merge($payload, [
            'texto_curto' => 'A tradicao do Divino',
            'categoria' => 'Voce Sabia',
            'icone_categoria' => null,
        ]))
        ->assertOk()
        ->assertJsonPath('data.texto_curto', 'A tradicao do Divino')
        ->assertJsonPath('data.categoria', 'Voce Sabia')
        ->assertJsonPath('data.icone_categoria', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/conteudo/textos', [
            'texto_curto' => '',
            'texto_detalhado' => '',
            'categoria' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['texto_curto', 'texto_detalhado', 'categoria']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson("/api/v1/festa-divino/conteudo/textos/$textoId")
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('divino_textos')->whereKey($textoId)->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'conteudo_texto')->count())->toBe(3);
});

test('crud de video valida youtube id urls e auditoria', function () {
    $payload = [
        'id' => 'AaBbCc123_4',
        'titulo' => 'Video da festa',
        'descricao' => 'Registro oficial da Festa do Divino.',
        'thumb_url' => 'https://img.youtube.com/vi/AaBbCc123_4/hqdefault.jpg',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/videos', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/videos', $payload)
        ->assertCreated()
        ->assertJsonPath('data.id', 'AaBbCc123_4')
        ->assertJsonPath('data.titulo', 'Video da festa')
        ->assertJsonPath('data.watch_url', 'https://www.youtube.com/watch?v=AaBbCc123_4');

    expect(DB::connection('festa_divino_read')->table('youtube_videos')->where('id', 'AaBbCc123_4')->exists())->toBeTrue();

    $this->actingAs($this->admin, 'sanctum')
        ->putJson('/api/v1/festa-divino/midia/videos/AaBbCc123_4', [
            'titulo' => 'Video oficial atualizado',
            'descricao' => 'Descricao atualizada.',
            'thumb_url' => null,
        ])
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Video oficial atualizado')
        ->assertJsonPath('data.thumb_url', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/videos', [
            'id' => 'id invalido',
            'titulo' => '',
            'descricao' => '',
            'thumb_url' => 'imagem',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['id', 'titulo', 'descricao', 'thumb_url']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/midia/videos/AaBbCc123_4')
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('youtube_videos')->where('id', 'AaBbCc123_4')->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'midia_video')->count())->toBe(3);
});

test('crud de short valida youtube id urls e auditoria', function () {
    $payload = [
        'id' => 'ZzYyXx987-1',
        'titulo' => 'Short da festa',
        'thumb_url' => 'https://img.youtube.com/vi/ZzYyXx987-1/hqdefault.jpg',
    ];

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/shorts', $payload)
        ->assertStatus(423);

    enableFestaDivinoWritesForTest();

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/shorts', $payload)
        ->assertCreated()
        ->assertJsonPath('data.id', 'ZzYyXx987-1')
        ->assertJsonPath('data.titulo', 'Short da festa')
        ->assertJsonPath('data.watch_url', 'https://www.youtube.com/shorts/ZzYyXx987-1');

    expect(DB::connection('festa_divino_read')->table('shorts_videos')->where('id', 'ZzYyXx987-1')->exists())->toBeTrue();

    $this->actingAs($this->admin, 'sanctum')
        ->putJson('/api/v1/festa-divino/midia/shorts/ZzYyXx987-1', [
            'titulo' => 'Short atualizado',
            'thumb_url' => null,
        ])
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Short atualizado')
        ->assertJsonPath('data.thumb_url', null);

    $this->actingAs($this->admin, 'sanctum')
        ->postJson('/api/v1/festa-divino/midia/shorts', [
            'id' => 'short-invalido',
            'titulo' => '',
            'thumb_url' => 'imagem',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['id', 'titulo', 'thumb_url']);

    $this->actingAs($this->admin, 'sanctum')
        ->deleteJson('/api/v1/festa-divino/midia/shorts/ZzYyXx987-1')
        ->assertOk();

    expect(DB::connection('festa_divino_read')->table('shorts_videos')->where('id', 'ZzYyXx987-1')->exists())->toBeFalse();
    expect(DB::table('festa_divino_audit_logs')->where('entity_type', 'midia_short')->count())->toBe(3);
});
