# Frontend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Soegih frontend from scratch with proper scaffolding, JWT auth, five feature modules (wallet, category, transaction, dashboard, AI chat), and full test coverage.

**Architecture:** TanStack Router v1 (file-based) handles routing with a `_authenticated` pathless layout route as the auth guard. TanStack Query v5 owns all server state. TanStack Table v8 powers data tables — client-side for wallets and categories, server-side for transactions. Auth is custom JWT: backend issues a token on login; frontend stores it in `localStorage` and injects it into every request via an Axios interceptor. The router receives auth state as context so `beforeLoad` hooks can redirect unauthenticated users without flash.

**Tech Stack:** React 18, Vite 5, TypeScript 5, TanStack Router v1, TanStack Query v5, TanStack Table v8, Axios, Recharts, Vitest 2 + @testing-library/react v16 + jsdom.

**Design Note:** All UI tasks (F3–F8) must invoke the `/frontend-design` skill before implementing components to ensure production-grade, accessible, responsive interfaces.

**Branch naming:** `feat/frontend-{task}-{description}` for each task. PR per task; merge before starting dependent task.

---

## File Map

```
frontend/
├── index.html                            # keep as-is
├── package.json                          # MODIFY: add query, testing deps
├── vite.config.ts                        # MODIFY: vitest config
├── tsconfig.json                         # MODIFY: add vitest/globals types
├── test/
│   └── setup.ts                          # CREATE: RTL matchers setup
└── src/
    ├── main.tsx                          # MODIFY: QueryClient + AuthProvider
    ├── routeTree.gen.ts                  # auto-generated (do not hand-edit)
    ├── shared/
    │   ├── api/
    │   │   ├── client.ts                 # Axios instance + interceptors
    │   │   └── types.ts                  # PaginatedResponse<T>, ApiError
    │   └── auth/
    │       ├── auth-context.tsx          # AuthProvider + useAuth + useAuthState
    │       └── token.ts                  # localStorage helpers
    └── routes/
    │   ├── __root.tsx                    # createRootRouteWithContext, Outlet
    │   ├── index.tsx                     # / → redirect to /dashboard or /login
    │   ├── login.tsx                     # /login page
    │   └── _authenticated/
    │       ├── route.tsx                 # layout: beforeLoad auth guard + AppShell wrapper
    │       ├── AppShell.tsx              # CREATE via /frontend-design: sidebar + topbar layout
    │       ├── dashboard.tsx             # /dashboard
    │       ├── wallets.tsx               # /wallets
    │       ├── categories.tsx            # /categories
    │       ├── transactions.tsx          # /transactions
    │       └── ai.tsx                    # /ai
    └── modules/
        ├── wallet/
        │   ├── types/index.ts
        │   ├── services/wallet.service.ts
        │   ├── hooks/use-wallets.ts
        │   ├── hooks/use-wallet-mutations.ts
        │   └── components/
        │       ├── WalletList.tsx        # TanStack Table (client-side)
        │       └── WalletForm.tsx        # Create/edit form
        ├── category/
        │   ├── types/index.ts
        │   ├── services/category.service.ts
        │   ├── hooks/use-categories.ts
        │   ├── hooks/use-category-mutations.ts
        │   └── components/
        │       ├── CategoryList.tsx
        │       └── CategoryForm.tsx
        ├── transaction/
        │   ├── types/index.ts
        │   ├── services/transaction.service.ts
        │   ├── hooks/use-transactions.ts
        │   ├── hooks/use-transaction-mutations.ts
        │   └── components/
        │       ├── TransactionList.tsx   # TanStack Table (server-side)
        │       └── TransactionForm.tsx
        ├── dashboard/
        │   ├── types/index.ts
        │   ├── services/dashboard.service.ts
        │   ├── hooks/use-dashboard.ts
        │   └── components/
        │       ├── DashboardStats.tsx
        │       └── ExpenseChart.tsx      # Recharts PieChart
        └── ai/
            ├── types/index.ts
            ├── services/ai.service.ts
            ├── hooks/use-ai-chat.ts
            └── components/
                ├── ChatInput.tsx
                ├── ChatMessages.tsx
                └── TransactionConfirmCard.tsx
```

---

## Chunk 1: Foundation

### Task F1: Re-scaffold Frontend

**Branch:** `feat/frontend-f1-rescaffold`

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`
- Create: `frontend/test/setup.ts`

- [ ] **Step 1: Update `package.json`**

Replace `frontend/package.json` with:

```json
{
  "name": "soegih-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-router": "^1.43.5",
    "@tanstack/react-query": "^5.56.2",
    "@tanstack/react-table": "^8.19.15",
    "axios": "^1.7.7",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "@tanstack/router-plugin": "^1.43.5",
    "typescript": "^5.5.3",
    "vite": "^5.4.8",
    "vitest": "^2.1.1",
    "@vitest/coverage-v8": "^2.1.1",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.1"
  }
}
```

Key changes from previous: adds `@tanstack/react-query`, `vitest`, `@testing-library/*`, `jsdom`; removes `@supabase/supabase-js` (auth is backend JWT only).

- [ ] **Step 2: Update `vite.config.ts`**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
```

- [ ] **Step 3: Update `frontend/tsconfig.json` — add Vitest globals types**

Add `"vitest/globals"` to `compilerOptions.types` so TypeScript resolves `describe`, `it`, `expect` etc. without explicit imports:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

If `tsconfig.json` already has a `types` array, append `"vitest/globals"` to it. If it does not have a `types` field, add it.

- [ ] **Step 4: Create `frontend/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Install dependencies**

```bash
cd frontend && pnpm install
```

Expected: lockfile updated, no errors.

- [ ] **Step 6: Verify build compiles**

```bash
cd frontend && pnpm build
```

Expected: `dist/` created with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/vite.config.ts frontend/tsconfig.json frontend/test/setup.ts frontend/pnpm-lock.yaml
git commit -m "feat(frontend): rescaffold with react-query, vitest, and testing-library"
```

---

### Task F2: Shared Infrastructure

**Branch:** `feat/frontend-f2-shared-infra`

**Depends on:** F1 merged

**Files:**
- Create: `frontend/src/shared/api/types.ts`
- Create: `frontend/src/shared/api/client.ts`
- Create: `frontend/src/shared/auth/token.ts`
- Create: `frontend/src/shared/auth/auth-context.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/routes/__root.tsx`
- Test: `frontend/src/shared/api/client.test.ts`
- Test: `frontend/src/shared/auth/token.test.ts`

- [ ] **Step 1: Write failing tests for token helpers**

Create `frontend/src/shared/auth/token.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from './token'

describe('token helpers', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no token stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    setToken('jwt-abc')
    expect(getToken()).toBe('jwt-abc')
  })

  it('clearToken removes the token', () => {
    setToken('jwt-abc')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd frontend && pnpm test
```

Expected: 3 failures (module not found).

- [ ] **Step 3: Create `frontend/src/shared/auth/token.ts`**

```typescript
const TOKEN_KEY = 'soegih_token'

export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token)

export const clearToken = (): void =>
  localStorage.removeItem(TOKEN_KEY)
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
cd frontend && pnpm test
```

Expected: 3 passing.

- [ ] **Step 5: Create `frontend/src/shared/api/types.ts`**

```typescript
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface ApiError {
  message: string
  statusCode: number
}
```

- [ ] **Step 6: Write failing test for API client**

Create `frontend/src/shared/api/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { setToken, clearToken } from '../auth/token'

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    clearToken()
    vi.resetModules() // ensure fresh module state per test
  })

  it('attaches Authorization header when token is present', async () => {
    setToken('test-jwt-123')
    const { apiClient } = await import('./client')
    // Simulate the interceptor by running it directly on a dummy config
    const handler = apiClient.interceptors.request as any
    // Extract the fulfilled handler (index 0 on the internal stack)
    const fulfilled = handler.handlers[0]?.fulfilled
    const config = { headers: axios.defaults.headers.common } as any
    const result = await fulfilled(config)
    expect(result.headers['Authorization']).toBe('Bearer test-jwt-123')
  })

  it('does not attach Authorization header when no token', async () => {
    const { apiClient } = await import('./client')
    const handler = apiClient.interceptors.request as any
    const fulfilled = handler.handlers[0]?.fulfilled
    const config = { headers: {} } as any
    const result = await fulfilled(config)
    expect(result.headers['Authorization']).toBeUndefined()
  })
})
```

- [ ] **Step 7: Create `frontend/src/shared/api/client.ts`**

```typescript
import axios from 'axios'
import { getToken, clearToken } from '../auth/token'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 8: Create `frontend/src/shared/auth/auth-context.tsx`**

`auth-context.tsx` delegates the API call to `authService` (defined in F3) rather than calling `apiClient` directly. To avoid a circular dependency at this stage (F2 has no auth module yet), keep the `login` implementation using `apiClient` directly here, but note that **in F3, `AuthProvider.login` must be refactored to call `authService.login`** once that module exists.

The `user` field is typed as `{ email: string } | null`. After a page reload, the token is hydrated from `localStorage` but the email is unknown (the backend JWT is opaque to the frontend). Set `user: null` on reload and accept null-safe access in components. The `isAuthenticated` flag is sufficient for routing guards; the email is only populated after an interactive login in the current session.

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react'
import { getToken, setToken, clearToken } from './token'
import { apiClient } from '../api/client'

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: { email: string } | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = getToken()
    // user is null after reload — isAuthenticated alone guards routing
    return { isAuthenticated: !!token, token, user: null }
  })

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{ token: string }>('/auth/login', {
      email,
      password,
    })
    setToken(data.token)
    setState({ isAuthenticated: true, token: data.token, user: { email } })
  }

  const logout = () => {
    clearToken()
    setState({ isAuthenticated: false, token: null, user: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Narrow type for router context (no methods needed there)
export function useAuthState(): AuthState {
  const { isAuthenticated, token, user } = useAuth()
  return { isAuthenticated, token, user }
}
```

- [ ] **Step 9: Rewrite `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { AuthProvider, useAuthState } from './shared/auth/auth-context'
import type { AuthState } from './shared/auth/auth-context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

const router = createRouter({
  routeTree,
  context: { auth: undefined! as AuthState },
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

function InnerApp() {
  const auth = useAuthState()
  return <RouterProvider router={router} context={{ auth }} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 10: Rewrite `frontend/src/routes/__root.tsx`**

```tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { AuthState } from '../shared/auth/auth-context'

export const Route = createRootRouteWithContext<{ auth: AuthState }>()({
  component: () => <Outlet />,
})
```

- [ ] **Step 11: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: all passing.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add shared api client, token helpers, and auth context"
```

---

### Task F3: Auth Module + Protected Routing

**Branch:** `feat/frontend-f3-auth`

**Depends on:** F2 merged

**Files:**
- Create: `frontend/src/modules/auth/types/index.ts`
- Create: `frontend/src/modules/auth/services/auth.service.ts`
- Create: `frontend/src/modules/auth/services/auth.service.test.ts`
- Create: `frontend/src/modules/auth/components/LoginForm.tsx`
- Create: `frontend/src/routes/login.tsx`
- Modify: `frontend/src/routes/index.tsx`
- Create: `frontend/src/routes/_authenticated/AppShell.tsx` (via `/frontend-design`)
- Create: `frontend/src/routes/_authenticated/AppShell.module.css`
- Create: `frontend/src/routes/_authenticated/route.tsx`
- Create: `frontend/src/routes/_authenticated/dashboard.tsx` (stub)

**Design note:** Invoke `/frontend-design` skill before building `LoginForm.tsx` and `AppShell.tsx`.

- [ ] **Step 1: Create auth types**

`frontend/src/modules/auth/types/index.ts`:

```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}
```

- [ ] **Step 2: Write failing test for auth service**

`frontend/src/modules/auth/services/auth.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './auth.service'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login calls POST /auth/login and returns token', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { token: 'tok-123' } })
    const result = await authService.login('user@test.com', 'pass')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.com',
      password: 'pass',
    })
    expect(result.token).toBe('tok-123')
  })

  it('login throws on invalid credentials', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 401 } })
    await expect(authService.login('bad@test.com', 'wrong')).rejects.toBeTruthy()
  })
})
```

- [ ] **Step 3: Run test — verify FAIL**

```bash
cd frontend && pnpm test src/modules/auth
```

Expected: module not found errors.

- [ ] **Step 4: Create `frontend/src/modules/auth/services/auth.service.ts`**

```typescript
import { apiClient } from '../../../shared/api/client'
import type { LoginRequest, LoginResponse } from '../types'

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    } satisfies LoginRequest)
    return data
  },
}
```

- [ ] **Step 5: Run test — verify PASS**

```bash
cd frontend && pnpm test src/modules/auth
```

Expected: 2 passing.

- [ ] **Step 6: Invoke `/frontend-design` for LoginForm**

Before writing the component, invoke `/frontend-design` in Claude Code with this prompt:
> Design a professional login form for a personal finance app called Soegih. Single email + password fields, submit button, minimal clean aesthetic, CSS modules for styling, no external UI libraries.

- [ ] **Step 7: Create `frontend/src/modules/auth/components/LoginForm.tsx`**

Implement the design from `/frontend-design`. Minimum contract:

```tsx
interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  // form with email + password inputs, submit button
  // shows error message if error is not null
  // disables submit while isLoading
}
```

- [ ] **Step 8: Create `frontend/src/routes/login.tsx`**

```tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../shared/auth/auth-context'
import { LoginForm } from '../modules/auth/components/LoginForm'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      await navigate({ to: '/dashboard' })
    } catch {
      setError('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
}
```

- [ ] **Step 9: Update `frontend/src/routes/index.tsx`**

Replace entire file:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: context.auth.isAuthenticated ? '/dashboard' : '/login',
    })
  },
  // component is required even though beforeLoad always throws
  component: () => null,
})
```

- [ ] **Step 10: Invoke `/frontend-design` for AppShell layout**

Invoke `/frontend-design` with prompt:
> Design a desktop-first app shell for a personal finance app. Left sidebar navigation with items: Dashboard, Wallets, Categories, Transactions, AI Chat. Top bar with app name "Soegih" and logout button. Main content area. CSS modules, no external UI libraries.

- [ ] **Step 11: Create `frontend/src/routes/_authenticated/route.tsx`**

`AppShell` is produced by the `/frontend-design` skill invocation in the previous step and lives at `frontend/src/routes/_authenticated/AppShell.tsx`. It must accept `{ onLogout: () => void; children: ReactNode }` as its minimum prop contract.

```tsx
import { createFileRoute, redirect, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../shared/auth/auth-context'
import { AppShell } from './AppShell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    logout()
    await navigate({ to: '/login' })
  }

  return <AppShell onLogout={handleLogout}><Outlet /></AppShell>
}
```

- [ ] **Step 12: Create dashboard stub `frontend/src/routes/_authenticated/dashboard.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => <div>Dashboard — coming soon</div>,
})
```

- [ ] **Step 13: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: all passing.

- [ ] **Step 14: Smoke-test dev server**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:5173` → should redirect to `/login`. Login page should render. TS errors = fix before committing.

- [ ] **Step 15: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add auth module, login page, and protected _authenticated layout"
```

---

## Chunk 2: Feature Modules

### Task F4: Wallet Module

**Branch:** `feat/frontend-f4-wallet`

**Depends on:** F3 merged

**Files:**
- Create: `frontend/src/modules/wallet/types/index.ts`
- Create: `frontend/src/modules/wallet/services/wallet.service.ts`
- Create: `frontend/src/modules/wallet/services/wallet.service.test.ts`
- Create: `frontend/src/modules/wallet/hooks/use-wallets.ts`
- Create: `frontend/src/modules/wallet/hooks/use-wallet-mutations.ts`
- Create: `frontend/src/modules/wallet/hooks/use-wallet-mutations.test.tsx`
- Create: `frontend/src/modules/wallet/components/WalletList.tsx`
- Create: `frontend/src/modules/wallet/components/WalletForm.tsx`
- Create: `frontend/src/routes/_authenticated/wallets.tsx`

**Design note:** Invoke `/frontend-design` before building `WalletList.tsx` and `WalletForm.tsx`.

- [ ] **Step 1: Create `frontend/src/modules/wallet/types/index.ts`**

```typescript
export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'other'

export interface Wallet {
  id: string
  name: string
  balance: number
  type: WalletType
  created_at: string
  updated_at: string
}

export interface CreateWalletDto {
  name: string
  balance: number
  type: WalletType
}

export interface UpdateWalletDto {
  name?: string
  balance?: number
  type?: WalletType
}
```

- [ ] **Step 2: Write failing tests for wallet service**

`frontend/src/modules/wallet/services/wallet.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { walletService } from './wallet.service'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockWallet = {
  id: 'w1', name: 'BCA', balance: 1000000, type: 'bank' as const,
  created_at: '2026-01-01', updated_at: '2026-01-01',
}

describe('walletService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll calls GET /wallets', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [mockWallet] })
    const result = await walletService.getAll()
    expect(apiClient.get).toHaveBeenCalledWith('/wallets')
    expect(result).toEqual([mockWallet])
  })

  it('create calls POST /wallets', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockWallet })
    await walletService.create({ name: 'BCA', balance: 0, type: 'bank' })
    expect(apiClient.post).toHaveBeenCalledWith('/wallets', expect.objectContaining({ name: 'BCA' }))
  })

  it('update calls PATCH /wallets/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: mockWallet })
    await walletService.update('w1', { name: 'BRI' })
    expect(apiClient.patch).toHaveBeenCalledWith('/wallets/w1', { name: 'BRI' })
  })

  it('remove calls DELETE /wallets/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
    await walletService.remove('w1')
    expect(apiClient.delete).toHaveBeenCalledWith('/wallets/w1')
  })
})
```

- [ ] **Step 3: Run test — verify FAIL**

```bash
cd frontend && pnpm test src/modules/wallet/services
```

- [ ] **Step 4: Create `frontend/src/modules/wallet/services/wallet.service.ts`**

```typescript
import { apiClient } from '../../../shared/api/client'
import type { Wallet, CreateWalletDto, UpdateWalletDto } from '../types'

export const walletService = {
  getAll: async (): Promise<Wallet[]> => {
    const { data } = await apiClient.get<Wallet[]>('/wallets')
    return data
  },
  create: async (dto: CreateWalletDto): Promise<Wallet> => {
    const { data } = await apiClient.post<Wallet>('/wallets', dto)
    return data
  },
  update: async (id: string, dto: UpdateWalletDto): Promise<Wallet> => {
    const { data } = await apiClient.patch<Wallet>(`/wallets/${id}`, dto)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/wallets/${id}`)
  },
}
```

- [ ] **Step 5: Run test — verify PASS**

```bash
cd frontend && pnpm test src/modules/wallet/services
```

- [ ] **Step 6: Create `frontend/src/modules/wallet/hooks/use-wallets.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { walletService } from '../services/wallet.service'

export const walletKeys = {
  all: ['wallets'] as const,
}

export function useWallets() {
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: walletService.getAll,
  })
}
```

- [ ] **Step 7: Write failing test for wallet mutations**

`frontend/src/modules/wallet/hooks/use-wallet-mutations.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateWallet } from './use-wallet-mutations'
import { walletService } from '../services/wallet.service'
import type { ReactNode } from 'react'

vi.mock('../services/wallet.service', () => ({
  walletService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useCreateWallet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls walletService.create and invalidates wallets query', async () => {
    vi.mocked(walletService.create).mockResolvedValue({
      id: 'w1', name: 'Cash', balance: 500, type: 'cash',
      created_at: '', updated_at: '',
    })
    const { result } = renderHook(() => useCreateWallet(), { wrapper })
    result.current.mutate({ name: 'Cash', balance: 500, type: 'cash' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(walletService.create).toHaveBeenCalledWith({ name: 'Cash', balance: 500, type: 'cash' })
  })
})
```

- [ ] **Step 8: Run test — verify FAIL**

```bash
cd frontend && pnpm test src/modules/wallet/hooks
```

- [ ] **Step 9: Create `frontend/src/modules/wallet/hooks/use-wallet-mutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walletService } from '../services/wallet.service'
import { walletKeys } from './use-wallets'
import type { CreateWalletDto, UpdateWalletDto } from '../types'

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWalletDto) => walletService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useUpdateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWalletDto }) =>
      walletService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => walletService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  })
}
```

- [ ] **Step 10: Run tests — verify PASS**

```bash
cd frontend && pnpm test src/modules/wallet
```

- [ ] **Step 11: Invoke `/frontend-design` for WalletList and WalletForm**

Invoke `/frontend-design` with:
> Design a wallet management page for a personal finance app. Desktop: sortable table (columns: Name, Type, Balance, Actions). Mobile: cards. Inline "New Wallet" button opens a modal form with Name (text), Type (select: cash/bank/e_wallet/other), and Initial Balance (number). Edit and Delete actions per row. CSS modules.

- [ ] **Step 12: Build `WalletList.tsx` using TanStack Table (client-side)**

Key pattern — columns definition:
```tsx
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import type { Wallet } from '../types'

const columns: ColumnDef<Wallet>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ getValue }) => `Rp ${getValue<number>().toLocaleString('id-ID')}`,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div>
        <button onClick={() => onEdit(row.original)}>Edit</button>
        <button onClick={() => onDelete(row.original.id)}>Delete</button>
      </div>
    ),
  },
]

// In component:
const table = useReactTable({
  data: wallets,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: { sorting, globalFilter, pagination },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  onPaginationChange: setPagination,
  initialState: { pagination: { pageSize: 10 } },
})
```

- [ ] **Step 13: Build `WalletForm.tsx`**

Use separate callbacks to keep type safety:
```tsx
interface WalletFormProps {
  initial?: Wallet // if provided, it's an edit form
  onCreate: (dto: CreateWalletDto) => Promise<void>
  onUpdate: (dto: UpdateWalletDto) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}
```

- [ ] **Step 14: Create `frontend/src/routes/_authenticated/wallets.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useWallets } from '../../modules/wallet/hooks/use-wallets'
import { useCreateWallet, useUpdateWallet, useDeleteWallet } from '../../modules/wallet/hooks/use-wallet-mutations'
import { WalletList } from '../../modules/wallet/components/WalletList'
import { WalletForm } from '../../modules/wallet/components/WalletForm'
import type { Wallet } from '../../modules/wallet/types'

export const Route = createFileRoute('/_authenticated/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  const { data: wallets = [], isLoading } = useWallets()
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const deleteWallet = useDeleteWallet()
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (isLoading) return <div>Loading wallets...</div>

  return (
    <div>
      <button onClick={() => setIsCreating(true)}>New Wallet</button>
      <WalletList
        wallets={wallets}
        onEdit={setEditingWallet}
        onDelete={(id) => deleteWallet.mutate(id)}
      />
      {(isCreating || editingWallet) && (
        <WalletForm
          initial={editingWallet ?? undefined}
          onCreate={async (dto) => {
            await createWallet.mutateAsync(dto)
            setIsCreating(false)
          }}
          onUpdate={async (dto) => {
            if (editingWallet) {
              await updateWallet.mutateAsync({ id: editingWallet.id, dto })
              setEditingWallet(null)
            }
          }}
          onCancel={() => { setIsCreating(false); setEditingWallet(null) }}
          isLoading={createWallet.isPending || updateWallet.isPending}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 15: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: all passing.

- [ ] **Step 16: Commit**

```bash
git add frontend/src/modules/wallet/ frontend/src/routes/_authenticated/wallets.tsx
git commit -m "feat(frontend): add wallet module with TanStack Table (client-side) and CRUD"
```

---

### Task F5: Category Module

**Branch:** `feat/frontend-f5-category`

**Depends on:** F3 merged (parallel with F4)

**Files:** Mirror wallet module structure under `src/modules/category/`. Same pattern: types, service, hooks, components, route.

**Design note:** Invoke `/frontend-design` before building `CategoryList.tsx` and `CategoryForm.tsx`.

- [ ] **Step 1: Create `frontend/src/modules/category/types/index.ts`**

```typescript
export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  description: string | null
  type: CategoryType
  created_at: string
  updated_at: string
}

export interface CreateCategoryDto {
  name: string
  description?: string
  type: CategoryType
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  type?: CategoryType
}
```

- [ ] **Step 2: Write failing tests for category service**

`frontend/src/modules/category/services/category.service.test.ts` — mirror `wallet.service.test.ts` replacing endpoint `/wallets` with `/categories` and types with category equivalents.

- [ ] **Step 3: Run test — verify FAIL**

```bash
cd frontend && pnpm test src/modules/category/services
```

- [ ] **Step 4: Create `frontend/src/modules/category/services/category.service.ts`**

Same pattern as `wallet.service.ts` with endpoint `/categories`.

- [ ] **Step 5: Run test — verify PASS**

```bash
cd frontend && pnpm test src/modules/category/services
```

- [ ] **Step 6: Create hooks (`use-categories.ts`, `use-category-mutations.ts`)**

Same pattern as wallet hooks with `queryKey: ['categories']`.

- [ ] **Step 7: Write failing tests for category mutations**

`frontend/src/modules/category/hooks/use-category-mutations.test.tsx` — mirror wallet mutation test.

- [ ] **Step 8: Run test — verify FAIL, then PASS after implementing hooks**

- [ ] **Step 9: Invoke `/frontend-design` for CategoryList and CategoryForm**

> Design a category management page for a personal finance app. Categories have Name, Type (expense/income shown as a badge), and optional Description. Desktop table, mobile cards. Modal form for create/edit. CSS modules.

- [ ] **Step 10: Build `CategoryList.tsx`** — TanStack Table client-side, columns: Name, Type (badge), Description, Actions.

- [ ] **Step 11: Build `CategoryForm.tsx`** — fields: name, type (radio or select), description (textarea, optional).

- [ ] **Step 12: Create `frontend/src/routes/_authenticated/categories.tsx`**

Same pattern as `wallets.tsx` using category hooks and components.

- [ ] **Step 13: Run all tests**

```bash
cd frontend && pnpm test
```

- [ ] **Step 14: Commit**

```bash
git add frontend/src/modules/category/ frontend/src/routes/_authenticated/categories.tsx
git commit -m "feat(frontend): add category module with TanStack Table (client-side) and CRUD"
```

---

### Task F6: Transaction Module

**Branch:** `feat/frontend-f6-transaction`

**Depends on:** F4 and F5 merged (needs wallet and category data for the form)

**Files:**
- Create: `frontend/src/modules/transaction/types/index.ts`
- Create: `frontend/src/modules/transaction/services/transaction.service.ts`
- Create: `frontend/src/modules/transaction/services/transaction.service.test.ts`
- Create: `frontend/src/modules/transaction/hooks/use-transactions.ts`
- Create: `frontend/src/modules/transaction/hooks/use-transaction-mutations.ts`
- Create: `frontend/src/modules/transaction/hooks/use-transaction-mutations.test.tsx`
- Create: `frontend/src/modules/transaction/components/TransactionList.tsx`
- Create: `frontend/src/modules/transaction/components/TransactionForm.tsx`
- Create: `frontend/src/routes/_authenticated/transactions.tsx`

**Design note:** Invoke `/frontend-design` before building `TransactionList.tsx` and `TransactionForm.tsx`.

- [ ] **Step 1: Create `frontend/src/modules/transaction/types/index.ts`**

```typescript
import type { PaginatedResponse } from '../../../shared/api/types'

export type TransactionType = 'expense' | 'income' | 'transfer'

export interface TransactionPosting {
  id: string
  wallet_id: string
  amount: number
}

export interface Transaction {
  id: string
  type: TransactionType
  note: string | null
  category_id: string | null
  occurred_at: string
  created_at: string
  postings: TransactionPosting[]
}

export interface CreateTransactionDto {
  type: TransactionType
  note?: string
  category_id?: string
  occurred_at: string
  wallet_id: string
  amount: number
  // For transfer:
  destination_wallet_id?: string
}

export interface UpdateTransactionDto {
  note?: string
  category_id?: string | null
  amount?: number
  wallet_id?: string
}

export interface TransactionQueryParams {
  page: number
  limit: number
  sort_by: 'occurred_at' | 'amount' | 'type'
  sort_order: 'asc' | 'desc'
  search?: string
  month?: string // YYYY-MM
}

export type PaginatedTransactions = PaginatedResponse<Transaction>
```

- [ ] **Step 2: Write failing tests for transaction service**

`frontend/src/modules/transaction/services/transaction.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionService } from './transaction.service'
import { apiClient } from '../../../shared/api/client'
import type { PaginatedTransactions } from '../types'

vi.mock('../../../shared/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockPaginated: PaginatedTransactions = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, total_pages: 0 },
}

describe('transactionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll sends correct query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPaginated })
    await transactionService.getAll({ page: 1, limit: 20, sort_by: 'occurred_at', sort_order: 'desc' })
    expect(apiClient.get).toHaveBeenCalledWith('/transactions', {
      params: { page: 1, limit: 20, sort_by: 'occurred_at', sort_order: 'desc' },
    })
  })

  it('create calls POST /transactions', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
    await transactionService.create({
      type: 'expense', occurred_at: '2026-01-01',
      wallet_id: 'w1', amount: 50000,
    })
    expect(apiClient.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({ type: 'expense' }))
  })
})
```

- [ ] **Step 3: Run test — verify FAIL**

- [ ] **Step 4: Create `frontend/src/modules/transaction/services/transaction.service.ts`**

```typescript
import { apiClient } from '../../../shared/api/client'
import type {
  Transaction, CreateTransactionDto, UpdateTransactionDto,
  TransactionQueryParams, PaginatedTransactions,
} from '../types'

export const transactionService = {
  getAll: async (params: TransactionQueryParams): Promise<PaginatedTransactions> => {
    const { data } = await apiClient.get<PaginatedTransactions>('/transactions', { params })
    return data
  },
  create: async (dto: CreateTransactionDto): Promise<Transaction> => {
    const { data } = await apiClient.post<Transaction>('/transactions', dto)
    return data
  },
  update: async (id: string, dto: UpdateTransactionDto): Promise<Transaction> => {
    const { data } = await apiClient.patch<Transaction>(`/transactions/${id}`, dto)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`)
  },
}
```

- [ ] **Step 5: Run test — verify PASS**

- [ ] **Step 6: Create `frontend/src/modules/transaction/hooks/use-transactions.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { transactionService } from '../services/transaction.service'
import type { TransactionQueryParams } from '../types'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: TransactionQueryParams) => ['transactions', params] as const,
}

export function useTransactions(params: TransactionQueryParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionService.getAll(params),
    placeholderData: (prev) => prev, // keeps old data while fetching next page
  })
}
```

- [ ] **Step 7: Create `frontend/src/modules/transaction/hooks/use-transaction-mutations.ts`**

Same pattern as wallet mutations. Invalidate using `transactionKeys.all` (broad prefix) so all cached pages are cleared on any mutation:

```typescript
onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
```

Do NOT use `transactionKeys.list(params)` here — that would only invalidate one specific page.

- [ ] **Step 8: Invoke `/frontend-design` for TransactionList and TransactionForm**

> Design a transaction list page for a personal finance app. Desktop: server-paginated table with columns: Date, Type (colored badge), Note, Wallet, Category, Amount (colored: red for expense, green for income). Sortable by date/amount/type. Search input. Month filter. Pagination controls. Mobile: card list. Modal form for create/edit with fields: Type (expense/income/transfer), Date, Note, Wallet (select), Amount, Category (select, hidden for transfer). CSS modules.

- [ ] **Step 9: Build `TransactionList.tsx` using TanStack Table (server-side)**

Key pattern:
```tsx
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type SortingState, type PaginationState,
} from '@tanstack/react-table'

// All three manual flags required: pagination, sorting, and filtering are server-side
const table = useReactTable({
  data: transactions?.data ?? [],
  columns,
  pageCount: transactions?.meta.total_pages ?? -1,
  rowCount: transactions?.meta.total,
  state: { sorting, pagination },
  onSortingChange: (updater) => {
    // Sync to parent state → triggers useTransactions refetch
  },
  onPaginationChange: setPagination,
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true, // search/month filter are server params, not client-side
  getCoreRowModel: getCoreRowModel(),
})
```

- [ ] **Step 10: Build `TransactionForm.tsx`**

**Edit mode constraints (per spec and CLAUDE.md):** `type` and `occurred_at` are immutable after creation. When `initial` (an existing transaction) is passed:
- Render `type` as a read-only badge (not a select input)
- Render `occurred_at` as read-only text (not a date picker)
- Only allow editing: `note`, `category_id`, `amount`, `wallet_id`

Create mode: all fields editable. For transfer type, hide category field and show destination wallet selector.

```tsx
interface TransactionFormProps {
  initial?: Transaction // edit mode when present
  wallets: Wallet[]
  categories: Category[]
  onCreate: (dto: CreateTransactionDto) => Promise<void>
  onUpdate: (dto: UpdateTransactionDto) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}
```

- [ ] **Step 11: Create `frontend/src/routes/_authenticated/transactions.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTransactions } from '../../modules/transaction/hooks/use-transactions'
import type { TransactionQueryParams } from '../../modules/transaction/types'
// ... imports

export const Route = createFileRoute('/_authenticated/transactions')({
  component: TransactionsPage,
})

function TransactionsPage() {
  const [params, setParams] = useState<TransactionQueryParams>({
    page: 1,
    limit: 20,
    sort_by: 'occurred_at',
    sort_order: 'desc',
  })
  const { data, isLoading } = useTransactions(params)
  // ...
}
```

- [ ] **Step 12: Run all tests**

```bash
cd frontend && pnpm test
```

- [ ] **Step 13: Commit**

```bash
git add frontend/src/modules/transaction/ frontend/src/routes/_authenticated/transactions.tsx
git commit -m "feat(frontend): add transaction module with server-side paginated TanStack Table"
```

---

### Task F7: Dashboard Module

**Branch:** `feat/frontend-f7-dashboard`

**Depends on:** F3 merged

**Files:**
- Create: `frontend/src/modules/dashboard/types/index.ts`
- Create: `frontend/src/modules/dashboard/services/dashboard.service.ts`
- Create: `frontend/src/modules/dashboard/services/dashboard.service.test.ts`
- Create: `frontend/src/modules/dashboard/hooks/use-dashboard.ts`
- Create: `frontend/src/modules/dashboard/components/DashboardStats.tsx`
- Create: `frontend/src/modules/dashboard/components/ExpenseChart.tsx`
- Modify: `frontend/src/routes/_authenticated/dashboard.tsx`

**Design note:** Invoke `/frontend-design` before building dashboard components.

- [ ] **Step 1: Create `frontend/src/modules/dashboard/types/index.ts`**

```typescript
export interface CategoryBreakdown {
  category_id: string
  category_name: string
  total: number
}

export interface DashboardData {
  month: string              // YYYY-MM
  total_income: number
  total_expense: number
  net_worth: number
  expense_by_category: CategoryBreakdown[]
}
```

- [ ] **Step 2: Write failing tests for dashboard service**

`frontend/src/modules/dashboard/services/dashboard.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from './dashboard.service'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('dashboardService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('get calls GET /dashboard with month param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} })
    await dashboardService.get('2026-03')
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', { params: { month: '2026-03' } })
  })

  it('get calls GET /dashboard without month param when undefined', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} })
    await dashboardService.get()
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', { params: {} })
  })
})
```

- [ ] **Step 3: Run test — verify FAIL**

- [ ] **Step 4: Create `frontend/src/modules/dashboard/services/dashboard.service.ts`**

```typescript
import { apiClient } from '../../../shared/api/client'
import type { DashboardData } from '../types'

export const dashboardService = {
  get: async (month?: string): Promise<DashboardData> => {
    const params = month ? { month } : {}
    const { data } = await apiClient.get<DashboardData>('/dashboard', { params })
    return data
  },
}
```

- [ ] **Step 5: Run test — verify PASS**

- [ ] **Step 6: Create `frontend/src/modules/dashboard/hooks/use-dashboard.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service'

export function useDashboard(month?: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => dashboardService.get(month),
  })
}
```

- [ ] **Step 7: Invoke `/frontend-design` for dashboard**

> Design a personal finance dashboard page. Stats row: Net Worth, Monthly Income (green), Monthly Expense (red). Below: Recharts PieChart showing expense breakdown by category. Month selector (prev/next arrows). CSS modules. Minimal, clean aesthetic.

- [ ] **Step 8: Build `DashboardStats.tsx`**

Props: `{ totalIncome, totalExpense, netWorth }: Pick<DashboardData, 'total_income' | 'total_expense' | 'net_worth'>`

- [ ] **Step 9: Build `ExpenseChart.tsx`**

Uses `recharts` `PieChart`:
```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ExpenseChart({ data }: { data: CategoryBreakdown[] }) {
  const chartData = data.map((d) => ({ name: d.category_name, value: d.total }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%">
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 10: Replace `frontend/src/routes/_authenticated/dashboard.tsx` with full implementation**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useDashboard } from '../../modules/dashboard/hooks/use-dashboard'
import { DashboardStats } from '../../modules/dashboard/components/DashboardStats'
import { ExpenseChart } from '../../modules/dashboard/components/ExpenseChart'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [month, setMonth] = useState<string | undefined>(undefined) // undefined = current month
  const { data, isLoading } = useDashboard(month)

  if (isLoading) return <div>Loading dashboard...</div>
  if (!data) return null

  return (
    <div>
      <DashboardStats
        totalIncome={data.total_income}
        totalExpense={data.total_expense}
        netWorth={data.net_worth}
      />
      <ExpenseChart data={data.expense_by_category} />
    </div>
  )
}
```

- [ ] **Step 11: Run all tests**

```bash
cd frontend && pnpm test
```

- [ ] **Step 12: Commit**

```bash
git add frontend/src/modules/dashboard/ frontend/src/routes/_authenticated/dashboard.tsx
git commit -m "feat(frontend): add dashboard module with stats and expense chart"
```

---

### Task F8: AI Chat Module

**Branch:** `feat/frontend-f8-ai-chat`

**Depends on:** F3 merged

**Files:**
- Create: `frontend/src/modules/ai/types/index.ts`
- Create: `frontend/src/modules/ai/services/ai.service.ts`
- Create: `frontend/src/modules/ai/services/ai.service.test.ts`
- Create: `frontend/src/modules/ai/hooks/use-ai-chat.ts`
- Create: `frontend/src/modules/ai/components/ChatMessages.tsx`
- Create: `frontend/src/modules/ai/components/ChatInput.tsx`
- Create: `frontend/src/modules/ai/components/TransactionConfirmCard.tsx`
- Create: `frontend/src/routes/_authenticated/ai.tsx`

**Design note:** Invoke `/frontend-design` before building AI chat components.

- [ ] **Step 1: Create `frontend/src/modules/ai/types/index.ts`**

```typescript
export interface AiChatRequest {
  message: string
}

export interface ParsedTransaction {
  type: 'expense' | 'income' | 'transfer'
  note: string
  amount: number
  wallet_name: string
  category_name?: string
  occurred_at: string
}

export interface AiChatResponse {
  message: string
  parsed_transaction: ParsedTransaction | null
}

export interface AiConfirmRequest {
  parsed_transaction: ParsedTransaction
}

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  parsed_transaction?: ParsedTransaction | null
}
```

- [ ] **Step 2: Write failing tests for AI service**

`frontend/src/modules/ai/services/ai.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from './ai.service'
import { apiClient } from '../../../shared/api/client'

vi.mock('../../../shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('aiService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chat calls POST /ai/chat', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: 'Got it!', parsed_transaction: null },
    })
    const result = await aiService.chat('spent 50k on food')
    expect(apiClient.post).toHaveBeenCalledWith('/ai/chat', { message: 'spent 50k on food' })
    expect(result.message).toBe('Got it!')
  })

  it('confirm calls POST /ai/chat/confirm', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
    const parsed = {
      type: 'expense' as const, note: 'food', amount: 50000,
      wallet_name: 'Cash', occurred_at: '2026-01-01',
    }
    await aiService.confirm(parsed)
    expect(apiClient.post).toHaveBeenCalledWith('/ai/chat/confirm', { parsed_transaction: parsed })
  })
})
```

- [ ] **Step 3: Run test — verify FAIL**

- [ ] **Step 4: Create `frontend/src/modules/ai/services/ai.service.ts`**

```typescript
import { apiClient } from '../../../shared/api/client'
import type { AiChatResponse, ParsedTransaction } from '../types'

export const aiService = {
  chat: async (message: string): Promise<AiChatResponse> => {
    const { data } = await apiClient.post<AiChatResponse>('/ai/chat', { message })
    return data
  },
  confirm: async (parsed_transaction: ParsedTransaction): Promise<void> => {
    await apiClient.post('/ai/chat/confirm', { parsed_transaction })
  },
}
```

- [ ] **Step 5: Run test — verify PASS**

- [ ] **Step 6: Create `frontend/src/modules/ai/hooks/use-ai-chat.ts`**

```typescript
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { aiService } from '../services/ai.service'
import type { ChatMessage, ParsedTransaction } from '../types'
import { transactionKeys } from '../../transaction/hooks/use-transactions'

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null)
  const qc = useQueryClient()

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await aiService.chat(content)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        parsed_transaction: response.parsed_transaction,
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (response.parsed_transaction) {
        setPendingTransaction(response.parsed_transaction)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const confirmTransaction = useCallback(async () => {
    if (!pendingTransaction) return
    await aiService.confirm(pendingTransaction)
    setPendingTransaction(null)
    // Invalidate transactions cache so list refreshes
    qc.invalidateQueries({ queryKey: ['transactions'] })
  }, [pendingTransaction, qc])

  const dismissTransaction = useCallback(() => setPendingTransaction(null), [])

  return { messages, isLoading, pendingTransaction, sendMessage, confirmTransaction, dismissTransaction }
}
```

- [ ] **Step 7: Invoke `/frontend-design` for AI chat components**

> Design an AI chat interface for a personal finance app. Scrollable message list with user messages right-aligned and assistant messages left-aligned. When assistant returns a parsed transaction, show a confirmation card with transaction details (type, amount, wallet, category, date, note) and Confirm / Dismiss buttons. Input bar at bottom with textarea and Send button. CSS modules.

- [ ] **Step 8: Build `ChatMessages.tsx`**

Props: `{ messages: ChatMessage[] }`. Renders each message with role-based styling.

- [ ] **Step 9: Build `TransactionConfirmCard.tsx`**

Props: `{ transaction: ParsedTransaction; onConfirm: () => void; onDismiss: () => void }`. Displays all transaction fields, two action buttons.

- [ ] **Step 10: Build `ChatInput.tsx`**

Props: `{ onSend: (message: string) => void; isLoading: boolean }`. Textarea + Send button, clears on send, Enter to send (Shift+Enter for newline).

- [ ] **Step 11: Create `frontend/src/routes/_authenticated/ai.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useAiChat } from '../../modules/ai/hooks/use-ai-chat'
import { ChatMessages } from '../../modules/ai/components/ChatMessages'
import { ChatInput } from '../../modules/ai/components/ChatInput'
import { TransactionConfirmCard } from '../../modules/ai/components/TransactionConfirmCard'

export const Route = createFileRoute('/_authenticated/ai')({
  component: AiPage,
})

function AiPage() {
  const { messages, isLoading, pendingTransaction, sendMessage, confirmTransaction, dismissTransaction } = useAiChat()

  return (
    <div>
      <ChatMessages messages={messages} />
      {pendingTransaction && (
        <TransactionConfirmCard
          transaction={pendingTransaction}
          onConfirm={confirmTransaction}
          onDismiss={dismissTransaction}
        />
      )}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
```

- [ ] **Step 12: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: all passing.

- [ ] **Step 13: Commit**

```bash
git add frontend/src/modules/ai/ frontend/src/routes/_authenticated/ai.tsx
git commit -m "feat(frontend): add AI chat module with transaction confirmation flow"
```

---

## Execution Order

Tasks F4, F5, F7, F8 can all run in parallel after F3 merges. Task F6 requires F4 and F5 to be merged first (needs wallet and category data in the transaction form).

```
F1 (scaffold)
└── F2 (shared infra)
    └── F3 (auth + routing)
        ├── F4 (wallets)  ─────────────────┐
        ├── F5 (categories) ───────────────┤
        ├── F7 (dashboard)                 ├── F6 (transactions, needs F4+F5)
        └── F8 (ai chat)
```

Each task's branch should be pushed as a PR and merged before dependent tasks begin. F4, F5, F7, F8 can be dispatched to subagents simultaneously.
