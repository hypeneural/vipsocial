# 🏢 VIPSocial Hub

> Plataforma editorial completa para gestão de conteúdo jornalístico, alertas, distribuição e engajamento — desenvolvida para redações de TV.

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Módulos](#-módulos)
- [Instalação](#-instalação)
- [Desenvolvimento](#-desenvolvimento)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Banco de Dados](#-banco-de-dados)
- [Deploy](#-deploy)

---

## 🎯 Visão Geral

O VIPSocial Hub é um sistema integrado para redações de TV que centraliza:

- **Pauta do Dia (Roteiros)** — Gestão completa do roteiro diário com blocos, matérias, ordenação drag-and-drop, edição inline, sistema de status com ícones Lucide, log de auditoria detalhado (timeline por matéria e por dia), e gaveta de notícias.
- **Alertas WhatsApp** — Envio de alertas em tempo real para grupos/destinos com templates e logs.
- **Engajamento** — Enquetes e relatórios de audiência.
- **Distribuição** — Central de distribuição de notícias multiplataforma.
- **Externas** — Agenda de eventos e coberturas externas.
- **Automação** — Grupos WhatsApp, templates, campanhas automatizadas.
- **Raspagem** — Feed ao vivo, fontes e filtros de scraping.
- **Cobertura VIP** — Galerias de fotos e métricas de cobertura.
- **Gestão de Pessoas** — Colaboradores, permissões RBAC, aniversários.
- **Configurações** — Equipamentos, integrações, auditoria do sistema, parâmetros.

---

## 🏗 Arquitetura

Monorepo com **pnpm workspaces** e **Turborepo** para orquestração de builds.

```
vipsocial-hub/
├── apps/
│   ├── api/           → Backend — Laravel 12 (API REST)
│   └── web/           → Frontend — React + Vite + TypeScript
├── packages/
│   ├── api-contract/  → OpenAPI spec
│   ├── api-client/    → Cliente TS gerado (Orval)
│   └── shared-types/  → Tipos compartilhados
├── docs/              → Documentação técnica
├── turbo.json         → Turborepo config
└── pnpm-workspace.yaml
```

**Comunicação:** Frontend ↔ Backend via API REST com autenticação **Sanctum (Bearer Token)**.

---

## 🛠 Stack Tecnológica

### Backend (`apps/api/`)

| Tecnologia | Uso |
|---|---|
| **Laravel 12** | Framework PHP |
| **Sanctum** | Autenticação API (tokens) |
| **Spatie Permission** | RBAC (roles & permissions) |
| **Spatie Activity Log** | Audit trail completo |
| **Spatie Query Builder** | Filtros, sorts e includes na API |
| **Spatie Media Library** | Upload/gerenciamento de mídia |
| **MySQL 8.4** | Banco de dados (dev) |
| **Redis** | Cache e filas |
| **Horizon** | Dashboard de filas |

### Frontend (`apps/web/`)

| Tecnologia | Uso |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool |
| **TypeScript 5** | Tipagem estática |
| **TanStack Query** | Data fetching e cache |
| **React Hook Form + Zod** | Formulários e validação |
| **Shadcn/ui + Radix** | Componentes UI |
| **Framer Motion** | Animações |
| **Lucide React** | Ícones |
| **Tailwind CSS** | Estilização |

### Infraestrutura

| Tecnologia | Uso |
|---|---|
| **pnpm** | Gerenciador de pacotes |
| **Turborepo** | Orquestração monorepo |
| **Laragon** | Ambiente de desenvolvimento local |

---

## 📦 Módulos

### 🎬 Pauta do Dia (Roteiros)

O módulo principal do sistema. Gerencia o roteiro diário do programa.

**Funcionalidades:**
- 3 blocos fixos (F1–F4, F5–F8, F9–F12) com cores diferenciadas
- Edição inline de título, linha de apoio, créditos e duração
- Drag-and-drop para reordenação de matérias
- Sistema de status com ícones Lucide (CRUD completo)
- Categorias de matérias
- Gaveta de notícias
- Cálculo automático de tempo total vs tempo do programa
- **Audit log detalhado:**
  - Timeline por matéria (quem criou, alterou cada campo, before/after)
  - Log do dia (todas as ações do roteiro na data)

**Endpoints:** `GET/POST/PUT /roteiros`, `PUT /materias/reorder`, `GET /logs`

### 🔐 Autenticação

- Login/Registro com Sanctum tokens
- Refresh token
- Recuperação de senha
- Alteração de senha
- **Edição de perfil** (`PUT /auth/profile`)
- Audit log de ações de auth

### 👥 Gestão de Pessoas

- CRUD de colaboradores
- Sistema de roles & permissions (RBAC)
- Aniversariantes

### ⚡ Alertas WhatsApp

- Dashboard de alertas
- Gestão de destinos
- Envio e monitoramento
- Logs detalhados

### 📊 Engajamento

- Enquetes com votação
- Relatórios de audiência

### 📡 Distribuição

- Central de distribuição
- Gerenciamento de notícias
- Publicações multiplataforma

---

## 🚀 Instalação

### Pré-requisitos

- **PHP** >= 8.2
- **Composer** >= 2
- **Node.js** >= 18
- **pnpm** >= 9
- **MySQL** >= 8.0
- **Redis** (opcional, para filas/cache)

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/vipsocial-hub.git
cd vipsocial-hub
```

### 2. Backend (Laravel)

```bash
cd apps/api

# Instalar dependências PHP
composer install

# Configurar ambiente
cp .env.example .env
php artisan key:generate

# Configurar banco de dados no .env
# DB_DATABASE=vipsocial_hub
# DB_USERNAME=root
# DB_PASSWORD=

# Executar migrations e seeds
php artisan migrate --seed

# Iniciar servidor
php artisan serve
```

### 3. Frontend (React)

```bash
cd apps/web

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# VITE_API_URL=http://localhost:8000/api/v1

# Iniciar dev server
pnpm dev
```

### 4. Monorepo (todos os apps)

```bash
# Na raiz do projeto
pnpm install
pnpm dev
```

---

## 💻 Desenvolvimento

### Scripts disponíveis (raiz)

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia todos os apps em modo dev |
| `pnpm build` | Build de produção |
| `pnpm lint` | Lint de todos os pacotes |
| `pnpm test` | Executa testes |
| `pnpm typecheck` | Verificação de tipos TypeScript |

### Scripts do Frontend (`apps/web/`)

| Comando | Descrição |
|---|---|
| `pnpm dev` | Dev server (Vite) |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm lint` | ESLint |

### Scripts do Backend (`apps/api/`)

| Comando | Descrição |
|---|---|
| `php artisan serve` | Inicia API |
| `php artisan migrate` | Executar migrations |
| `php artisan migrate:fresh --seed` | Reset + seed |
| `php artisan horizon` | Iniciar worker de filas |

---

## 📁 Estrutura do Projeto

### Backend (`apps/api/`)

```
app/
├── Models/              → Eloquent models
├── Modules/             → Módulos da aplicação
│   ├── Auth/            → Autenticação (login, registro, perfil)
│   ├── Config/          → Configurações do sistema
│   ├── Externas/        → Eventos externos
│   ├── Pessoas/         → Gestão de colaboradores
│   ├── Roteiros/        → Pauta do dia (principal)
│   │   ├── Actions/     → Business logic (CreateMateria, Reorder...)
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Requests/
│   │   │   └── Resources/
│   │   └── routes.php
│   └── Users/           → CRUD de usuários
├── Support/             → Base classes (BaseController, etc.)
└── Traits/              → Auditable, etc.

database/
├── migrations/          → Todas as migrations
└── seeders/             → Seeds iniciais
```

### Frontend (`apps/web/`)

```
src/
├── components/
│   ├── layout/          → AppShell, Sidebar, Topbar, MobileNav
│   ├── roteiros/        → RoteiroTable, StatusSelect, StatusIcon,
│   │                      AuditTimeline, AuditLineDialog, AuditDayDialog...
│   ├── shared/          → Componentes reutilizáveis
│   └── ui/              → Shadcn/ui components
├── contexts/            → AuthContext (autenticação global)
├── hooks/               → useRoteiro, useDebounce, etc.
├── pages/
│   ├── auth/            → Login
│   ├── roteiros/        → Dashboard (Pauta do Dia)
│   ├── alertas/         → Alertas WhatsApp
│   ├── engajamento/     → Enquetes e relatórios
│   ├── profile/         → Perfil e edição
│   └── ...
├── services/            → API services (auth, roteiro, etc.)
├── types/               → TypeScript interfaces
└── lib/                 → Utilities (toast, cn, etc.)
```

---

## 🔌 API

Base URL: `http://localhost:8000/api/v1`

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/register` | Registro |
| `GET` | `/auth/me` | Usuário autenticado |
| `PUT` | `/auth/profile` | Atualizar perfil |
| `PUT` | `/auth/password` | Alterar senha |
| `POST` | `/auth/logout` | Logout |
| `POST` | `/auth/refresh` | Refresh token |

### Roteiros

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/roteiros?date=YYYY-MM-DD` | Roteiro do dia |
| `POST` | `/roteiros` | Criar roteiro |
| `PUT` | `/roteiros/{id}` | Atualizar roteiro |
| `POST` | `/roteiros/{id}/materias` | Criar matéria |
| `PUT` | `/roteiros/{id}/materias/{materiaId}` | Atualizar matéria |
| `PUT` | `/roteiros/{id}/materias/reorder` | Reordenar matérias |
| `GET` | `/roteiros/{id}/materias/{materiaId}/logs` | Logs da matéria |
| `GET` | `/roteiros/logs-by-date?date=YYYY-MM-DD` | Logs do dia |

### Status de Matérias

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/status-materias` | Listar status |
| `POST` | `/status-materias` | Criar status |
| `PUT` | `/status-materias/{id}` | Atualizar status |
| `DELETE` | `/status-materias/{id}` | Excluir status |

Todos os endpoints protegidos requerem header: `Authorization: Bearer {token}`

---

## 🗄 Banco de Dados

### Principais tabelas

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema |
| `user_preferences` | Preferências do usuário |
| `roteiros` | Roteiros diários |
| `materias` | Matérias do roteiro |
| `categorias` | Categorias de matérias |
| `status_materias` | Status customizáveis (ícones Lucide) |
| `gavetas` | Gavetas de notícias |
| `noticias_gaveta` | Notícias dentro das gavetas |
| `activity_log` | Audit trail (Spatie) |
| `roles` / `permissions` | RBAC (Spatie Permission) |

---

## 🚢 Deploy

### Produção

```bash
# Backend
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Frontend
cd apps/web
pnpm build
# Servir o conteúdo de dist/ via Nginx/Apache
```

### Variáveis de Ambiente

**Backend (`apps/api/.env`):**
```env
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=vipsocial_hub
DB_USERNAME=root
DB_PASSWORD=
SANCTUM_STATEFUL_DOMAINS=seudominio.com.br
```

**Frontend (`apps/web/.env.local`):**
```env
VITE_API_URL=https://api.seudominio.com.br/api/v1
```

---

## 📄 Licença

Projeto privado — © VIPSocial. Todos os direitos reservados.
