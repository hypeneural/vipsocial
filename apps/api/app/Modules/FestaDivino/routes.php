<?php

use App\Modules\FestaDivino\Http\Controllers\AtracaoController;
use App\Modules\FestaDivino\Http\Controllers\AuditLogController;
use App\Modules\FestaDivino\Http\Controllers\BrinquedoController;
use App\Modules\FestaDivino\Http\Controllers\CardapioCategoriaController;
use App\Modules\FestaDivino\Http\Controllers\DashboardController;
use App\Modules\FestaDivino\Http\Controllers\DiaFestaEventoController;
use App\Modules\FestaDivino\Http\Controllers\EdicaoFestaController;
use App\Modules\FestaDivino\Http\Controllers\FaqCategoryController;
use App\Modules\FestaDivino\Http\Controllers\FaqItemController;
use App\Modules\FestaDivino\Http\Controllers\HealthController;
use App\Modules\FestaDivino\Http\Controllers\NoticiaController;
use App\Modules\FestaDivino\Http\Controllers\ProdutoController;
use App\Modules\FestaDivino\Http\Controllers\ProgramacaoCategoriaController;
use App\Modules\FestaDivino\Http\Controllers\ProgramacaoEventoController;
use App\Modules\FestaDivino\Http\Controllers\ProgramacaoLocalController;
use App\Modules\FestaDivino\Http\Controllers\ShortController;
use App\Modules\FestaDivino\Http\Controllers\TextoController;
use App\Modules\FestaDivino\Http\Controllers\VideoController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')
    ->prefix('festa-divino')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('festa-divino.dashboard');
        Route::get('/health', HealthController::class)->name('festa-divino.health');
        Route::get('/audit-logs', AuditLogController::class)->name('festa-divino.audit-logs.index');

        Route::post('/edicoes', [EdicaoFestaController::class, 'store'])
            ->name('festa-divino.edicoes.store');
        Route::get('/edicoes', [EdicaoFestaController::class, 'index'])
            ->name('festa-divino.edicoes.index');
        Route::get('/edicoes/{id}', [EdicaoFestaController::class, 'show'])
            ->whereNumber('id')
            ->name('festa-divino.edicoes.show');
        Route::put('/edicoes/{id}', [EdicaoFestaController::class, 'update'])
            ->whereNumber('id')
            ->name('festa-divino.edicoes.update');
        Route::delete('/edicoes/{id}', [EdicaoFestaController::class, 'destroy'])
            ->whereNumber('id')
            ->name('festa-divino.edicoes.destroy');

        Route::prefix('programacao')->group(function () {
            Route::post('/dias', [DiaFestaEventoController::class, 'store'])
                ->name('festa-divino.programacao.dias.store');
            Route::get('/dias', [DiaFestaEventoController::class, 'index'])
                ->name('festa-divino.programacao.dias.index');
            Route::get('/dias/{id}', [DiaFestaEventoController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.dias.show');
            Route::put('/dias/{id}', [DiaFestaEventoController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.dias.update');
            Route::delete('/dias/{id}', [DiaFestaEventoController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.dias.destroy');

            Route::post('/eventos', [ProgramacaoEventoController::class, 'store'])
                ->name('festa-divino.programacao.eventos.store');
            Route::get('/eventos', [ProgramacaoEventoController::class, 'index'])
                ->name('festa-divino.programacao.eventos.index');
            Route::get('/eventos/{id}', [ProgramacaoEventoController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.eventos.show');
            Route::put('/eventos/{id}', [ProgramacaoEventoController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.eventos.update');
            Route::patch('/eventos/{id}/status', [ProgramacaoEventoController::class, 'updateStatus'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.eventos.status');
            Route::delete('/eventos/{id}', [ProgramacaoEventoController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.eventos.destroy');

            Route::post('/categorias', [ProgramacaoCategoriaController::class, 'store'])
                ->name('festa-divino.programacao.categorias.store');
            Route::get('/categorias', [ProgramacaoCategoriaController::class, 'index'])
                ->name('festa-divino.programacao.categorias.index');
            Route::get('/categorias/{id}', [ProgramacaoCategoriaController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.categorias.show');
            Route::put('/categorias/{id}', [ProgramacaoCategoriaController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.categorias.update');
            Route::delete('/categorias/{id}', [ProgramacaoCategoriaController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.categorias.destroy');

            Route::post('/locais', [ProgramacaoLocalController::class, 'store'])
                ->name('festa-divino.programacao.locais.store');
            Route::get('/locais', [ProgramacaoLocalController::class, 'index'])
                ->name('festa-divino.programacao.locais.index');
            Route::get('/locais/{id}', [ProgramacaoLocalController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.locais.show');
            Route::put('/locais/{id}', [ProgramacaoLocalController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.locais.update');
            Route::delete('/locais/{id}', [ProgramacaoLocalController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.locais.destroy');

            Route::post('/atracoes', [AtracaoController::class, 'store'])
                ->name('festa-divino.programacao.atracoes.store');
            Route::get('/atracoes', [AtracaoController::class, 'index'])
                ->name('festa-divino.programacao.atracoes.index');
            Route::get('/atracoes/{id}', [AtracaoController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.atracoes.show');
            Route::put('/atracoes/{id}', [AtracaoController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.atracoes.update');
            Route::delete('/atracoes/{id}', [AtracaoController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.programacao.atracoes.destroy');
        });

        Route::prefix('cardapio')->group(function () {
            Route::post('/categorias', [CardapioCategoriaController::class, 'store'])
                ->name('festa-divino.cardapio.categorias.store');
            Route::get('/categorias', [CardapioCategoriaController::class, 'index'])
                ->name('festa-divino.cardapio.categorias.index');
            Route::get('/categorias/{id}', [CardapioCategoriaController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.categorias.show');
            Route::put('/categorias/{id}', [CardapioCategoriaController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.categorias.update');
            Route::delete('/categorias/{id}', [CardapioCategoriaController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.categorias.destroy');

            Route::post('/produtos', [ProdutoController::class, 'store'])
                ->name('festa-divino.cardapio.produtos.store');
            Route::get('/produtos', [ProdutoController::class, 'index'])
                ->name('festa-divino.cardapio.produtos.index');
            Route::get('/produtos/{id}', [ProdutoController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.produtos.show');
            Route::put('/produtos/{id}', [ProdutoController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.produtos.update');
            Route::delete('/produtos/{id}', [ProdutoController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.cardapio.produtos.destroy');
        });

        Route::prefix('conteudo')->group(function () {
            Route::post('/noticias', [NoticiaController::class, 'store'])
                ->name('festa-divino.conteudo.noticias.store');
            Route::get('/noticias', [NoticiaController::class, 'index'])
                ->name('festa-divino.conteudo.noticias.index');
            Route::get('/noticias/{id}', [NoticiaController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.noticias.show');
            Route::put('/noticias/{id}', [NoticiaController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.noticias.update');
            Route::delete('/noticias/{id}', [NoticiaController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.noticias.destroy');

            Route::post('/textos', [TextoController::class, 'store'])
                ->name('festa-divino.conteudo.textos.store');
            Route::get('/textos', [TextoController::class, 'index'])
                ->name('festa-divino.conteudo.textos.index');
            Route::get('/textos/{id}', [TextoController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.textos.show');
            Route::put('/textos/{id}', [TextoController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.textos.update');
            Route::delete('/textos/{id}', [TextoController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.conteudo.textos.destroy');
        });

        Route::prefix('midia')->group(function () {
            Route::post('/videos', [VideoController::class, 'store'])
                ->name('festa-divino.midia.videos.store');
            Route::get('/videos', [VideoController::class, 'index'])
                ->name('festa-divino.midia.videos.index');
            Route::get('/videos/{id}', [VideoController::class, 'show'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.videos.show');
            Route::put('/videos/{id}', [VideoController::class, 'update'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.videos.update');
            Route::delete('/videos/{id}', [VideoController::class, 'destroy'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.videos.destroy');

            Route::post('/shorts', [ShortController::class, 'store'])
                ->name('festa-divino.midia.shorts.store');
            Route::get('/shorts', [ShortController::class, 'index'])
                ->name('festa-divino.midia.shorts.index');
            Route::get('/shorts/{id}', [ShortController::class, 'show'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.shorts.show');
            Route::put('/shorts/{id}', [ShortController::class, 'update'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.shorts.update');
            Route::delete('/shorts/{id}', [ShortController::class, 'destroy'])
                ->where('id', '[A-Za-z0-9_-]+')
                ->name('festa-divino.midia.shorts.destroy');
        });

        Route::prefix('faq')->group(function () {
            Route::post('/categorias', [FaqCategoryController::class, 'store'])
                ->name('festa-divino.faq.categorias.store');
            Route::get('/categorias', [FaqCategoryController::class, 'index'])
                ->name('festa-divino.faq.categorias.index');
            Route::patch('/categorias/reorder', [FaqCategoryController::class, 'reorder'])
                ->name('festa-divino.faq.categorias.reorder');
            Route::get('/categorias/{id}', [FaqCategoryController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.faq.categorias.show');
            Route::put('/categorias/{id}', [FaqCategoryController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.faq.categorias.update');
            Route::patch('/categorias/{id}/status', [FaqCategoryController::class, 'updateStatus'])
                ->whereNumber('id')
                ->name('festa-divino.faq.categorias.status');
            Route::delete('/categorias/{id}', [FaqCategoryController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.faq.categorias.destroy');

            Route::post('/items', [FaqItemController::class, 'store'])
                ->name('festa-divino.faq.items.store');
            Route::get('/items', [FaqItemController::class, 'index'])
                ->name('festa-divino.faq.items.index');
            Route::patch('/items/reorder', [FaqItemController::class, 'reorder'])
                ->name('festa-divino.faq.items.reorder');
            Route::get('/items/{id}', [FaqItemController::class, 'show'])
                ->whereNumber('id')
                ->name('festa-divino.faq.items.show');
            Route::put('/items/{id}', [FaqItemController::class, 'update'])
                ->whereNumber('id')
                ->name('festa-divino.faq.items.update');
            Route::patch('/items/{id}/status', [FaqItemController::class, 'updateStatus'])
                ->whereNumber('id')
                ->name('festa-divino.faq.items.status');
            Route::delete('/items/{id}', [FaqItemController::class, 'destroy'])
                ->whereNumber('id')
                ->name('festa-divino.faq.items.destroy');
        });

        Route::post('/brinquedos', [BrinquedoController::class, 'store'])
            ->name('festa-divino.brinquedos.store');
        Route::get('/brinquedos', [BrinquedoController::class, 'index'])
            ->name('festa-divino.brinquedos.index');
        Route::get('/brinquedos/{id}', [BrinquedoController::class, 'show'])
            ->whereNumber('id')
            ->name('festa-divino.brinquedos.show');
        Route::put('/brinquedos/{id}', [BrinquedoController::class, 'update'])
            ->whereNumber('id')
            ->name('festa-divino.brinquedos.update');
        Route::patch('/brinquedos/{id}/status', [BrinquedoController::class, 'updateStatus'])
            ->whereNumber('id')
            ->name('festa-divino.brinquedos.status');
        Route::delete('/brinquedos/{id}', [BrinquedoController::class, 'destroy'])
            ->whereNumber('id')
            ->name('festa-divino.brinquedos.destroy');
    });
