# Flowxiq — API Contracts

## Conventions

### Base URL
- Legacy: `/api/*`
- Current: `/api/v1/*`

### Authentication
All v1 routes require a valid JWT in the `session` httpOnly cookie.
Exceptions: auth routes (`/api/v1/auth/*`).

### Standard Response Shape
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 87, "hasMore": true } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "name": "Required" } } }
```

### Pagination Query Params
`?page=1&limit=20&sort=createdAt&dir=desc`

---

## Auth Routes

### `POST /api/auth/login`
Authenticate with email + password.
```json
// Request
{ "email": "owner@example.com", "password": "secure_password", "companyId": "company_id" }

// Success (200)
{ "success": true, "data": { "user": { "id": "...", "name": "...", "role": "...", "companyId": "...", "companyName": "..." } } }

// Errors
401 UNAUTHORIZED     — Invalid credentials
403 FORBIDDEN        — Company suspended
404 NOT_FOUND        — User not found
429 RATE_LIMITED     — Too many attempts
```

### `POST /api/auth/logout`
```json
// Response (200)
{ "success": true, "data": { "message": "Logged out." } }
```

### `GET /api/auth/me`
Returns current session info.
```json
// Success (200)
{ "success": true, "data": { "id": "...", "name": "...", "role": "...", "companyId": "...", "companyName": "...", "logoUrl": "..." } }
```

### `POST /api/auth/forgot-password`
```json
// Request
{ "email": "user@example.com" }

// Response (always 200 — prevents enumeration)
{ "success": true, "data": { "message": "If this email exists, a reset code was sent." } }
```

### `POST /api/auth/reset-password`
```json
// Request
{ "email": "user@example.com", "code": "483920", "newPassword": "new_secure_password" }

// Success (200)
{ "success": true, "data": { "message": "Password updated." } }

// Errors
400 VALIDATION_ERROR — Code expired or invalid
```

---

## Subscription Routes

### `GET /api/v1/subscription`
**Auth**: Required. **Permission**: `billing:view`
```json
// Success (200)
{
  "success": true,
  "data": {
    "plan": "trial",
    "status": "active",
    "trialEndsAt": "2026-08-01T00:00:00Z",
    "features": ["export_csv", "export_pdf"],
    "limits": { "maxWorkers": 1, "maxStorageGb": 1 },
    "usage": { "workers": 0 }
  }
}
```

### `POST /api/v1/subscription`
**Auth**: Required. **Permission**: `billing:view`
```json
// Request — upgrade request
{ "action": "request_upgrade", "targetPlan": "professional" }

// Success (200)
{ "success": true, "data": { "message": "Upgrade request submitted. Our team will reach out within 1 business day." } }

// Errors
422 VALIDATION_ERROR — Invalid targetPlan
```

---

## Integration Routes

### `GET /api/v1/integrations`
**Auth**: Required. **Permission**: `integrations:view`
```json
// Success (200)
{
  "success": true,
  "data": {
    "connected": [
      {
        "id": "...",
        "provider": "square",
        "display_name": "Square POS",
        "status": "connected",
        "last_synced_at": "2026-07-01T10:00:00Z",
        "connectorMeta": { "displayName": "Square", "logoUrl": "/integrations/square-logo.svg" }
      }
    ],
    "available": [
      {
        "provider": "shopify",
        "displayName": "Shopify",
        "logoUrl": "/integrations/shopify-logo.svg",
        "configFields": [{ "key": "shopDomain", "label": "Shop Domain", "type": "url", "required": true }]
      }
    ]
  }
}
```

### `POST /api/v1/integrations`
**Auth**: Required. **Permission**: `integrations:manage`. **Plan**: `integrations` feature required.
```json
// Request
{ "provider": "square", "displayName": "My Square Store", "credentials": { "accessToken": "...", "locationId": "...", "environment": "production" } }

// Success (201)
{ "success": true, "data": { "id": "...", "message": "Integration added." } }

// Errors
402 PLAN_LIMIT       — Plan doesn't include integrations
422 VALIDATION_ERROR — Missing provider or credentials
```

### `DELETE /api/v1/integrations?id=xxx`
**Auth**: Required. **Permission**: `integrations:manage`
```json
// Success (200)
{ "success": true, "data": { "message": "Integration removed." } }

// Errors
404 NOT_FOUND — Integration not found or belongs to another tenant
```

### `POST /api/v1/integrations/[id]/test`
**Auth**: Required. **Permission**: `integrations:manage`
```json
// Success (200)
{ "success": true, "data": { "success": true, "status": "connected", "message": "Connected to My Square Store successfully" } }

// Failure (200 — connection failure is not an HTTP error)
{ "success": true, "data": { "success": false, "status": "error", "message": "Invalid access token." } }
```

---

## Audit Log Routes

### `GET /api/v1/audit-log`
**Auth**: Required. **Permission**: `audit:view`
**Query params**: `page`, `limit`, `action`, `entity`, `actor`, `companyId` (super_admin only)
```json
// Success (200)
{
  "success": true,
  "data": [
    {
      "id": "...",
      "company_id": "...",
      "actor_name": "Jane Smith",
      "actor_role": "owner",
      "action": "order.created",
      "entity_type": "order",
      "entity_id": "...",
      "meta": "{\"orderName\":\"Spring 2026\"}",
      "created_at": "2026-07-04T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 143, "hasMore": true }
}
```

---

## Export Routes

### `GET /api/export?orderId=xxx`
**Auth**: Required. **Permission**: `orders:export`
```
// Success (200) — file download
Content-Type: text/csv
Content-Disposition: attachment; filename="SQUARE_Spring_2026_2026-07-04.csv"
[CSV content]

// Errors
400 VALIDATION_ERROR — No orderId or no exportable items
404 NOT_FOUND        — Order not found
```

---

## Error Code Reference

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session cookie |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found in tenant scope |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `PLAN_LIMIT` | 402 | Feature requires plan upgrade |
| `RATE_LIMITED` | 429 | Too many requests |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
