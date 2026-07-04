# Flowxiq — Authentication Flows

## Session Format

JWT signed with HS256. Payload:
```typescript
{
  id:             string;  // user.id
  name:           string;  // user.name
  role:           string;  // worker | manager | owner | admin | super_admin
  companyId:      string;  // companies.id
  companyName:    string;  // companies.name
  currency:       string;  // companies.currency
  commissionRate: number;  // companies.commission_rate
  plan?:          string;  // current subscription plan
  permissions?:   string[]; // derived from role
  features?:      string[]; // from plan_configs.features
  iat:            number;   // issued at
  exp:            number;   // expiry (24h standard, 7d for activation)
}
```

**Storage**: httpOnly cookie named `session`, `sameSite: lax`, `secure` in production.

## Flow 1 — Standard Login (Email + Password)

Used by: manager, owner, super_admin

```
1. User visits /app
2. Selects company workspace from list
3. Enters email + password
4. POST /api/auth/login
   a. Look up user by email in selected company
   b. Verify bcrypt hash of password vs pin_hash
   c. Check company.status = 'active'
   d. Check is_activated — if false, redirect to /activate
   e. Issue JWT (24h), set cookie
   f. Log 'auth.login_success' to audit_log
5. Read role from JWT
6. Redirect:
   worker      → /field-fast
   manager     → /owner
   owner       → /owner
   admin       → /owner
   super_admin → /super-admin
```

**Rate limit**: 10 attempts per minute per IP. After limit: return `429 RATE_LIMITED`.

## Flow 2 — PIN Login (Worker Portal)

Used by: worker (and owner using the worker-style PIN entry)

```
1. User visits /field-fast or /owner
2. Selects company from dropdown
3. Enters 4+ digit PIN
4. POST /api/session { action: 'verify-worker' or 'verify-owner' }
   a. Look up user by company_id + role
   b. bcrypt.compare PIN against all users (TODO: optimize to indexed lookup)
   c. Issue JWT, set cookie
5. Portal loads with session context
```

## Flow 3 — First-Time Activation

Used by: new business owners receiving a temp passcode from HQ

```
1. HQ creates company + owner user with temp passcode
2. HQ sends owner the /activate URL
3. Owner visits /activate
4. Enters temp passcode (their current pin_hash)
5. POST /api/auth/activate
   a. Verify temp passcode
   b. Validate new password (min 8 chars)
   c. bcrypt hash new password
   d. Update pin_hash, set is_activated = true
   e. Issue 7-day JWT, set cookie
6. Redirect to /owner
```

## Flow 4 — Forgot Password

Used by: manager, owner (anyone with an email)

```
1. User clicks "Forgot password" on /app
2. Enters email address
3. POST /api/auth/forgot-password
   a. Rate limit: 3 requests per hour per IP
   b. Look up user by email (silently ignore if not found)
   c. Generate 6-digit code, store in memory with 15-minute TTL
   d. Send email via Resend using auth.password_reset template
   e. Always return { ok: true } (prevent email enumeration)
4. User receives email, enters 6-digit code
5. POST /api/auth/reset-password
   a. Verify code matches + not expired
   b. Validate new password (min 8 chars)
   c. bcrypt hash, update pin_hash
   d. Delete reset code
   e. Log 'auth.password_reset' to audit_log
6. Redirect to login
```

**Rate limit**: 3 reset requests per hour per IP.
**Note**: Reset codes are currently in-memory. They reset on server restart. Upgrade to Redis/DB in V2.

## Flow 5 — Logout

```
POST /api/auth/logout
  → Delete 'session' cookie
  → Redirect to /app
```

## Role Detection → Redirect Table

| Role | Redirect After Login |
|---|---|
| `worker` | `/field-fast` |
| `manager` | `/owner` |
| `owner` | `/owner` |
| `admin` | `/owner` |
| `super_admin` | `/super-admin` |

**Critical rule**: The system detects and redirects automatically. Never show a "Select your role" screen.

## Middleware Enforcement Map

| Route Pattern | Auth Required | Permission Required |
|---|---|---|
| `/` | No | — |
| `/app` | No | — |
| `/field-fast*` | No (internal PIN) | — |
| `/owner*` | No (internal PIN) | — |
| `/activate` | No | — |
| `/signup*` | No | — |
| `/onboard*` | No | — |
| `/request-access*` | No | — |
| `/super-admin` | Yes | `platform:admin` |
| `/flowriq-console*` | Yes | `platform:admin` |
| `/api/auth/*` | No | — |
| `/api/v1/*` | Yes (via session cookie) | Route-specific |
| `/api/access-requests` GET | Yes | `platform:admin` |
| `/api/access-requests/[id]` PATCH | Yes | `platform:admin` |

## Session Header Propagation

Middleware injects these headers on every authenticated API request:
- `x-user-id` — session.id
- `x-user-role` — session.role
- `x-company-id` — session.companyId
- `x-request-id` — UUID (generated per request for audit correlation)

## Future: Trusted Devices (V2)

Schema is ready (`trusted_devices` table). When implemented:
- On login, check device fingerprint against trusted_devices
- If trusted + not expired: skip 2FA prompt
- UI in account settings to view and revoke trusted devices

## Future: 2FA (V3)

Architecture is designed to accommodate TOTP/SMS 2FA.
The login flow will insert a 2FA challenge step between credential verification and JWT issuance.
