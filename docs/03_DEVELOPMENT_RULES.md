# Flowxiq — Development Rules

These rules apply to every code change in this repository. Read them before implementing any feature.

## Rule 1: Docs First
Before implementing a feature, read the relevant documentation. Code must reflect the docs. If the docs are wrong or missing, update the docs first.

## Rule 2: No Role String Comparisons
Never write `session.role === 'owner'` or `if (role !== 'super_admin')`.
Always use: `hasPermission(session, Permissions.XYZ)`

## Rule 3: Standard API Responses Only
Every API route must use the helpers from `src/lib/api/response.ts`.
Never write `NextResponse.json({ error: '...' })` directly.
```typescript
// ✅ Correct
return forbidden();
return ok(data);
return validationErr({ name: 'Name is required' });

// ❌ Wrong
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

## Rule 4: Audit Every Mutation
Every API route that creates, updates, or deletes data must fire an audit log event.
Use `void logAudit(db, event)` — fire-and-forget, never await.
```typescript
void logAudit(db, {
  companyId: session.companyId,
  actorId:   session.id,
  actorName: session.name,
  actorRole: session.role,
  action:    'order.created',
  entityType:'order',
  entityId:  order.id,
  meta:      { orderName: order.name },
});
```

## Rule 5: Multi-Tenant Isolation
Every DB query on tenant data must filter by `company_id`.
```typescript
// ✅ Correct
await db.select().from(orders).where(
  and(eq(orders.company_id, session.companyId), eq(orders.id, orderId))
);

// ❌ Wrong — exposes cross-tenant data
await db.select().from(orders).where(eq(orders.id, orderId));
```

## Rule 6: Feature Gates Before Business Logic
Before executing any plan-gated logic, check the feature flag.
```typescript
const access = await checkFeatureAccess(db, session.companyId, 'integrations');
if (!access.allowed) return planLimitErr('integrations');
```

## Rule 7: Soft Delete
Never hard-delete rows from: `orders`, `order_items`, `users`, `vendors`.
Set `deleted_at = NOW()`. All queries must filter `WHERE deleted_at IS NULL`.

## Rule 8: No Business Logic in Page Components
Page files (`page.tsx`) contain only UI rendering code.
Business logic, data fetching, and transformations go in `src/lib/`.

## Rule 9: Reusable Components Only
If you write UI code that could be used in more than one place, it must be a component in `src/components/`.
Never copy-paste JSX blocks between pages.

## Rule 10: Environment Variables Through Platform Config
Never access `process.env` outside of `src/config/platform.ts`.
```typescript
// ✅ Correct
import { Platform } from '@/config';
const secret = Platform.auth.secret;

// ❌ Wrong
const secret = process.env.JWT_SECRET;
```

## Rule 11: Use Business Terminology
The UI must never expose technical terms to users.
| ❌ Technical | ✅ Business |
|---|---|
| "500 Internal Server Error" | "Something went wrong. Try again." |
| "cascade delete" | "This will remove all associated items" |
| "JWT expired" | "Your session has expired. Please sign in again." |
| "UUID" | never shown |
| "bcrypt hash" | never shown |

## Rule 12: Mobile-First Worker Portal
Any change to `/field-fast` must be tested at 375px width first.
No hover-only interactions. All touch targets minimum 44×44px.

## Rule 13: No Hardcoded Customer Data
No company names, employee names, IDs, or any customer-specific values in the codebase.
All defaults must be generic placeholders.

## Rule 14: TypeScript Strictness
- No `any` types without a comment explaining why
- No `// @ts-ignore` without a comment
- All async functions must have explicit return types
- All exported functions must have JSDoc comments

## File Organization Rules

```
src/
  config/        Platform-level configuration only
  lib/           Pure functions and business logic (no React, no Next.js imports)
    api/         API helpers (response, validate, paginate, rateLimit)
    rbac/        Permission definitions and checkers
    features/    Feature flag system
    notifications/ Notification dispatch + templates
    integrations/ POS connector framework
    subscription/ Plan gate logic
    logger/      Structured logging
    audit.ts     Audit log writer
    auth.ts      JWT session encrypt/decrypt
  db/
    schema.ts    Single schema file — source of truth for DB structure
    db.ts        Single DB client export
    migrations/  Numbered migration files
    seeds/       Seed data scripts
  components/    Shared UI components (reusable only)
  app/
    api/         Legacy API routes (maintained for compatibility)
    api/v1/      All new API routes (versioned)
    (marketing)/ Public marketing pages
    owner/       Manager/owner portal
    field-fast/  Worker portal
    super-admin/ HQ portal
```
