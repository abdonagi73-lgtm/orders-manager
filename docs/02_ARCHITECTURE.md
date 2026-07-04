# Flowxiq — Platform Architecture

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes, edge-ready |
| Database | Turso (LibSQL / SQLite) | Globally distributed, serverless-friendly, low cost |
| ORM | Drizzle ORM | Lightweight, type-safe, schema-first |
| Auth | JWT (jose) + bcryptjs | Stateless, edge-compatible, no external auth service needed |
| Email | Resend | Modern API, simple setup, great free tier |
| Hosting | Vercel | Zero-config Next.js, edge functions, preview deployments |
| Styling | Vanilla CSS + CSS variables | Full control, no build-time dependencies |

## System Architecture

```
Browser
  │
  ├── Public Website (/)          → marketing pages, access request form
  ├── Worker Portal (/field-fast) → PIN auth, mobile-first ordering UI
  ├── Owner Portal (/owner)       → PIN auth, management dashboard
  ├── App Selector (/app)         → company picker → role detection → redirect
  └── HQ Portal (/super-admin)    → PIN auth, internal platform management

All portals → Next.js App Router → API Routes → Drizzle ORM → Turso DB
                                             ↘ Resend (email)
```

## Authentication Flow

```
User visits /app
  ↓
Selects company workspace
  ↓
Enters email + password (owner/manager) OR PIN (worker)
  ↓
POST /api/auth/login or POST /api/session
  ↓
Server: lookup user → verify bcrypt hash → check company status
  ↓
Issue JWT → set httpOnly cookie 'session' (24h TTL)
  ↓
Read role from JWT
  ↓
Redirect:
  worker      → /field-fast
  manager     → /owner
  owner       → /owner
  super_admin → /super-admin
```

**Critical rule**: Never ask the user to select their role. The system detects it from the session.

## Multi-Tenancy Isolation

- Every database table that stores business data has a `company_id` foreign key
- The middleware injects `x-company-id` from the session into every API request header
- All DB queries filter by `company_id` — never return cross-tenant data
- Super-admin routes explicitly bypass this for platform management

## API Design

### Versioning
- All new routes live under `/api/v1/`
- Legacy routes (`/api/orders`, `/api/items`, etc.) are maintained for backward compatibility
- Deprecated routes return an `X-Deprecated: true` response header

### Standard Response Shape
```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 87, "hasMore": true } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "name": "Required" } } }
```

### Error Codes
| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Valid session, insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist in tenant's scope |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `PLAN_LIMIT` | 402 | Feature not available on current plan |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Every API Handler Follows This Pattern
1. Read session → `unauthorized()` if missing
2. Permission check → `forbidden()` if denied
3. Feature flag check → `planLimitErr()` if denied
4. Validate request body → `validationErr()` if invalid
5. Execute business logic
6. Fire `logAudit()` on mutations (fire-and-forget)
7. Return `ok(data)` or `err(code, message)`

## Permission Model

Permissions are granular actions (`orders:create`, `team:add`, etc.). Roles are named collections of permissions. No code checks `session.role === 'something'` directly — always use `hasPermission(session, Permissions.XYZ)`.

See `src/lib/rbac/permissions.ts` for the full permission registry.

## Feature Flag System

Feature availability is resolved in this order:
1. Company-specific override (`feature_flags` table, scope = 'company')
2. Plan-granted features (`plan_configs.features` JSON array)
3. Global default (`GLOBAL_DEFAULTS` in `src/lib/features/index.ts`)

This means super-admin can grant any feature to any tenant regardless of plan, by inserting a company-scoped override.

## Database Connection

```typescript
// src/db/db.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { Platform } from '@/config';

const client = createClient({ url: Platform.db.url, authToken: Platform.db.authToken });
export const db = drizzle(client);
```

All API routes import `{ db }` from `@/db/db`. Never create a new client in a route handler.

## Integration Architecture

All POS integrations use a common connector interface (`IntegrationConnector`). Each connector translates between Flowxiq's canonical internal data model and the target POS API format.

```
Flowxiq Data → CanonicalProduct model → ConnectorRegistry.getConnector(provider) → POS API
```

Adding a new integration = implement `IntegrationConnector` + register in `src/lib/integrations/registry.ts`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | ✅ | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | ✅ | Turso authentication token |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `RESEND_API_KEY` | ✅ | Resend email API key |
| `PLATFORM_ENCRYPTION_KEY` | ✅ | 64-char hex key for AES-256-GCM encryption |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (e.g. https://flowxiq.com) |
