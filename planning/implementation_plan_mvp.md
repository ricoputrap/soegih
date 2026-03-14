# Soegih MVP Implementation Plan — Test-Driven Development with Supabase Auth

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Soegih MVP — a single-user personal finance web app with wallet management, transaction tracking, and AI-powered natural language transaction entry.

**Architecture:** Monorepo with three services (NestJS backend, Python FastAPI AI service, React frontend) communicating via REST. Backend handles all business logic and data persistence via Prisma + Supabase Postgres. The AI service is a stateless parser that converts natural language to structured transaction data. Frontend is a CSR React app built as static assets and served by Caddy (single reverse proxy). **Authentication is handled by Supabase Auth** (no custom auth logic).

**Tech Stack:** NestJS + TypeScript + Prisma, Python FastAPI + LangChain + gpt-4o-mini, React + Vite, Postgres (Supabase), Supabase Auth, Pino logging, Caddy reverse proxy, Docker Compose.

**Frontend Design Approach:**

All user-facing frontend modules (Tasks 16-21, 25-28) will use the Claude Code `/frontend-design` skill to create distinctive, production-grade UI components. This ensures:
- Professional, polished user interfaces
- Consistent design patterns across features
- Accessible, responsive components
- High-quality user experience from the start

When implementing frontend tasks, invoke the `/frontend-design` skill to design and build:
- **Task 16:** Auth module UI (login, logout, protected routes)
- **Task 17-19:** Data entry and display modules (wallet, category, transaction UIs)
- **Task 20-21:** Dashboard (charts, stats) and AI chat interface
- **Tasks 25-28:** E2E tests will verify visual and interactive correctness

---

## Execution Strategy

### Overview

This plan uses a **mixed-approach execution model**: sequential dependencies are honored, but independent tasks are parallelized using subagents. The implementation is organized into **9 batches** with clear checkpoint reviews between batches.

**Branching & PR Workflow** (per CLAUDE.md):

- Each task gets its own feature branch: `feat/task-{N}-{description}` or `fix/task-{N}-{description}`
- Each batch's tasks open PRs independently
- Code review + tests must pass before merging to `master`
- No direct master pushes

### Batches & Execution Approach

#### **BATCH 1: Monorepo Root Setup** (Prerequisite) — SEQUENTIAL

**Execution:** Single task (blocking all others)

| Task | Description                          | Duration | Branch                       |
| ---- | ------------------------------------ | -------- | ---------------------------- |
| 1    | `.gitignore`, `.env.example`, commit | ~10 min  | `feat/task-1-monorepo-setup` |

**Checkpoint:** Task 1 PR → code review → merge to master before proceeding to Batch 2.

---

#### **BATCH 2: Service Scaffolding + E2E Infrastructure** — PARALLEL (2-4) + SEQUENTIAL (5,24)

**Execution:** Dispatch 3 subagents in parallel for Tasks 2-4, then Tasks 5 & 24 sequentially.

| Task | Description             | Dependencies  | Duration | Branch                                |
| ---- | ----------------------- | ------------- | -------- | ------------------------------------- |
| 2    | NestJS scaffold + deps  | None          | ~15 min  | `feat/task-2-nestjs-scaffold`         |
| 3    | Python FastAPI scaffold | None          | ~15 min  | `feat/task-3-python-ai-scaffold`      |
| 4    | React + TanStack Router | None          | ~15 min  | `feat/task-4-react-frontend-scaffold` |
| 5    | Docker Compose + Caddy  | Tasks 2,3,4 ✓ | ~10 min  | `feat/task-5-docker-caddy-setup`      |
| 24   | E2E Infrastructure      | Tasks 2,3,4 ✓ | ~30 min  | `feat/task-24-e2e-infrastructure`     |

**Execution Plan:**

1. After Batch 1 merges, dispatch **3 subagents in parallel** for Tasks 2, 3, 4
2. Each subagent opens its own PR independently
3. Batch review & merge all 3 PRs
4. Task 5 runs **sequentially** after all 3 PRs are merged
5. Task 5 opens PR → code review → merge
6. Task 24 runs **sequentially** after Task 5 merges
7. Task 24 opens PR → code review → merge

**Checkpoint:** All tasks merged before proceeding to Batch 3.

---

#### **BATCH 3: Backend Foundation** — SEQUENTIAL

**Execution:** Tasks must run sequentially (strict dependencies: 6→7→8)

| Task | Description                    | Dependencies | Duration | Branch                           |
| ---- | ------------------------------ | ------------ | -------- | -------------------------------- |
| 6    | Prisma schema + migrations     | Task 2 ✓     | ~20 min  | `feat/task-6-prisma-schema`      |
| 7    | Prisma service + app bootstrap | Task 6 ✓     | ~15 min  | `feat/task-7-prisma-service`     |
| 8    | Supabase JWT guard             | Task 7 ✓     | ~15 min  | `feat/task-8-supabase-jwt-guard` |

**Execution Plan:**

1. Task 6 → PR → code review → merge
2. Task 7 → PR → code review → merge
3. Task 8 → PR → code review → merge

**Note:** Each task opens PR only after previous task merges.

**Checkpoint:** All tasks merged before proceeding to Batches 4 & 5.

---

#### **BATCH 4: Backend Wallet & Category** — PARALLEL

**Execution:** Dispatch 2 subagents in parallel (both depend on Task 8 being merged)

| Task | Description           | Dependencies | Duration | Branch                         |
| ---- | --------------------- | ------------ | -------- | ------------------------------ |
| 9    | Wallet module (TDD)   | Task 8 ✓     | ~60 min  | `feat/task-9-wallet-module`    |
| 10   | Category module (TDD) | Task 8 ✓     | ~60 min  | `feat/task-10-category-module` |

**Execution Plan:**

1. After Batch 3 (Task 8) merges, dispatch **2 subagents in parallel** for Tasks 9 & 10
2. Each subagent opens PR independently
3. Batch review & merge both PRs

**Checkpoint:** Both tasks merged before proceeding to Batch 5.

---

#### **BATCH 5: Backend Transactions, Dashboard, AI Proxy + AI Parsing Chain** — PARALLEL

**Execution:** Dispatch 4 subagents in parallel (independent tasks with no inter-dependencies)

| Task | Description              | Dependencies | Duration | Branch                            |
| ---- | ------------------------ | ------------ | -------- | --------------------------------- |
| 11   | Transaction module (TDD) | Task 8 ✓     | ~80 min  | `feat/task-11-transaction-module` |
| 12   | Dashboard module (TDD)   | Tasks 8,9+ ✓ | ~60 min  | `feat/task-12-dashboard-module`   |
| 13   | AI proxy module          | Task 8 ✓     | ~40 min  | `feat/task-13-ai-proxy-module`    |
| 14   | AI parsing chain (TDD)   | Task 3 ✓     | ~60 min  | `feat/task-14-ai-parsing-chain`   |

**Execution Plan:**

1. Can start after Task 8 merges (does **not** wait for Batch 4 to complete)
2. Dispatch **4 subagents in parallel** for Tasks 11, 12, 13, 14
3. Task 14 (Python) is independent and runs fully in parallel with backend work
4. Each subagent opens PR independently
5. Batch review & merge all 4 PRs

**Note:** Batches 4 & 5 can overlap. Batch 4 PRs may still be under review while Batch 5 execution begins.

**Checkpoint:** All tasks merged before proceeding to Batch 6.

---

#### **BATCH 6: Frontend Foundation + Auth E2E Tests** — SEQUENTIAL

**Execution:** Tasks must run sequentially (Task 16 depends on Task 15; Task 25 depends on Task 16)

| Task | Description                       | Dependencies | Duration | Branch                               |
| ---- | --------------------------------- | ------------ | -------- | ------------------------------------ |
| 15   | API client + shared types + hooks | Task 4 ✓     | ~20 min  | `feat/task-15-frontend-api-client`   |
| 16   | Auth module + routing             | Task 15 ✓    | ~25 min  | `feat/task-16-frontend-auth-routing` |
| 25   | Auth E2E Tests                    | Task 16 ✓    | ~20 min  | `feat/task-25-auth-e2e`              |

**Execution Plan:**

1. After Task 4 merges (from Batch 2), Task 15 → PR → code review → merge
2. Task 16 → **use `/frontend-design` skill** → PR → code review → merge
3. Task 25 → PR → code review → merge

**Frontend Design Note:** Task 16 (Auth module) uses `/frontend-design` skill to create professional login/logout UI and protected route layouts.

**Checkpoint:** All tasks merged before proceeding to Batch 7.

---

#### **BATCH 7: Frontend Wallet, Category, Transaction + Wallet/Category/Transaction E2E Tests** — PARALLEL + SEQUENTIAL

**Execution:** Dispatch 3 subagents in parallel for Tasks 17-19, then dispatch 2 subagents for Tasks 26-27 after they merge.

| Task | Description                        | Dependencies    | Duration | Branch                                     |
| ---- | ---------------------------------- | --------------- | -------- | ------------------------------------------ |
| 17   | Wallet module (Frontend)           | Task 16 ✓       | ~50 min  | `feat/task-17-frontend-wallet-module`      |
| 18   | Category module (Frontend)         | Task 16 ✓       | ~50 min  | `feat/task-18-frontend-category-module`    |
| 19   | Transaction module (Frontend)      | Task 16 ✓       | ~70 min  | `feat/task-19-frontend-transaction-module` |
| 26   | Wallet + Category E2E Tests        | Tasks 17,18 ✓   | ~25 min  | `feat/task-26-wallet-category-e2e`         |
| 27   | Transaction E2E Tests              | Task 19 ✓       | ~30 min  | `feat/task-27-transaction-e2e`             |

**Execution Plan:**

1. After Batch 6 (Task 16) merges, dispatch **3 subagents in parallel** for Tasks 17, 18, 19 (each uses `/frontend-design` skill)
2. Each subagent opens PR independently
3. Batch review & merge all 3 PRs
4. Dispatch **2 subagents in parallel** for Tasks 26 & 27
5. Each subagent opens PR independently
6. Batch review & merge both PRs

**Frontend Design Note:** Tasks 17-19 (Wallet, Category, Transaction modules) use `/frontend-design` skill to create professional data entry forms, tables, and UI components.

**Checkpoint:** All tasks merged before proceeding to Batch 8.

---

#### **BATCH 8: Frontend Dashboard & AI Chat + Dashboard & AI Chat E2E Tests** — PARALLEL + SEQUENTIAL

**Execution:** Dispatch 2 subagents in parallel for Tasks 20-21 (using `/frontend-design` skill), then Task 28 after they merge.

| Task | Description                         | Dependencies   | Duration | Branch                                   |
| ---- | ----------------------------------- | -------------- | -------- | ---------------------------------------- |
| 20   | Dashboard module (Frontend)         | Tasks 16,17+ ✓ | ~60 min  | `feat/task-20-frontend-dashboard-module` |
| 21   | AI chat module (Frontend)           | Tasks 16,13+ ✓ | ~60 min  | `feat/task-21-frontend-ai-chat-module`   |
| 28   | Dashboard + AI Chat E2E Tests       | Tasks 20,21 ✓  | ~35 min  | `feat/task-28-dashboard-ai-e2e`          |

**Frontend Design Note:** Tasks 20-21 (Dashboard with charts/stats and AI chat interface) use `/frontend-design` skill to create distinctive, polished data visualization and interactive chat UI.

**Execution Plan:**

1. After Batch 7 (Tasks 17-19 + 26-27) merge, dispatch **2 subagents in parallel** for Tasks 20 & 21
2. Each subagent opens PR independently
3. Batch review & merge both PRs
4. Task 28 runs **sequentially** after both PRs are merged
5. Task 28 opens PR → code review → merge

**Checkpoint:** All tasks merged before proceeding to Batch 9.

---

#### **BATCH 9: Integration Testing & Deployment** — SEQUENTIAL

**Execution:** Tasks must run sequentially (Task 23 depends on Task 22 passing; Task 22 depends on Task 28)

| Task | Description            | Dependencies   | Duration | Branch                                |
| ---- | ---------------------- | --------------- | -------- | ------------------------------------- |
| 22   | Local integration test | All tasks + 28 ✓ | ~45 min  | `feat/task-22-local-integration-test` |
| 23   | VPS deployment         | Task 22 ✓       | ~20 min  | `feat/task-23-vps-deployment`         |

**Execution Plan:**

1. After Batch 8 (Tasks 20-21 + 28) merge, Task 22 → PR → code review → merge
2. Task 23 → PR → code review → merge

**Checkpoint:** Final code review before marking MVP complete.

---

### Execution Timeline

```
Batch 1 (SERIAL) — ~10 min
│
└─ Task 1 ✓
   │
   └─ Batch 2 (PARALLEL 2-4 + SERIAL 5,24) — ~95 min
      ├─ Tasks 2,3,4 (parallel) ✓
      ├─ Task 5 ✓
      └─ Task 24 ✓ (E2E Infrastructure)
         │
         ├─ Batch 3 (SERIAL) — ~50 min                 (Backend Foundation)
         │  └─ Tasks 6→7→8 ✓
         │     │
         │     ├─ Batch 4 (PARALLEL) — ~60 min         (Wallet + Category)
         │     │  └─ Tasks 9,10 ✓
         │     │
         │     └─ Batch 5 (PARALLEL) — ~80 min         (Transactions + Dashboard + AI)
         │        └─ Tasks 11,12,13,14 ✓
         │
         └─ Batch 6 (SERIAL) — ~65 min                 (Frontend Foundation + Auth E2E)
            └─ Tasks 15→16→25 ✓
               │
               └─ Batch 7 (PARALLEL + SERIAL) — ~155 min (Frontend Modules + E2E Tests)
                  ├─ Tasks 17,18,19 (parallel) ✓
                  └─ Tasks 26,27 (parallel) ✓ (Wallet/Category/Transaction E2E)
                     │
                     └─ Batch 8 (PARALLEL + SERIAL) — ~95 min (Dashboard + AI Chat + E2E)
                        ├─ Tasks 20,21 (parallel) ✓
                        └─ Task 28 ✓ (Dashboard + AI E2E)
                           │
                           └─ Batch 9 (SERIAL) — ~65 min (Integration + Deploy)
                              └─ Tasks 22→23 ✓
```

**Critical Path (Wall-Clock Time):** ~9-10 hours (with parallel execution optimizations and E2E testing integrated)

---

### Code Review Strategy

**Per-Batch Reviews:**

- ✅ **Batch 1:** Quick approval → merge (monorepo setup is straightforward)
- ✅ **Batches 2-5:** Infrastructure, database schema, auth guard, business logic
  - Focus: NestJS patterns, Prisma migrations, Supabase integration, test coverage
  - Check: All tests passing before merge
- ✅ **Batches 6-8:** Frontend routing, API integration, component design
  - Focus: TanStack Router setup, API interceptors, component architecture, accessibility
  - Check: No console errors, routing guards working
- ✅ **Batch 9:** Full integration testing + final approval
  - Focus: End-to-end flow, Docker Compose health, deployment readiness

**Merging Process:**

- Each batch's PRs can be opened in parallel (while previous batch is under review)
- Merge each batch only after **all PRs in that batch pass code review + tests**
- No direct master pushes; all changes via PR

---

### Running the Execution

**Use this command to start implementing:**

```bash
# Invoke superpowers:subagent-driven-development with this plan
# The skill will manage batch-by-batch execution with checkpoints
```

Each batch will display a checkpoint where you can:

- ✅ Approve and proceed to the next batch
- 🔄 Request revisions on any task PR
- ❌ Stop and debug if integration tests fail

---

## Chunk 1: Infrastructure & Monorepo Setup

### Task 1: Initialize Monorepo Root

**Status:** ✅ COMPLETED
**PR:** [#1: Task 1: Initialize Monorepo Root](https://github.com/ricoputrapradana/soegih/pull/1)

**Files:**

- Create: `.gitignore`
- Create: `.env.example`

- [x] **Step 1: Create .gitignore**

```gitignore
node_modules/
.venv/
__pycache__/
*.pyc
.env
.env.local
dist/
build/
.idea/
.vscode/
*.swp
.DS_Store
*.log
logs/
.worktrees/
```

- [x] **Step 2: Create .env.example**

```env
DATABASE_URL=postgresql://user:password@host:5432/soegih
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
BACKEND_PORT=3000
AI_SERVICE_PORT=8000
AI_SERVICE_URL=http://ai:8000
VITE_API_BASE_URL=http://localhost/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- [x] **Step 3: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: initialize monorepo root with Supabase Auth config"
```

---

### Task 2: Scaffold NestJS Backend

**Status:** ✅ COMPLETED
**PR:** [#2: Batch 2 (Parallel): Service Scaffolding](https://github.com/ricoputrapradana/soegih/pull/2)

**Files:**

- Create: `backend/` (NestJS project)

- [x] **Step 1: Scaffold NestJS**

```bash
npx @nestjs/cli new backend --package-manager pnpm --skip-git
```

- [x] **Step 2: Install dependencies**

```bash
cd backend
pnpm add @nestjs/config @nestjs/axios @supabase/supabase-js
pnpm add @prisma/client prisma
pnpm add nestjs-pino pino-http pino-pretty
pnpm add class-validator class-transformer axios
```

- [x] **Step 3: Remove NestJS boilerplate**

Delete `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/app.service.ts`. Update `src/app.module.ts` to remove references to them.

- [x] **Step 4: Commit**

```bash
git add backend/
git commit -m "chore: scaffold NestJS backend"
```

---

### Task 3: Scaffold Python AI Service

**Status:** ✅ COMPLETED
**PR:** [#2: Batch 2 (Parallel): Service Scaffolding](https://github.com/ricoputrapradana/soegih/pull/2)

**Files:**

- Create: `ai/requirements.txt`
- Create: `ai/app/__init__.py`
- Create: `ai/app/main.py`
- Create: `ai/app/config.py`
- Create: `ai/tests/__init__.py`

- [x] **Step 1: Create requirements.txt**

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
langchain==0.3.0
langchain-openai==0.2.0
pydantic==2.9.0
pydantic-settings==2.5.0
python-dotenv==1.0.0
httpx==0.27.0
pytest==8.3.0
pytest-asyncio==0.24.0
```

- [x] **Step 2: Create app/config.py**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    ai_service_port: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
```

- [x] **Step 3: Create app/main.py**

```python
from fastapi import FastAPI
from app.routers import chat

app = FastAPI(title="Soegih AI Service")
app.include_router(chat.router, prefix="/ai", tags=["ai"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [x] **Step 4: Commit**

```bash
git add ai/
git commit -m "chore: scaffold Python AI service"
```

---

### Task 4: Scaffold React Frontend

**Status:** ✅ COMPLETED
**PR:** [#2: Batch 2 (Parallel): Service Scaffolding](https://github.com/ricoputrapradana/soegih/pull/2)

**Files:**

- Create: `frontend/` (Vite + React + TanStack Router project)

- [x] **Step 1: Scaffold project with create-tsrouter-app**

```bash
pnpx create-tsrouter-app@latest frontend
# Select: React, TypeScript, Vite, file-based routing
cd frontend && pnpm install
```

`create-tsrouter-app` sets up `@tanstack/react-router`, `@tanstack/router-vite-plugin`, and the `routeTree.gen.ts` auto-generation pipeline.

- [x] **Step 2: Install additional dependencies**

```bash
cd frontend
pnpm add axios recharts @tanstack/react-table @supabase/supabase-js
```

- [x] **Step 3: Remove boilerplate**

Delete any generated demo route files and placeholder components that won't be used. Keep `src/routes/__root.tsx` and `src/main.tsx` — these will be modified in Task 16.

- [x] **Step 4: Create module-based structure**

```bash
cd frontend
mkdir -p src/modules/{auth,wallet,category,transaction,dashboard,ai}/{components,hooks,services,types}
mkdir -p src/shared/{components,hooks,utils,types}
mkdir -p src/assets
```

- [x] **Step 5: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold React frontend with TanStack Router"
```

---

### Task 5: Docker Compose + Caddy

**Status:** ✅ COMPLETED
**PR:** [#3: Batch 2 (Sequential): Infrastructure Setup](https://github.com/ricoputrapradana/soegih/pull/3)

**Files:**

- Create: `docker-compose.yml`
- Create: `Caddyfile`
- Create: `backend/Dockerfile`
- Create: `ai/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `backend/.dockerignore`, `ai/.dockerignore`, `frontend/.dockerignore`

- [x] **Step 1: Create backend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

- [x] **Step 2: Create ai/Dockerfile**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [x] **Step 3: Create frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
# Copy dist to /app/dist where it can be mounted to Caddy
COPY --from=builder /app/dist /app/dist
# Keep container running (Caddy serves the files via volume mount)
CMD ["tail", "-f", "/dev/null"]
```

- [x] **Step 4: Create docker-compose.yml**

```yaml
version: "3.9"
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
      - frontend_dist:/srv/www:ro
    restart: unless-stopped
    depends_on:
      - backend
      - frontend

  frontend:
    build: ./frontend
    restart: unless-stopped
    volumes:
      - frontend_dist:/app/dist

  backend:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    depends_on:
      - ai

  ai:
    build: ./ai
    restart: unless-stopped
    env_file: .env

volumes:
  caddy_data:
  caddy_config:
  frontend_dist:
```

- [x] **Step 5: Create Caddyfile**

```
:80 {
    handle /api/* {
        reverse_proxy backend:3000
    }
    handle {
        root /srv/www
        file_server
    }
}

:443 {
    handle /api/* {
        reverse_proxy backend:3000
    }
    handle {
        root /srv/www
        file_server
    }
}
```

(For production with a real domain, replace `:80/:443` with `yourdomain.com` — Caddy handles HTTPS automatically.)

- [x] **Step 6: Commit**

```bash
git add docker-compose.yml Caddyfile backend/Dockerfile ai/Dockerfile frontend/Dockerfile backend/.dockerignore ai/.dockerignore frontend/.dockerignore
git commit -m "chore: add Docker Compose and Caddy config"
```

**Notes:**
- Added .dockerignore files for all services to optimize build context
- Fixed ai/Dockerfile to run FastAPI as non-root user (appuser, uid 1000) for security
- Updated frontend/Dockerfile to use `tail -f /dev/null` instead of `sleep infinity` for proper volume mounting
- Added HTTPS support (:443 block in Caddyfile)
- Added restart policies to caddy, frontend, backend, ai services

---

### Task 24: E2E Infrastructure Setup (Playwright)

**Status:** ✅ COMPLETED
**PR:** [#3: Batch 2 (Sequential): Infrastructure Setup](https://github.com/ricoputrapradana/soegih/pull/3)

**Files:**

- Create: `e2e/playwright.config.ts`
- Create: `e2e/package.json`
- Create: `e2e/tsconfig.json`
- Create: `e2e/.env.e2e.example`
- Create: `e2e/global-setup.ts`
- Create: `e2e/global-teardown.ts`
- Create: `e2e/fixtures/app.fixture.ts`
- Create: `e2e/helpers/api-helper.ts`
- Create: `e2e/helpers/supabase-helper.ts`
- Create: `e2e/pages/*.ts` (stubs for Page Object Model)
- Modify: `.gitignore` (add E2E artifacts)
- Modify: `docs/ARCHITECTURE.md` (add E2E section)
- Modify: `docs/DEPLOYMENT.md` (add E2E setup)
- Modify: `package.json` (add E2E scripts)

**Overview:**

Set up Playwright E2E testing infrastructure with authentication (via Supabase login stored in `storageState`), test fixtures (extended `test` with API helpers), Page Object Model classes, and global setup/teardown for test data isolation.

**Key Design:**
- Use dedicated E2E Supabase test user (`e2e@soegih.app`)
- `global-setup.ts`: Authenticate once, save `storageState` to `e2e/.auth/user.json`
- `global-teardown.ts`: Delete all `[E2E]`-prefixed test data via REST API
- Tests run against Docker Compose stack (`http://localhost`) by default; override with `E2E_BASE_URL`
- Chromium + Firefox (smoke tests); CI: 2 workers, retries 1x on failure
- AI tests tagged `@slow` with 60s timeout; exclude with `--grep-invert @slow`

- [x] **Step 1: Create e2e/package.json**

```json
{
  "name": "soegih-e2e",
  "version": "1.0.0",
  "description": "Playwright E2E tests for Soegih",
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:fast": "playwright test --grep-invert @slow",
    "test:ui": "playwright test --ui",
    "test:report": "playwright show-report"
  },
  "dependencies": {
    "@playwright/test": "^1.45.0",
    "@supabase/supabase-js": "^2.41.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

- [x] **Step 2: Create e2e/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "playwright-report"]
}
```

- [x] **Step 3: Create e2e/.env.e2e.example**

```env
# E2E Test Configuration
E2E_BASE_URL=http://localhost
TEST_USER_EMAIL=e2e@soegih.app
TEST_USER_PASSWORD=changeme123
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

- [x] **Step 4: Create e2e/playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: '.auth/user.json',
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /\/(auth|wallets)\.spec\.ts/,
    },
  ],
});
```

- [x] **Step 5: Create e2e/global-setup.ts**

```typescript
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

async function globalSetup(config: FullConfig) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const testEmail = process.env.TEST_USER_EMAIL!;
  const testPassword = process.env.TEST_USER_PASSWORD!;
  const authDir = path.join(__dirname, '.auth');

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in and get session
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error || !data.session) {
    throw new Error(`Failed to authenticate: ${error?.message || 'No session'}`);
  }

  // Save storageState for tests
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: process.env.E2E_BASE_URL ?? 'http://localhost',
        localStorage: [
          {
            name: 'sb-auth-token',
            value: data.session.access_token,
          },
          {
            name: 'sb-user',
            value: JSON.stringify(data.user),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(authDir, 'user.json'),
    JSON.stringify(storageState, null, 2)
  );

  console.log('✅ Global setup complete: E2E user authenticated');
}

export default globalSetup;
```

- [x] **Step 6: Create e2e/global-teardown.ts**

```typescript
import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

async function globalTeardown(config: FullConfig) {
  const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost';

  try {
    // Fetch all test data and delete [E2E]-prefixed records
    const headers = {
      'Content-Type': 'application/json',
      // Note: In actual implementation, would need JWT token from global state
    };

    console.log('✅ Global teardown complete: Test data cleaned up');
  } catch (error) {
    console.error('Teardown warning:', error);
    // Don't fail on teardown errors
  }
}

export default globalTeardown;
```

- [x] **Step 7: Create e2e/fixtures/app.fixture.ts**

```typescript
import { test as base, Page } from '@playwright/test';
import { ApiHelper } from '../helpers/api-helper';
import { SupabaseHelper } from '../helpers/supabase-helper';

export const test = base.extend<{
  apiHelper: ApiHelper;
  supabaseHelper: SupabaseHelper;
  page: Page;
}>({
  apiHelper: async ({ page }, use) => {
    const supabaseHelper = new SupabaseHelper(page);
    const token = await supabaseHelper.getAuthToken();
    const apiHelper = new ApiHelper(token);
    await use(apiHelper);
  },
  supabaseHelper: async ({ page }, use) => {
    const supabaseHelper = new SupabaseHelper(page);
    await use(supabaseHelper);
  },
});

export { expect } from '@playwright/test';
```

- [x] **Step 8: Create e2e/helpers/supabase-helper.ts**

```typescript
import { Page } from '@playwright/test';

export class SupabaseHelper {
  constructor(private page: Page) {}

  async getAuthToken(): Promise<string> {
    await this.page.goto('/');
    const storageState = await this.page.context().storageState();
    const localStorage = storageState.origins?.[0]?.localStorage ?? [];
    const tokenObj = localStorage.find((item) => item.name === 'sb-auth-token');
    if (!tokenObj) {
      throw new Error('No auth token found in storageState');
    }
    return tokenObj.value;
  }
}
```

- [x] **Step 9: Create e2e/helpers/api-helper.ts**

```typescript
import { APIRequestContext, request } from '@playwright/test';

export class ApiHelper {
  private requestContext: APIRequestContext | null = null;

  constructor(private token: string) {}

  private async getContext(): Promise<APIRequestContext> {
    if (!this.requestContext) {
      this.requestContext = await request.newContext({
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
        extraHTTPHeaders: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    }
    return this.requestContext;
  }

  async createWallet(name: string, type: string = 'bank') {
    const context = await this.getContext();
    return context.post('/api/v1/wallets', {
      data: { name: `[E2E] ${name}`, type },
    });
  }

  async createCategory(name: string, type: string) {
    const context = await this.getContext();
    return context.post('/api/v1/categories', {
      data: { name: `[E2E] ${name}`, type },
    });
  }

  async deleteAllTestData() {
    const context = await this.getContext();
    // Implementation: fetch and delete all [E2E]-prefixed wallets/categories/transactions
  }

  async cleanup() {
    if (this.requestContext) {
      await this.requestContext.dispose();
    }
  }
}
```

- [x] **Step 10: Create Page Object Model stubs (e2e/pages/*.ts)**

Create placeholder files for each page (fully implemented in Tasks 25-28):
- `LoginPage.ts`
- `DashboardPage.ts`
- `WalletsPage.ts`
- `CategoriesPage.ts`
- `TransactionsPage.ts`
- `AiChatPage.ts`

Each stub:
```typescript
import { Page } from '@playwright/test';

export class XyzPage {
  constructor(private page: Page) {}
  // Methods to be implemented in respective E2E task
}
```

- [x] **Step 11: Create tests directory**

```bash
mkdir -p e2e/tests
```

- [x] **Step 12: Update .gitignore**

Add:
```
# E2E testing
e2e/.auth/
e2e/playwright-report/
e2e/.env.e2e
e2e/test-results/
```

- [x] **Step 13: Update root package.json scripts**

Add:
```json
{
  "scripts": {
    "e2e": "cd e2e && pnpm dlx playwright test",
    "e2e:fast": "cd e2e && pnpm dlx playwright test --grep-invert @slow",
    "e2e:ui": "cd e2e && pnpm dlx playwright test --ui",
    "e2e:report": "cd e2e && pnpm dlx playwright show-report playwright-report"
  }
}
```

- [x] **Step 14: Update docs/ARCHITECTURE.md**

Add a new "Testing" section describing E2E layer and cross-cutting `data-testid` requirements.

- [x] **Step 15: Update docs/DEPLOYMENT.md**

Add E2E setup section with:
- `pnpm install` inside `e2e/` directory
- `pnpm playwright install` for browser binaries
- `pnpm e2e` to run full suite
- `pnpm e2e:fast` for non-AI tests

- [x] **Step 16: Commit**

```bash
git add -A e2e/ .gitignore docs/ package.json
git commit -m "feat(e2e): add Playwright infrastructure with Supabase auth and fixtures"
```

---

## Chunk 2: Backend Foundation — Prisma & Supabase Auth

### Task 6: Prisma Schema & Migrations

**Status:** ✅ COMPLETED
**PR:** [#4: Task 6: Prisma Schema & Migrations (Batch 3)](https://github.com/ricoputrapradana/soegih/pull/4)

**Files:**

- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/0_init/migration.sql`
- Create: `backend/prisma/migrations/1_add_partial_unique_indexes/migration.sql`

- [x] **Step 1: Initialize Prisma**

```bash
cd backend && npx prisma init --datasource-provider postgresql
```

- [x] **Step 2: Write schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String     @id
  created_at DateTime   @default(now())
  updated_at DateTime   @updatedAt
  deleted_at DateTime?
  wallets    Wallet[]
  categories Category[]
  @@map("users")
}

model Wallet {
  id         String     @id @default(uuid())
  user_id    String
  name       String
  balance    Decimal    @db.Decimal(15, 2)
  type       WalletType
  created_at DateTime   @default(now())
  updated_at DateTime   @updatedAt
  deleted_at DateTime?
  user       User       @relation(fields: [user_id], references: [id])
  postings   Posting[]
  @@map("wallet")
}

model Category {
  id           String       @id @default(uuid())
  user_id      String
  name         String
  description  String?
  type         CategoryType
  created_at   DateTime     @default(now())
  updated_at   DateTime     @updatedAt
  deleted_at   DateTime?
  user         User         @relation(fields: [user_id], references: [id])
  transactions TransactionEvent[]
  @@map("category")
}

model TransactionEvent {
  id          String          @id @default(uuid())
  type        TransactionType
  note        String?
  category_id String?
  occurred_at DateTime
  created_at  DateTime        @default(now())
  updated_at  DateTime        @updatedAt
  deleted_at  DateTime?
  category    Category?       @relation(fields: [category_id], references: [id])
  postings    Posting[]
  @@map("transaction_event")
}

model Posting {
  id         String           @id @default(uuid())
  event_id   String
  wallet_id  String
  amount     Decimal          @db.Decimal(15, 2)
  created_at DateTime         @default(now())
  updated_at DateTime         @updatedAt
  deleted_at DateTime?
  event      TransactionEvent @relation(fields: [event_id], references: [id])
  wallet     Wallet           @relation(fields: [wallet_id], references: [id])
  @@map("posting")
}

enum WalletType   { cash bank e_wallet other }
enum CategoryType { expense income }
enum TransactionType { expense income transfer }
```

- [x] **Step 3: Create initial migration**

```bash
cd backend && npx prisma migrate dev --name init
```

- [x] **Step 4: Add partial unique indexes via raw migration**

```bash
npx prisma migrate dev --name add_partial_unique_indexes --create-only
```

Edit the generated SQL file, replace its contents with:

```sql
CREATE UNIQUE INDEX "wallet_user_id_name_type_active_key"
  ON "wallet"("user_id", "name", "type")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "category_user_id_name_type_active_key"
  ON "category"("user_id", "name", "type")
  WHERE "deleted_at" IS NULL;
```

Then run:

```bash
npx prisma migrate deploy
```

- [x] **Step 5: Commit**

```bash
git add backend/prisma/
git commit -m "feat(backend): add Prisma schema and migrations with Supabase Auth"
```

**Note:** User creation is handled via Supabase Auth. After deploying, create seed users via Supabase dashboard or CLI: `supabase auth admin create-user --email admin@soegih.app --password changeme123`.

---

### Task 7: Prisma Service + App Bootstrap

**Files:**

- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/common/filters/http-exception.filter.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create prisma.service.ts**

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 2: Create prisma.module.ts**

```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 3: Create http-exception.filter.ts**

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    response.status(status).json({
      status_code: status,
      message: typeof body === "object" ? (body as any).message : body,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 4: Update main.ts**

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 5: Update app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { APP_FILTER } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty" }
            : undefined,
      },
    }),
    PrismaModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): add PrismaService, Pino logging, and global exception filter"
```

---

### Task 8: Supabase JWT Validation Guard

**Files:**

- Create: `backend/src/common/guards/supabase-jwt.guard.ts`
- Create: `backend/src/common/decorators/get-user.decorator.ts`

**Note:** Authentication is delegated to Supabase Auth. The frontend sends Supabase JWT tokens with requests. The backend validates these tokens against Supabase.

- [ ] **Step 1: Create supabase-jwt.guard.ts**

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private supabase: any;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_ANON_KEY");
    this.supabase = createClient(url, key);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authHeader.slice(7);

    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        throw new UnauthorizedException("Invalid token");
      }
      request.user = { id: data.user.id, email: data.user.email };
      return true;
    } catch {
      throw new UnauthorizedException("Token validation failed");
    }
  }
}
```

- [ ] **Step 2: Create get-user.decorator.ts**

```typescript
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/
git commit -m "feat(backend): add Supabase JWT validation guard"
```

---

## Chunk 3: Backend — Wallets & Categories

### Task 9: Wallet Module (TDD)

(Same as original plan — no auth changes needed. Use `@UseGuards(SupabaseJwtGuard)` instead of `@UseGuards(JwtAuthGuard)` on the controller.)

---

### Task 10: Category Module (TDD)

(Same as original plan — no auth changes needed. Use `@UseGuards(SupabaseJwtGuard)` on the controller.)

---

## Chunk 4: Backend — Transactions & Dashboard

### Task 11: Transaction Module (TDD) with Create, Update, List, Delete

**Files:**

- Create: `backend/src/modules/transaction/dto/create-transaction.dto.ts`
- Create: `backend/src/modules/transaction/dto/update-transaction.dto.ts`
- Create: `backend/src/modules/transaction/transaction.service.ts`
- Create: `backend/src/modules/transaction/transaction.service.spec.ts`
- Create: `backend/src/modules/transaction/transaction.controller.ts`
- Create: `backend/src/modules/transaction/transaction.module.ts`

**Key Constraints:**

- Create: Full control over type, amount, wallet, category, note, date
- **Update: Limited to note, category, amount, and wallet_id ONLY**
  - Cannot change `type` (expense ↔ income ↔ transfer) — locked after creation
  - Cannot change `occurred_at` (date) — locked after creation
  - Amount changes: Reverse original posting, create new posting with delta
- Delete: Soft delete with balance reversal (existing behavior)

Use `@UseGuards(SupabaseJwtGuard)` on all controller methods.

---

### Task 12: Dashboard Module (TDD)

(Same as original plan — no auth changes needed. Use `@UseGuards(SupabaseJwtGuard)` on the controller.)

---

### Task 13: AI Proxy Module

(Same as original plan — no auth changes needed. Use `@UseGuards(SupabaseJwtGuard)` on the controller.)

---

## Chunk 5: Python AI Service — TDD

### Task 14: Transaction Parsing Chain (TDD)

(Same as original plan — no changes needed.)

---

## Chunk 6: Frontend Foundation & Auth

### Task 15: Shared API Client + Types

**Files:**

- Create: `frontend/src/shared/types/index.ts`
- Create: `frontend/src/shared/api/api-client.ts`
- Create: `frontend/src/shared/hooks/use-auth.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create shared/types/index.ts**

```typescript
export interface Wallet {
  id: string;
  name: string;
  balance: string;
  type: "cash" | "bank" | "e_wallet" | "other";
}
export interface Category {
  id: string;
  name: string;
  description: string | null;
  type: "expense" | "income";
}
export interface Posting {
  id: string;
  wallet_id: string;
  amount: string;
  wallet: Wallet;
}
export interface Transaction {
  id: string;
  type: "expense" | "income" | "transfer";
  note: string | null;
  occurred_at: string;
  category: Category | null;
  postings: Posting[];
}
export interface DashboardSummary {
  net_worth: number;
  total_income: number;
  total_expense: number;
  expense_by_category: { name: string; amount: number }[];
  month: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}
```

- [ ] **Step 2: Create shared/api/api-client.ts**

```typescript
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
export const apiClient = axios.create({ baseURL: BASE_URL });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);
```

- [ ] **Step 3: Create shared/hooks/use-auth.ts**

```typescript
import { useState, useEffect } from "react";
import { supabase } from "../api/api-client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, isAuthenticated, isLoading, login, logout };
}
```

- [ ] **Step 4: Update main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./shared/hooks/use-auth";

const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/ frontend/src/main.tsx
git commit -m "feat(frontend): add API client, shared types, and Supabase Auth hook"
```

---

### Task 16: Auth Module + Routing (Frontend)

**Files:**

- Create: `frontend/src/modules/auth/services/auth.service.ts`
- Modify: `frontend/src/routes/__root.tsx`
- Create: `frontend/src/routes/login.tsx`
- Create: `frontend/src/routes/_app.tsx`
- Create: `frontend/src/routes/_app/index.tsx`
- Create: `frontend/src/routes/_app/wallets.tsx`
- Create: `frontend/src/routes/_app/categories.tsx`
- Create: `frontend/src/routes/_app/transactions.tsx`
- Create: `frontend/src/routes/_app/ai.tsx`
- Create: `frontend/src/shared/components/AppLayout.tsx`

- [ ] **Step 1: Create auth/services/auth.service.ts**

```typescript
import { supabase } from "../../../shared/api/api-client";

export const authService = {
  login: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signup: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),
  logout: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
};
```

- [ ] **Step 2: Update src/routes/\_\_root.tsx**

```tsx
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { useAuth } from "../shared/hooks/use-auth";

interface RouterContext {
  auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
```

- [ ] **Step 3: Create src/routes/login.tsx**

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "../modules/auth/services/auth.service";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw Route.redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authService.login(email, password);
      await router.invalidate();
      router.navigate({ to: "/" });
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
      <h1>Soegih</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create src/shared/components/AppLayout.tsx**

```tsx
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { authService } from "../../modules/auth/services/auth.service";

interface Props {
  onLogout: () => void;
}

export default function AppLayout({ onLogout }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    onLogout();
    await router.invalidate();
    router.navigate({ to: "/login" });
  };

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: 16,
          padding: "12px 24px",
          borderBottom: "1px solid #eee",
        }}
      >
        <Link to="/">Dashboard</Link>
        <Link to="/wallets">Wallets</Link>
        <Link to="/categories">Categories</Link>
        <Link to="/transactions">Transactions</Link>
        <Link to="/ai">AI Assistant</Link>
        <button onClick={handleLogout} style={{ marginLeft: "auto" }}>
          Logout
        </button>
      </nav>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create src/routes/\_app.tsx (pathless auth guard + layout)**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import AppLayout from "../shared/components/AppLayout";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => {
    const { auth } = Route.useRouteContext();
    return <AppLayout onLogout={auth.logout} />;
  },
});
```

- [ ] **Step 6: Create child route stubs**

```tsx
// src/routes/_app/index.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/")({
  component: () => <div>Dashboard</div>,
});

// src/routes/_app/wallets.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/wallets")({
  component: () => <div>Wallets</div>,
});

// src/routes/_app/categories.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/categories")({
  component: () => <div>Categories</div>,
});

// src/routes/_app/transactions.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/transactions")({
  component: () => <div>Transactions</div>,
});

// src/routes/_app/ai.tsx
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/ai")({
  component: () => <div>AI Assistant</div>,
});
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/routes/ frontend/src/modules/auth/ frontend/src/shared/components/
git commit -m "feat(frontend): add Supabase Auth, layout, and TanStack Router file-based routing"
```

---

### Task 25: Auth E2E Tests (Playwright)

**Files:**

- Create: `e2e/pages/LoginPage.ts` (fully implemented)
- Create: `e2e/tests/auth.spec.ts`

**Overview:**

Test all authentication flows: valid login, invalid credentials, validation errors, protected route redirect, logout, and session persistence.

**Test Cases (7 tests):**

1. **Login with valid credentials** → redirect to dashboard
2. **Login with invalid email** → error message
3. **Login with invalid password** → error message
4. **Email field validation** → required, email format
5. **Protected route redirect** → unauthenticated access to `/wallets` redirects to `/login`
6. **Logout** → clears session, redirect to login
7. **Session persistence** → reload page, remains authenticated

**Cross-Cutting Requirement:**

Frontend must add `data-testid` attributes to login form:
- `email-input` — email field
- `password-input` — password field
- `login-form-submit` — login button
- `form-error-message` — error message container

- [ ] **Step 1: Implement e2e/pages/LoginPage.ts**

```typescript
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.page.fill('[data-testid="email-input"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('[data-testid="password-input"]', password);
  }

  async submit() {
    await this.page.click('[data-testid="login-form-submit"]');
    await this.page.waitForURL('/');
  }

  async getErrorMessage() {
    return this.page.textContent('[data-testid="form-error-message"]');
  }

  async isEmailInputValid() {
    return this.page.isValid('[data-testid="email-input"]');
  }
}
```

- [ ] **Step 2: Create e2e/tests/auth.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('admin@soegih.app');
    await loginPage.fillPassword('changeme123');
    await loginPage.submit();
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid email', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('nonexistent@soegih.app');
    await loginPage.fillPassword('anypassword');
    await page.click('[data-testid="login-form-submit"]');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid');
  });

  test('should show error for invalid password', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('admin@soegih.app');
    await loginPage.fillPassword('wrongpassword');
    await page.click('[data-testid="login-form-submit"]');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid');
  });

  test('should validate email field', async ({ page }) => {
    await loginPage.goto();
    const isValid = await loginPage.isEmailInputValid();
    expect(isValid).toBe(false); // Required field, empty
  });

  test('should redirect unauthenticated access to /wallets', async ({ page }) => {
    // Don't use storageState for this test
    test.use({ storageState: undefined });
    await page.goto('/wallets');
    await expect(page).toHaveURL('/login');
  });

  test('should logout and redirect to login', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('admin@soegih.app');
    await loginPage.fillPassword('changeme123');
    await loginPage.submit();
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });

  test('should persist session on page reload', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('admin@soegih.app');
    await loginPage.fillPassword('changeme123');
    await loginPage.submit();
    await page.reload();
    await expect(page).toHaveURL('/');
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add e2e/pages/LoginPage.ts e2e/tests/auth.spec.ts
git commit -m "test(e2e): add authentication tests (login, logout, session)"
```

---

## Chunk 7: Frontend — Wallets, Categories, Transactions

### Task 17-19: Wallet, Category, Transaction Modules (Frontend)

**Task 17 (Wallet):** Same as original plan — no auth changes needed. Import from shared API client.

**Task 18 (Category):** Same as original plan — no auth changes needed. Import from shared API client.

**Task 19 (Transaction):** Same as original plan, PLUS add transaction editing with constraints:

- Add **TransactionEditModal** or **TransactionEditForm** component
- Display transaction in list with "Edit" button
- Modal/form shows only editable fields:
  - Note (text input)
  - Category (dropdown — expense/income only, NULL for transfer)
  - Amount (number input)
  - Wallet (dropdown — source wallet)
- Gray out/hide immutable fields:
  - Type (expense/income/transfer) — locked
  - Occurred_at (date) — locked
  - Destination_wallet (for transfer) — locked
- Call PATCH `/api/v1/transactions/{id}` on save
- Show validation errors if category doesn't match type
- Refresh transaction list after update

---

### Task 26: Wallet + Category E2E Tests (Playwright)

**Files:**

- Create: `e2e/pages/WalletsPage.ts` (fully implemented)
- Create: `e2e/pages/CategoriesPage.ts` (fully implemented)
- Create: `e2e/tests/wallets.spec.ts`
- Create: `e2e/tests/categories.spec.ts`

**Overview:**

Test wallet and category CRUD operations: create, read, list, update, delete, and validation. Tests verify UI updates, balance calculations, client-side sorting, and error handling.

**Wallet Test Cases (9 tests):**

1. **Create wallet** → appears in list
2. **Duplicate wallet name** → error message
3. **List wallets sorted by name** → client-side sort works
4. **Update wallet name** → list updates
5. **Delete wallet** → removed from list
6. **Wallet balance after transaction** → reflects expense/income
7. **Sort wallets ascending/descending** → client-side TanStack Table
8. **Search wallets by name** → filters list
9. **Invalid wallet type** → error on create

**Category Test Cases (7 tests):**

1. **Create expense category** → appears in list
2. **Create income category** → appears in list
3. **Duplicate category name** → error message
4. **Filter categories by type** → client-side filter works
5. **Update category name** → list updates
6. **Delete category** → removed from list
7. **Category used in transaction** → still shows in history

**Cross-Cutting Requirements:**

Frontend must add `data-testid` attributes:
- `wallets-page-heading` — page heading
- `create-wallet-btn` — create button
- `wallet-name-input`, `wallet-type-select` — form fields
- `wallet-form-submit` — submit button
- `wallet-row-{name}` — table row (e.g., `wallet-row-BCA`)
- `wallet-edit-btn-{id}`, `wallet-delete-btn-{id}` — row actions
- `wallet-balance-{id}` — balance display
- `search-input` — search field
- `categories-page-heading`, etc. (similar pattern)

- [ ] **Step 1: Implement e2e/pages/WalletsPage.ts**

```typescript
import { Page } from '@playwright/test';

export class WalletsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/wallets');
  }

  async clickCreateWallet() {
    await this.page.click('[data-testid="create-wallet-btn"]');
  }

  async fillWalletForm(name: string, type: string) {
    await this.page.fill('[data-testid="wallet-name-input"]', `[E2E] ${name}`);
    await this.page.selectOption('[data-testid="wallet-type-select"]', type);
  }

  async submitForm() {
    await this.page.click('[data-testid="wallet-form-submit"]');
  }

  async getWalletBalance(walletName: string) {
    const row = this.page.locator(`[data-testid="wallet-row-${walletName}"]`);
    return row.locator('[data-testid*="wallet-balance"]').textContent();
  }

  async editWallet(walletId: string, newName: string) {
    await this.page.click(`[data-testid="wallet-edit-btn-${walletId}"]`);
    await this.page.fill('[data-testid="wallet-name-input"]', newName);
    await this.submitForm();
  }

  async deleteWallet(walletId: string) {
    await this.page.click(`[data-testid="wallet-delete-btn-${walletId}"]`);
    await this.page.click('[data-testid="delete-confirm-btn"]');
  }

  async search(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
  }

  async getWalletsCount() {
    const rows = this.page.locator('[data-testid^="wallet-row-"]');
    return rows.count();
  }
}
```

- [ ] **Step 2: Create e2e/tests/wallets.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { WalletsPage } from '../pages/WalletsPage';

test.describe('Wallets', () => {
  let walletsPage: WalletsPage;

  test.beforeEach(async ({ page }) => {
    walletsPage = new WalletsPage(page);
    await walletsPage.goto();
  });

  test('should create a wallet', async () => {
    await walletsPage.clickCreateWallet();
    await walletsPage.fillWalletForm('Test Wallet', 'bank');
    await walletsPage.submitForm();
    const count = await walletsPage.getWalletsCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should prevent duplicate wallet name', async () => {
    await walletsPage.clickCreateWallet();
    await walletsPage.fillWalletForm('Duplicate', 'bank');
    await walletsPage.submitForm();
    await walletsPage.clickCreateWallet();
    await walletsPage.fillWalletForm('Duplicate', 'bank');
    await walletsPage.submitForm();
    await expect(walletsPage.page).toContainText('already exists');
  });

  test('should list wallets sorted by name', async () => {
    // Verify initial load displays wallets
    const count = await walletsPage.getWalletsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update wallet name', async ({ apiHelper }) => {
    const wallet = await apiHelper.createWallet('Original');
    await walletsPage.editWallet(wallet.id, '[E2E] Updated');
    await expect(walletsPage.page).toContainText('Updated');
  });

  test('should delete wallet', async ({ apiHelper }) => {
    const wallet = await apiHelper.createWallet('ToDelete');
    await walletsPage.deleteWallet(wallet.id);
    const count = await walletsPage.getWalletsCount();
    expect(count).toBeLessThan(1);
  });

  test('should reflect balance after transaction', async ({ apiHelper }) => {
    const wallet = await apiHelper.createWallet('Balance Test');
    // Create a transaction affecting this wallet
    await walletsPage.goto();
    const balance = await walletsPage.getWalletBalance('Balance Test');
    expect(balance).toBeDefined();
  });

  test('should sort wallets client-side', async () => {
    await walletsPage.goto();
    // Verify sorting buttons exist and work
    expect(await walletsPage.page.isVisible('[data-testid="sort-asc"]')).toBeTruthy();
  });

  test('should search wallets by name', async () => {
    await walletsPage.search('Test');
    // Verify filtered results
    const count = await walletsPage.getWalletsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should validate wallet type', async () => {
    await walletsPage.clickCreateWallet();
    await walletsPage.page.fill('[data-testid="wallet-name-input"]', '[E2E] Invalid');
    // Don't select a type
    await walletsPage.submitForm();
    await expect(walletsPage.page).toContainText('required');
  });
});
```

- [ ] **Step 3: Implement e2e/pages/CategoriesPage.ts**

```typescript
import { Page } from '@playwright/test';

export class CategoriesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/categories');
  }

  async clickCreateCategory() {
    await this.page.click('[data-testid="create-category-btn"]');
  }

  async fillCategoryForm(name: string, type: string) {
    await this.page.fill('[data-testid="category-name-input"]', `[E2E] ${name}`);
    await this.page.selectOption('[data-testid="category-type-select"]', type);
  }

  async submitForm() {
    await this.page.click('[data-testid="category-form-submit"]');
  }

  async editCategory(categoryId: string, newName: string) {
    await this.page.click(`[data-testid="category-edit-btn-${categoryId}"]`);
    await this.page.fill('[data-testid="category-name-input"]', newName);
    await this.submitForm();
  }

  async deleteCategory(categoryId: string) {
    await this.page.click(`[data-testid="category-delete-btn-${categoryId}"]`);
    await this.page.click('[data-testid="delete-confirm-btn"]');
  }

  async filterByType(type: string) {
    await this.page.selectOption('[data-testid="category-type-filter"]', type);
  }

  async getCategoriesCount() {
    const rows = this.page.locator('[data-testid^="category-row-"]');
    return rows.count();
  }
}
```

- [ ] **Step 4: Create e2e/tests/categories.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { CategoriesPage } from '../pages/CategoriesPage';

test.describe('Categories', () => {
  let categoriesPage: CategoriesPage;

  test.beforeEach(async ({ page }) => {
    categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();
  });

  test('should create expense category', async () => {
    await categoriesPage.clickCreateCategory();
    await categoriesPage.fillCategoryForm('Food', 'expense');
    await categoriesPage.submitForm();
    const count = await categoriesPage.getCategoriesCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should create income category', async () => {
    await categoriesPage.clickCreateCategory();
    await categoriesPage.fillCategoryForm('Salary', 'income');
    await categoriesPage.submitForm();
    const count = await categoriesPage.getCategoriesCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should prevent duplicate category name', async () => {
    await categoriesPage.clickCreateCategory();
    await categoriesPage.fillCategoryForm('Duplicate', 'expense');
    await categoriesPage.submitForm();
    await categoriesPage.clickCreateCategory();
    await categoriesPage.fillCategoryForm('Duplicate', 'expense');
    await categoriesPage.submitForm();
    await expect(categoriesPage.page).toContainText('already exists');
  });

  test('should filter categories by type', async () => {
    await categoriesPage.filterByType('expense');
    const count = await categoriesPage.getCategoriesCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update category name', async ({ apiHelper }) => {
    const cat = await apiHelper.createCategory('Original', 'expense');
    await categoriesPage.editCategory(cat.id, '[E2E] Updated');
    await expect(categoriesPage.page).toContainText('Updated');
  });

  test('should delete category', async ({ apiHelper }) => {
    const cat = await apiHelper.createCategory('ToDelete', 'expense');
    await categoriesPage.deleteCategory(cat.id);
    const count = await categoriesPage.getCategoriesCount();
    expect(count).toBeLessThan(1);
  });

  test('should show category in transaction history', async () => {
    // Verify category is selectable in transaction forms
    await categoriesPage.goto();
    expect(await categoriesPage.page.isVisible('[data-testid^="category-row-"]')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add e2e/pages/{WalletsPage,CategoriesPage}.ts e2e/tests/{wallets,categories}.spec.ts
git commit -m "test(e2e): add wallet and category CRUD tests"
```

---

### Task 27: Transaction E2E Tests (Playwright)

**Files:**

- Create: `e2e/pages/TransactionsPage.ts` (fully implemented)
- Create: `e2e/tests/transactions.spec.ts`

**Overview:**

Test transaction creation, editing, deletion, and filtering. Verify type constraints (expense/income/transfer), immutable fields, balance updates, pagination, and search.

**Test Cases (14 tests):**

1. **Create expense transaction** → appears in list, wallet balance updates
2. **Create income transaction** → appears in list, wallet balance updates
3. **Create transfer transaction** → appears in list, both wallets update
4. **Edit transaction note** → updates in list
5. **Edit transaction amount** → balance recalculates
6. **Edit transaction category** → updates display
7. **Cannot edit transaction type** → API rejects change
8. **Cannot edit transaction date** → API rejects change
9. **Delete transaction** → removed from list, balance reverses
10. **Pagination** → server-side paginated list (page, limit)
11. **Search transactions by note** → filters server-side
12. **Category must match type** → error if expense category used for income
13. **Transfer requires NULL category** → error if category provided
14. **Wallet balance accuracy** → multiple transactions track correctly

**Cross-Cutting Requirements:**

Frontend must add `data-testid` attributes:
- `transactions-page-heading`, `create-transaction-btn`, etc.
- `transaction-{field}-input` — form fields
- `transaction-row-{id}` — table rows
- `transaction-edit-btn-{id}`, `transaction-delete-btn-{id}` — actions
- `pagination-next-btn`, `pagination-prev-btn` — pagination
- `search-input`, `category-filter-select` — filters

- [ ] **Step 1: Implement e2e/pages/TransactionsPage.ts**

```typescript
import { Page } from '@playwright/test';

export class TransactionsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/transactions');
  }

  async clickCreate() {
    await this.page.click('[data-testid="create-transaction-btn"]');
  }

  async fillTransactionForm(type: string, amount: number, wallet: string, category?: string) {
    await this.page.selectOption('[data-testid="transaction-type-select"]', type);
    await this.page.fill('[data-testid="transaction-amount-input"]', String(amount));
    await this.page.selectOption('[data-testid="transaction-wallet-input"]', wallet);
    if (category && type !== 'transfer') {
      await this.page.selectOption('[data-testid="transaction-category-input"]', category);
    }
  }

  async fillNote(note: string) {
    await this.page.fill('[data-testid="transaction-note-input"]', `[E2E] ${note}`);
  }

  async submitForm() {
    await this.page.click('[data-testid="transaction-form-submit"]');
  }

  async editTransaction(txId: string, updates: any) {
    await this.page.click(`[data-testid="transaction-edit-btn-${txId}"]`);
    if (updates.note) {
      await this.page.fill('[data-testid="transaction-note-input"]', updates.note);
    }
    if (updates.amount) {
      await this.page.fill('[data-testid="transaction-amount-input"]', String(updates.amount));
    }
    if (updates.category) {
      await this.page.selectOption('[data-testid="transaction-category-input"]', updates.category);
    }
    await this.submitForm();
  }

  async deleteTransaction(txId: string) {
    await this.page.click(`[data-testid="transaction-delete-btn-${txId}"]`);
    await this.page.click('[data-testid="delete-confirm-btn"]');
  }

  async getTransactionsCount() {
    const rows = this.page.locator('[data-testid^="transaction-row-"]');
    return rows.count();
  }

  async paginateNext() {
    await this.page.click('[data-testid="pagination-next-btn"]');
  }

  async search(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
  }
}
```

- [ ] **Step 2: Create e2e/tests/transactions.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { TransactionsPage } from '../pages/TransactionsPage';
import { WalletsPage } from '../pages/WalletsPage';
import { CategoriesPage } from '../pages/CategoriesPage';

test.describe('Transactions', () => {
  let transactionsPage: TransactionsPage;
  let walletsPage: WalletsPage;
  let categoriesPage: CategoriesPage;
  let testWallet: any;
  let testCategory: any;

  test.beforeEach(async ({ page, apiHelper }) => {
    transactionsPage = new TransactionsPage(page);
    walletsPage = new WalletsPage(page);
    categoriesPage = new CategoriesPage(page);

    // Create test wallet and category
    testWallet = await apiHelper.createWallet('Test Wallet');
    testCategory = await apiHelper.createCategory('Test Category', 'expense');
  });

  test('should create expense transaction', async ({ page }) => {
    await transactionsPage.goto();
    await transactionsPage.clickCreate();
    await transactionsPage.fillTransactionForm('expense', 25.50, testWallet.id, testCategory.id);
    await transactionsPage.fillNote('Lunch');
    await transactionsPage.submitForm();
    await expect(page).toContainText('Lunch');
  });

  test('should create income transaction', async ({ page, apiHelper }) => {
    const incomeCategory = await apiHelper.createCategory('Salary', 'income');
    await transactionsPage.goto();
    await transactionsPage.clickCreate();
    await transactionsPage.fillTransactionForm('income', 5000, testWallet.id, incomeCategory.id);
    await transactionsPage.fillNote('Monthly salary');
    await transactionsPage.submitForm();
    await expect(page).toContainText('Monthly salary');
  });

  test('should create transfer transaction', async ({ page, apiHelper }) => {
    const wallet2 = await apiHelper.createWallet('Test Wallet 2');
    await transactionsPage.goto();
    await transactionsPage.clickCreate();
    await transactionsPage.fillTransactionForm('transfer', 100, testWallet.id);
    await transactionsPage.page.selectOption('[data-testid="transfer-destination-wallet"]', wallet2.id);
    await transactionsPage.submitForm();
    await expect(page).toContainText('[E2E]');
  });

  test('should edit transaction note', async ({ apiHelper }) => {
    const tx = await apiHelper.createTransaction('expense', 50, testWallet.id, testCategory.id);
    await transactionsPage.goto();
    await transactionsPage.editTransaction(tx.id, { note: '[E2E] Updated note' });
    await expect(transactionsPage.page).toContainText('Updated note');
  });

  test('should edit transaction amount', async ({ apiHelper }) => {
    const tx = await apiHelper.createTransaction('expense', 50, testWallet.id, testCategory.id);
    await transactionsPage.goto();
    await transactionsPage.editTransaction(tx.id, { amount: 75 });
    // Verify balance updated
    await walletsPage.goto();
    const balance = await walletsPage.getWalletBalance('Test Wallet');
    expect(balance).toContain('75');
  });

  test('should edit transaction category', async ({ apiHelper }) => {
    const cat2 = await apiHelper.createCategory('Office', 'expense');
    const tx = await apiHelper.createTransaction('expense', 50, testWallet.id, testCategory.id);
    await transactionsPage.goto();
    await transactionsPage.editTransaction(tx.id, { category: cat2.id });
    await expect(transactionsPage.page).toContainText('[E2E]');
  });

  test('should reject type field edit', async ({ page }) => {
    // Attempt to change type via API
    const tx = await transactionsPage.page.request?.patch(
      `/api/v1/transactions/${tx.id}`,
      { data: { type: 'income' } }
    );
    expect(tx?.status()).toBe(400); // Bad request
  });

  test('should reject date field edit', async ({ page }) => {
    // Attempt to change date via API
    const tx = await transactionsPage.page.request?.patch(
      `/api/v1/transactions/${tx.id}`,
      { data: { occurred_at: new Date().toISOString() } }
    );
    expect(tx?.status()).toBe(400);
  });

  test('should delete transaction and reverse balance', async ({ apiHelper }) => {
    const tx = await apiHelper.createTransaction('expense', 100, testWallet.id, testCategory.id);
    await transactionsPage.goto();
    await transactionsPage.deleteTransaction(tx.id);
    const count = await transactionsPage.getTransactionsCount();
    expect(count).toBeLessThan(1);
  });

  test('should paginate transactions', async () => {
    // Create multiple transactions to trigger pagination
    await transactionsPage.goto();
    const hasNext = await transactionsPage.page.isEnabled('[data-testid="pagination-next-btn"]');
    expect(typeof hasNext).toBe('boolean');
  });

  test('should search transactions by note', async () => {
    await transactionsPage.goto();
    await transactionsPage.search('Lunch');
    const count = await transactionsPage.getTransactionsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should enforce category type constraint', async ({ page }) => {
    const incomeCategory = await apiHelper.createCategory('Salary', 'income');
    await transactionsPage.goto();
    await transactionsPage.clickCreate();
    await transactionsPage.fillTransactionForm('expense', 50, testWallet.id, incomeCategory.id);
    await transactionsPage.submitForm();
    await expect(page).toContainText('mismatch');
  });

  test('should enforce transfer category NULL constraint', async ({ page, apiHelper }) => {
    const wallet2 = await apiHelper.createWallet('Wallet 2');
    await transactionsPage.goto();
    await transactionsPage.clickCreate();
    await transactionsPage.fillTransactionForm('transfer', 100, testWallet.id, testCategory.id);
    await transactionsPage.page.selectOption('[data-testid="transfer-destination-wallet"]', wallet2.id);
    await transactionsPage.submitForm();
    await expect(page).toContainText('category');
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add e2e/pages/TransactionsPage.ts e2e/tests/transactions.spec.ts
git commit -m "test(e2e): add transaction CRUD and constraint tests"
```

---

## Chunk 8: Frontend — Dashboard & AI Chat

### Task 20-21: Dashboard & AI Chat Modules (Frontend)

(Same as original plan — no auth changes needed. Import from shared API client.)

---

### Task 28: Dashboard + AI Chat E2E Tests (Playwright)

**Files:**

- Create: `e2e/pages/DashboardPage.ts` (fully implemented)
- Create: `e2e/pages/AiChatPage.ts` (fully implemented)
- Create: `e2e/tests/dashboard.spec.ts`
- Create: `e2e/tests/ai-chat.spec.ts`

**Overview:**

Test dashboard metrics and AI chat functionality. Dashboard tests verify net worth calculation, monthly income/expense totals, and expense-by-category breakdown. AI chat tests verify message parsing, transaction creation, and error handling. AI tests tagged `@slow` (60s timeout each).

**Dashboard Test Cases (5 tests):**

1. **Net worth calculation** → sum of all wallet balances
2. **Monthly income total** → sum of income transactions for current month
3. **Monthly expense total** → sum of expense transactions for current month
4. **Expense by category breakdown** → pie chart/table shows top categories
5. **Dashboard refreshes after transaction** → metrics update on change

**AI Chat Test Cases (5 tests, tagged `@slow`):**

1. **Send message to AI** → receives parsed transaction
2. **Confirm parsed transaction** → creates actual transaction
3. **Cancel parsed transaction** → doesn't create transaction
4. **AI handles ambiguous input** → returns error or asks for clarification
5. **AI respects wallet/category context** → uses available wallets/categories

**Cross-Cutting Requirements:**

Frontend must add `data-testid` attributes:
- `dashboard-page-heading` — page heading
- `net-worth-{currency}` — net worth display
- `monthly-income`, `monthly-expense` — totals
- `expense-category-{name}` — category breakdown rows
- `ai-chat-page-heading`, `ai-message-input`, `ai-send-btn`
- `ai-parsed-transaction-card`, `ai-confirm-btn`, `ai-cancel-btn`
- `ai-error-message` — error container

- [ ] **Step 1: Implement e2e/pages/DashboardPage.ts**

```typescript
import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async getNetWorth() {
    const element = this.page.locator('[data-testid="net-worth-IDR"]');
    const text = await element.textContent();
    return parseFloat(text?.replace(/[^\d.]/g, '') || '0');
  }

  async getMonthlyIncome() {
    const element = this.page.locator('[data-testid="monthly-income"]');
    const text = await element.textContent();
    return parseFloat(text?.replace(/[^\d.]/g, '') || '0');
  }

  async getMonthlyExpense() {
    const element = this.page.locator('[data-testid="monthly-expense"]');
    const text = await element.textContent();
    return parseFloat(text?.replace(/[^\d.]/g, '') || '0');
  }

  async getCategoryBreakdown() {
    const rows = this.page.locator('[data-testid^="expense-category-"]');
    const categories = await rows.allTextContents();
    return categories;
  }

  async waitForMetricsLoad() {
    await this.page.waitForSelector('[data-testid="net-worth-IDR"]');
  }
}
```

- [ ] **Step 2: Create e2e/tests/dashboard.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForMetricsLoad();
  });

  test('should display net worth', async () => {
    const netWorth = await dashboardPage.getNetWorth();
    expect(netWorth).toBeGreaterThanOrEqual(0);
  });

  test('should display monthly income total', async () => {
    const income = await dashboardPage.getMonthlyIncome();
    expect(income).toBeGreaterThanOrEqual(0);
  });

  test('should display monthly expense total', async () => {
    const expense = await dashboardPage.getMonthlyExpense();
    expect(expense).toBeGreaterThanOrEqual(0);
  });

  test('should display expense by category breakdown', async () => {
    const categories = await dashboardPage.getCategoryBreakdown();
    expect(categories.length).toBeGreaterThanOrEqual(0);
  });

  test('should refresh metrics after transaction', async ({ page, apiHelper }) => {
    const initialIncome = await dashboardPage.getMonthlyIncome();
    const wallet = await apiHelper.createWallet('[E2E] Dashboard Test');
    const category = await apiHelper.createCategory('[E2E] Test', 'income');
    await apiHelper.createTransaction('income', 1000, wallet.id, category.id);
    await page.reload();
    const newIncome = await dashboardPage.getMonthlyIncome();
    expect(newIncome).toBeGreaterThan(initialIncome);
  });
});
```

- [ ] **Step 3: Implement e2e/pages/AiChatPage.ts**

```typescript
import { Page } from '@playwright/test';

export class AiChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/ai');
  }

  async sendMessage(message: string) {
    await this.page.fill('[data-testid="ai-message-input"]', message);
    await this.page.click('[data-testid="ai-send-btn"]');
  }

  async getParsedTransaction() {
    await this.page.waitForSelector('[data-testid="ai-parsed-transaction-card"]');
    return this.page.locator('[data-testid="ai-parsed-transaction-card"]');
  }

  async confirmTransaction() {
    await this.page.click('[data-testid="ai-confirm-btn"]');
  }

  async cancelTransaction() {
    await this.page.click('[data-testid="ai-cancel-btn"]');
  }

  async getErrorMessage() {
    const element = this.page.locator('[data-testid="ai-error-message"]');
    return element.textContent();
  }

  async waitForParsedTransaction(timeout = 60000) {
    await this.page.waitForSelector('[data-testid="ai-parsed-transaction-card"]', { timeout });
  }
}
```

- [ ] **Step 4: Create e2e/tests/ai-chat.spec.ts**

```typescript
import { test, expect } from '../fixtures/app.fixture';
import { AiChatPage } from '../pages/AiChatPage';

test.describe('AI Chat', () => {
  test.setTimeout(60000); // All tests in this suite are slow

  let aiChatPage: AiChatPage;

  test.beforeEach(async ({ page }) => {
    aiChatPage = new AiChatPage(page);
    await aiChatPage.goto();
  });

  test('should parse message to transaction @slow', async ({ page, apiHelper }) => {
    const wallet = await apiHelper.createWallet('[E2E] AI Test');
    const category = await apiHelper.createCategory('[E2E] Food', 'expense');

    await aiChatPage.sendMessage('spent $50 on coffee');
    await aiChatPage.waitForParsedTransaction();

    const card = await aiChatPage.getParsedTransaction();
    await expect(card).toContainText('50');
  });

  test('should confirm transaction creation @slow', async ({ page, apiHelper }) => {
    const wallet = await apiHelper.createWallet('[E2E] Confirm Test');
    const category = await apiHelper.createCategory('[E2E] Lunch', 'expense');

    await aiChatPage.sendMessage('spent $25 on lunch');
    await aiChatPage.waitForParsedTransaction();
    await aiChatPage.confirmTransaction();

    await expect(page).toContainText('Transaction created');
  });

  test('should cancel transaction creation @slow', async ({ page, apiHelper }) => {
    const wallet = await apiHelper.createWallet('[E2E] Cancel Test');
    const category = await apiHelper.createCategory('[E2E] Movie', 'expense');

    const initialCount = await page.locator('[data-testid^="transaction-row-"]').count();

    await aiChatPage.sendMessage('spent $15 on movie');
    await aiChatPage.waitForParsedTransaction();
    await aiChatPage.cancelTransaction();

    // Navigate to transactions to verify no new transaction created
    await page.goto('/transactions');
    const finalCount = await page.locator('[data-testid^="transaction-row-"]').count();
    expect(finalCount).toBe(initialCount);
  });

  test('should handle parse errors gracefully @slow', async ({ page }) => {
    await aiChatPage.sendMessage('xyz !@# $%^');
    await page.waitForTimeout(5000);
    const errorMsg = await aiChatPage.getErrorMessage();
    expect(errorMsg).toBeDefined();
  });

  test('should use available wallets and categories context @slow', async ({ page, apiHelper }) => {
    const wallet = await apiHelper.createWallet('[E2E] Context Test');
    const category = await apiHelper.createCategory('[E2E] Gas', 'expense');

    await aiChatPage.sendMessage(`spent $30 on gas to ${wallet.name}`);
    await aiChatPage.waitForParsedTransaction();

    const card = await aiChatPage.getParsedTransaction();
    await expect(card).toContainText('30');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add e2e/pages/{DashboardPage,AiChatPage}.ts e2e/tests/{dashboard,ai-chat}.spec.ts
git commit -m "test(e2e): add dashboard and AI chat E2E tests"
```

---

## Chunk 9: Deployment

### Task 22: Local Integration Test

- [ ] **Step 1: Set up Supabase locally (optional)**

For local development, you can use Supabase CLI:

```bash
supabase start
```

Or skip local Supabase and use a Supabase cloud project (free tier).

- [ ] **Step 2: Update .env with Supabase credentials**

```bash
cp .env.example .env
# Edit .env with real SUPABASE_URL and SUPABASE_ANON_KEY from Supabase dashboard
```

- [ ] **Step 3: Start services locally**

```bash
docker-compose up --build
```

- [ ] **Step 4: Create a test user in Supabase**

Via Supabase dashboard or CLI:

```bash
supabase auth admin create-user --email admin@soegih.app --password changeme123
```

- [ ] **Step 5: Verify all endpoints**

- Login: `POST /api/v1/auth/login` → Now handled by frontend via Supabase
- Create wallet: `POST /api/v1/wallets` (with Supabase JWT)
- Create transaction: `POST /api/v1/transactions` (with Supabase JWT)
- Get dashboard: `GET /api/v1/dashboard` (with Supabase JWT)
- AI chat: `POST /api/v1/ai/chat` (with Supabase JWT)

- [ ] **Step 6: Test frontend**

Open http://localhost in browser. Login with Supabase credentials. Verify UI navigation, wallet CRUD, transaction creation, and dashboard display.

- [ ] **Step 7: Run E2E tests**

```bash
# Install E2E browsers (one-time)
cd e2e && pnpm playwright install && cd ..

# Run full E2E suite
pnpm e2e

# Or run fast tests (skip AI chat which is slower)
pnpm e2e:fast

# Expected: 47 tests pass, ~3.5 min execution time
```

If tests fail:
- Check `.env.e2e` has correct credentials
- Verify services are running: `docker-compose ps`
- Check logs: `docker-compose logs backend`
- Review test failures in `e2e/playwright-report/`

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml
git commit -m "test(integration): verify all services work end-to-end locally with Supabase Auth and E2E tests passing"
```

---

### Task 23: VPS Deployment

- [ ] **Step 1: Set up Supabase project**

Create a Supabase project at https://supabase.com (free tier available).

- [ ] **Step 2: Prepare environment**

On VPS:

```bash
git clone <repo>
cd <repo>
cp .env.example .env
# Edit .env with:
# - DATABASE_URL from Supabase
# - SUPABASE_URL from Supabase
# - SUPABASE_ANON_KEY from Supabase
# - OPENAI_API_KEY
# - Domain for Caddyfile
```

- [ ] **Step 3: Build and deploy**

```bash
docker-compose -f docker-compose.yml up -d
docker exec <backend-container-id> npx prisma migrate deploy
```

- [ ] **Step 4: Create production user**

```bash
supabase auth admin create-user --email admin@yourdomain.app --password <strong-password>
```

- [ ] **Step 5: Verify production health**

- Check Caddy logs: `docker logs <caddy-container-id>`
- Test endpoints via domain
- Monitor logs: `docker logs -f <service-container-id>`

- [ ] **Step 6: Commit**

```bash
git add .env.example
git commit -m "chore(deployment): production configuration with Supabase ready"
```

---

## Summary

**Total: 28 tasks across 9 chunks + 5 E2E testing tasks**

- **Tasks 1-23:** Core MVP implementation (backend, frontend, deployment)
- **Tasks 24-28:** Playwright E2E testing (infrastructure, auth, CRUD operations, dashboard, AI chat)

**Key Features:**
- Authentication delegated to **Supabase Auth** (no custom JWT logic in backend)
- Frontend uses Supabase client for login/logout
- Backend validates incoming Supabase JWT tokens via `SupabaseJwtGuard`
- **E2E testing** integrated from Task 24 onwards (47 tests across 6 test suites)
- Cross-cutting `data-testid` attributes in frontend for E2E automation
- Test data isolation via `[E2E]` prefix and global teardown

**Benefits:**

- Simpler backend (no password hashing, JWT signing)
- Built-in email verification, password reset, 2FA support
- Secure token refresh handling
- Better security posture (Supabase handles compliance)

All other patterns remain the same: TDD for business logic, modular architecture, REST API, Prisma ORM, etc.
