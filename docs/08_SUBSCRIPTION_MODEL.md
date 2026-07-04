# Flowxiq — Subscription Model

## Design Principles

1. **Capability-based, not usage-limited**: Plans grant capabilities, not quotas. No limits on orders or items.
2. **DB-configurable**: All plan details live in the `plan_configs` table. Changing a plan requires no code deployment.
3. **Worker-count-based limits**: The only capacity limit is the number of workers (`role = 'worker'` only). Managers and owners do not count against this limit.
4. **Graceful blocking**: When a limit is reached, show a clear upgrade prompt. Never silently fail or degrade quality.

## Plan Tiers

| | Free Trial | Professional | Business | Enterprise |
|---|---|---|---|---|
| **Duration** | 30 days | Monthly / Annual | Monthly / Annual | Annual |
| **Price** | Free | $23.99/mo | $79.99/mo | Custom |
| **Max Workers** | 1 | 10 | 50 | Unlimited |
| **Max Storage** | 1 GB | 10 GB | 50 GB | Custom |
| **Orders** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Items per Order** | Unlimited | Unlimited | Unlimited | Unlimited |
| **CSV Export** | ✅ | ✅ | ✅ | ✅ |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ |
| **Analytics** | ❌ | ✅ | ✅ | ✅ |
| **Reports** | ❌ | ✅ | ✅ | ✅ |
| **Standard Integrations** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **AI Features** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Integrations** | ❌ | ❌ | ✅ | ✅ |
| **SSO** | ❌ | ❌ | ❌ | ✅ |
| **Custom Branding** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |
| **Dedicated Onboarding** | ❌ | ❌ | ❌ | ✅ |
| **Audit Log** | ❌ | ✅ | ✅ | ✅ |
| **Multi-Location** | ❌ | ❌ | ❌ | ✅ |

## How Plans Are Enforced

### 1. Feature Access
```
Request → checkFeatureAccess(db, companyId, 'integrations')
        → read subscriptions table → get plan_key
        → read plan_configs where plan_key = ? → parse features JSON
        → return { allowed: boolean, reason?: string }
```

### 2. Worker Count Limit
```
Add worker request → checkWorkerLimit(db, companyId)
  → get plan_key → get max_workers from plan_configs
  → SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'worker' AND deleted_at IS NULL
  → if count >= max_workers: return { allowed: false }
  → else: allow insert
```

### 3. Subscription Status
Companies with `status = 'suspended'` or `'cancelled'` are blocked from all gated actions.
Trial companies with `trial_ends_at` in the past are treated as suspended.

## Upgrade Flow (V1 — Manual)

1. User clicks "Upgrade" in portal (Settings → Subscription tab)
2. Selects desired plan
3. POST `/api/v1/subscription` with `{ action: 'request_upgrade', targetPlan: 'professional' }`
4. Server records `upgrade_requested_at` + `upgrade_target_plan` on subscription record
5. Server sends email to `support@flowxiq.com` with company details and requested plan
6. Flowxiq team contacts customer within 1 business day
7. HQ admin manually updates `subscriptions.plan` via super-admin portal
8. Next login, user gets new plan features (JWT refreshed on next login)

## Upgrade Flow (V2 — Stripe)

1. User clicks "Upgrade" → Stripe Checkout opens
2. Payment success → Stripe webhook → update `subscriptions` table
3. Immediate access to new plan features

## Trial Lifecycle

```
Company created
  → Insert subscription: plan='trial', status='active', trial_ends_at = NOW + 30 days

Day 23 (7 days before): trial_ending notification email sent to owner
Day 30: trial_ends_at passes
  → Next API request to a gated feature: blocked with upgrade prompt
  → Subscription NOT auto-suspended — company retains basic access
  → Features that require paid plan become unavailable

After upgrade: subscription updated, all features unlock immediately
```

## Super-Admin Plan Management

HQ can:
1. Manually upgrade any company's plan
2. Set `trial_ends_at` to extend trial
3. Add company-scoped feature flag overrides (e.g., grant `ai_suggestions` to a trial user for a demo)
4. Suspend or cancel a subscription

## Configuring Plans Without Code Changes

To change what Professional plan includes:
```sql
UPDATE plan_configs
SET features = '["export_csv","export_pdf","analytics","reports","integrations","audit_log","new_feature"]',
    updated_at = datetime('now')
WHERE plan_key = 'professional';
```

No deployment needed. Takes effect on next plan check.
