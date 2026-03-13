# System Architecture

## Overview

Soegih is a personal finance web application with three main services:

1. **React frontend** — Single-page application with wallet, transaction, and AI chat modules
2. **NestJS backend** — REST API handling business logic, data validation, and persistence
3. **Python AI service** — Stateless LLM-powered transaction parser

All services communicate via HTTP/REST. Authentication is delegated to Supabase Auth.

## System Diagram

```
┌────────────────────────────────────────────────────────┐
│         Caddy Reverse Proxy (Port 80/443)              │
│  Routes /api/* → Backend | All others → Frontend       │
└────────────────┬─────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
┌───▼──────────────────────────────────────────────────┐  ┌───────────────┐
│          Frontend (React + Vite)                     │  │  Backend      │
│  ┌──────────────────┐  ┌──────────────────┐         │  │ (NestJS +     │
│  │  Auth Module     │  │  Dashboard       │         │  │ Prisma +      │
│  │  (Supabase)      │  │  (Net Worth,     │         │  │ Postgres)     │
│  └────────┬─────────┘  │   Expense Chart) │         │  │               │
│           │            └─────────┬────────┘         │  │ ┌────────────┐ │
│  ┌──────────────────┐  ┌──────────────────┐         │  │ │Wallet API  │ │
│  │ Wallet Module    │  │ Category Module  │         │  │ │Category API│ │
│  │ (CRUD, Balance)  │  │ (CRUD)           │         │  │ │Transaction │ │
│  │                  │  │                  │         │  │ │ & Dashboard│ │
│  └────────┬─────────┘  └────────┬─────────┘         │  │ │   APIs     │ │
│           │                      │       ┐          │  │ │            │ │
│  ┌──────────────────┐  ┌──────────────────┐  │      │  │ └────────────┘ │
│  │ Transaction      │  │ AI Chat Module   │  │      │  │                │
│  │ Module (CRUD)    │  │ (Parser)         │  │      │  │ ┌────────────┐ │
│  └────────┬─────────┘  └────────┬─────────┘  │      │  │ │AI Proxy    │ │
│           │                     │────────┐   │      │  │ │Module      │ │
│           └──────────────┬───────┴────────┴───┘      │  │ └────────────┘ │
│                    API Client (axios)               │  │                │
│         ┌──────────────────────────────────┐        │  │ ┌────────────┐ │
│         │ Auto-attach Supabase JWT token   │        │  │ │ Prisma ORM │ │
│         └────────────┬─────────────────────┘        │  │ │Postgres DB │ │
│                      │                              │  │ └────────────┘ │
└──────────────────────┼──────────────────────────────┘  └───┬────────────┘
                       │ HTTP + Bearer Token                  │
                       └──────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼─────────┐        ┌────────▼──────────┐
            │  Supabase Auth  │        │  AI Service       │
            │  (JWT Secret)   │        │  (FastAPI)        │
            │                 │        │                   │
            │                 │        │  LangChain +      │
            │                 │        │  gpt-4o-mini      │
            │                 │        │                   │
            │                 │        │  POST /ai/chat    │
            │                 │        │  Parse natural    │
            │                 │        │  language →       │
            │                 │        │  transaction      │
            └─────────────────┘        └───────────────────┘
```

## Data Flow

### Authentication Flow

1. User submits email/password on `/login`
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns JWT token and sets session
4. Frontend stores session in localStorage (Supabase handles this)
5. For subsequent API calls, axios interceptor attaches JWT: `Authorization: Bearer <token>`
6. Backend `SupabaseJwtGuard` validates token against Supabase
7. If valid, extracts `user.id` and attaches to request
8. Controller receives authenticated user via `@GetUser()` decorator

### Category CRUD Flow

**Create Category:**

1. User submits category form (name, type: expense/income, description)
2. Frontend POST `/api/v1/categories` with category data
3. Backend validates user session and category type
4. Prisma creates category record with user_id
5. Frontend receives category ID and adds to local list

**Read Categories:**

1. Frontend fetches on module load: GET `/api/v1/categories`
2. Backend returns all non-deleted categories for authenticated user
3. Frontend stores in React state/cache, displays in dropdown or list
4. Categories are client-side cached (fetched once per app session)

**Update Category:**

1. User edits category (name, description, type)
2. Frontend sends PATCH `/api/v1/categories/{id}` with changed fields
3. Backend validates ownership and updates record
4. Frontend updates local cache and re-renders
5. If category is used in transactions, no cascading effects (transactions retain original category_id)

**Delete Category (Soft Delete):**

1. User clicks delete on category
2. Frontend POST `/api/v1/categories/{id}/delete` (or DELETE with soft-delete handling)
3. Backend sets `deleted_at` timestamp (soft delete)
4. Existing transactions keep their category_id (doesn't break references)
5. Deleted category hidden from future dropdowns (WHERE deleted_at IS NULL)
6. Frontend removes from category list

### Transaction Creation Flow

1. User enters transaction details (type, amount, wallet, category, date)
2. Frontend creates `CreateTransactionDto` payload
3. POST `/api/v1/transactions` with JWT
4. Backend validates wallet/category ownership (user_id match)
5. Within Prisma transaction:
   - Create `TransactionEvent` (expense/income/transfer)
   - Create `Posting` entries (wallet debits/credits)
   - Update wallet balances
6. Return full transaction with postings and category
7. Frontend updates UI

### Transaction Update Flow (Limited Fields)

1. User edits transaction: note, category, amount, or wallet
2. Frontend sends PATCH `/api/v1/transactions/{id}` with changed fields only
3. Backend validates:
   - `type` and `occurred_at` are immutable (error if attempted to change)
   - Wallet belongs to user
   - Category matches transaction type (required for expense/income, NULL for transfer)
4. Within Prisma transaction:
   - If amount changed: Reverse original posting, create new posting with delta
   - If wallet changed: Update posting.wallet_id
   - If category changed: Update transaction_event.category_id
   - If note changed: Update transaction_event.note
   - Recalculate affected wallet balances
5. Return updated transaction with recalculated postings
6. Frontend updates UI

**Immutable Fields:** `type` and `occurred_at` are locked after creation and cannot be changed.

### AI Chat Flow

1. User types: "spent $50 on coffee"
2. Frontend calls POST `/api/v1/ai/chat` with message + wallet/category context
3. Backend fetches user's wallets and categories from DB
4. Backend forwards to AI service: POST to FastAPI with message, wallets, categories
5. AI service uses LangChain → gpt-4o-mini to parse natural language
6. Returns `ParsedTransaction` with suggested values
7. Frontend displays confirmation card
8. User confirms → POST `/api/v1/ai/chat/confirm` with final payload
9. Backend creates transaction via normal flow

## Frontend Structure

See [/frontend/src/](../frontend/src/) for the actual structure.

**Key directories:**

- `src/modules/` — Feature modules (auth, wallet, category, transaction, dashboard, ai)
- `src/routes/` — TanStack Router file-based routes
- `src/shared/` — Shared components, hooks, types, API client

**Module Responsibilities:**

- **Auth Module** — Supabase login/signup, session management, token storage
- **Wallet Module** — Display wallet list, create/edit/delete wallets, show balance
  - Client-side caching (fetch once per session)
  - Uses TanStack Table for client-side sorting/filtering
- **Category Module** — Dropdown selection, create/edit/delete categories
  - Client-side caching (categories are static per user per session)
  - Category list available as context for transaction forms
- **Transaction Module** — Full CRUD with constraints
  - **Create:** Form with wallet/category dropdowns, AI parser support
  - **Read:** Server-side paginated list (GET /api/v1/transactions with `page`, `limit`)
  - **Update:** Modal/inline edit of note, category, amount, wallet (type & date locked)
  - **Delete:** Soft delete via API
- **Dashboard Module** — Net worth, income/expense breakdown for current month
- **AI Module** — Chat interface for transaction parsing
  - User inputs natural language → AI service parses → confirmation card
  - On confirm, creates transaction via normal Transaction API

**Routes:**

- `/login` — Login page (public)
- `/_app` — Protected layout wrapper (checks `isAuthenticated`)
- `/_app/` — Dashboard (net worth, charts)
- `/_app/wallets` — Wallet CRUD management
- `/_app/categories` — Category CRUD management
- `/_app/transactions` — Transaction list with server-side pagination and inline editing
- `/_app/ai` — AI chat assistant for transaction parsing

## Backend Structure

See [/backend/src/](../backend/src/) for the actual structure.

**Key directories:**

- `src/modules/` — Feature modules (wallet, category, transaction, dashboard, ai)
- `src/common/` — Shared guards, decorators, filters
- `src/prisma/` — Prisma client service

**Main modules:**

- **Wallet Module** — CRUD for user wallets
  - `GET /api/v1/wallets` — List user wallets
  - `POST /api/v1/wallets` — Create wallet
  - `PATCH /api/v1/wallets/:id` — Update wallet (name, type, balance)
  - `DELETE /api/v1/wallets/:id` — Soft delete wallet
  - Validates wallet ownership (user_id match)

- **Category Module** — CRUD for expense/income categories
  - `GET /api/v1/categories` — List categories (by type: expense/income)
  - `POST /api/v1/categories` — Create category (name, type, description)
  - `PATCH /api/v1/categories/:id` — Update category (name, description, type)
  - `DELETE /api/v1/categories/:id` — Soft delete category
  - Validates category ownership; does not cascade delete transactions

- **Transaction Module** — Full CRUD with complex validation and balance updates
  - `GET /api/v1/transactions` — Paginated list (query: page, limit, filters)
  - `POST /api/v1/transactions` — Create transaction, update wallet balances
  - `PATCH /api/v1/transactions/:id` — Update transaction (immutable: type, occurred_at)
  - `DELETE /api/v1/transactions/:id` — Soft delete and reverse postings
  - Atomic operations: updates wallet balances within Prisma transaction
  - Validates wallet/category ownership and type constraints

- **Dashboard Module** — Current month summary
  - `GET /api/v1/dashboard` — Net worth, income/expense breakdown, top categories

- **AI Module** — Proxy to Python AI service
  - `POST /api/v1/ai/chat` — Send message + context, get parsed transaction suggestion
  - `POST /api/v1/ai/chat/confirm` — Confirm parsed transaction, create via transaction API

**Guards & Middleware:**

- `SupabaseJwtGuard` — Validates Supabase JWT on protected routes
- `GetUser` decorator — Extracts authenticated user from request

## Python AI Service Structure

See [/ai/](../ai/) for the actual structure.

**Key components:**

- `app/config.py` — Settings (OPENAI_API_KEY, port)
- `app/main.py` — FastAPI app definition
- `app/schemas/transaction.py` — Pydantic models for chat request/response
- `app/chains/transaction_chain.py` — LangChain pipeline for parsing
- `app/routers/chat.py` — POST `/ai/chat` endpoint

**Flow:**

1. Receives user message + wallet/category context
2. Builds system prompt with available wallets and categories
3. Invokes gpt-4o-mini via LangChain with structured output (ParsedTransaction)
4. Returns parsed fields + human-readable summary

## Infrastructure

See [docker-compose.yml](../docker-compose.yml) for actual config.

**Services:**

- **caddy** — Reverse proxy on port 80/443, routes `/api/*` → backend, serves static frontend assets
- **backend** — NestJS app on port 3000 (internal only)
- **ai** — FastAPI on port 8000 (internal only)
- **db** — PostgreSQL on port 5432 (internal only)

**Environment:**

- Backend connects to Postgres via `DATABASE_URL`
- Backend validates Supabase JWT via `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- Frontend is built as static assets (Vite build output) and served by Caddy
- Frontend uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` at build time for Supabase client
- AI service uses `OPENAI_API_KEY` for LLM access
- Caddy automatically handles HTTPS, redirects, and static file serving

## Database Schema

See [docs/DATA_MODELS.md](./DATA_MODELS.md) for full schema details.

**Key entities:**

- `users` — Synced with Supabase Auth; user_id is the Supabase UID
- `wallet` — User's bank accounts, wallets, e-wallets
- `category` — Expense/income categories
- `transaction_event` — A transaction (expense/income/transfer)
- `posting` — Individual wallet impact of a transaction

**Soft deletion:** All tables have `deleted_at` field; queries filter `WHERE deleted_at IS NULL`.

## Authentication & Authorization

**Supabase Auth:**

- Handles signup, login, password reset, email verification
- Manages JWT tokens (automatically refreshed by Supabase client)
- Backend never stores passwords; only validates JWTs

**Authorization:**

- Backend checks user ownership of resources (e.g., wallet belongs to authenticated user)
- All queries filtered by `user_id` to ensure data isolation
- Frontend routes guarded by `beforeLoad` checks on `context.auth.isAuthenticated`

---

**Last updated:** [Auto-updated after each chunk]
**Current status:** [Pending implementation — see CHANGELOG.md]
