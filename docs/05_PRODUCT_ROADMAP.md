# Flowxiq — Product Roadmap

## V1 — Core Purchasing Platform (Current)

**Goal**: A working, production-ready purchasing workflow for retail businesses.

### ✅ Completed
- Multi-tenant company system
- Worker Portal (field-fast): order creation, item entry, photo capture, submit
- Manager Portal (owner): order review, item flagging/approval, team management
- HQ Portal (super-admin): platform management, tenant CRUD, access requests
- Email/PIN authentication with RBAC
- Notification system (in-app)
- Vendor registry
- Access request → approval → onboarding pipeline
- Marketing website

### 🔨 In Progress (V1 Completion)
- **Foundation libraries**: platform config, RBAC, feature flags, notifications, logger, API standards
- **Database migration framework**: 9 migrations, migration runner, seeds
- **Subscription system**: plan_configs table, capability-based gating, manual upgrade flow
- **Audit log**: system-wide activity trail, `audit_log` table, viewer in portal
- **Email delivery**: Resend integration, password reset, welcome emails
- **Integration framework**: connector interface, Square/Shopify/Clover/Lightspeed skeletons
- **Documentation**: all 9 docs completed

### 📋 V1 Backlog
- Subscription section in owner portal (plan status, usage meters, upgrade CTA)
- Integrations section in owner portal (connect/disconnect POS)
- Activity log viewer in owner portal
- Shared UI component library (Button, Card, Table, Modal, Badge, etc.)
- Manager role enforcement (currently treated same as worker in some paths)
- API v1 routes (versioned, paginated, filterable)

---

## V2 — Growth Features

**Goal**: Scalable, monetizable, integrated platform.

### Billing & Payments
- Stripe integration (recurring subscriptions, invoices, payment methods)
- Automatic plan enforcement on payment failure
- Proration on plan changes
- Invoice history in portal

### POS Live Sync
- Square: live catalog push via Catalog API
- Shopify: product create/update via Admin API
- Clover: inventory push via REST API
- Lightspeed: product sync via OAuth API
- Sync scheduling (daily auto-sync)
- Sync error handling and retry logic

### Multi-Location Support
- Workspace ≠ Business (separate entity)
- Multiple locations per business
- Location-specific vendor catalogs
- Cross-location analytics

### Advanced Analytics
- Sales by vendor, category, worker
- Order trend analysis
- Top-performing items
- Worker performance dashboard
- CSV/PDF report export

### Customer Portal
- Self-service billing management
- Plan upgrade/downgrade UI
- Invoice downloads
- Team and settings management

---

## V3 — Intelligence Features

**Goal**: AI-powered purchasing insights and automation.

### AI Features
- Product code recognition (point camera → auto-fill code/category)
- Price suggestion based on historical data
- Vendor performance scoring
- Anomaly detection (unusual prices, duplicate items)
- Smart order naming

### OCR
- Photo → product details extraction
- Vendor catalog scanning
- Business card scanning (add vendor contact)

### Voice Input
- Voice-to-text for item notes
- Voice commands in worker portal

### Mobile Apps
- iOS and Android native apps (React Native)
- Offline-first with background sync
- Push notifications
- Camera integration

---

## V4 — Enterprise Platform

**Goal**: Full enterprise purchasing lifecycle management.

### ERP Integrations
- NetSuite
- QuickBooks
- SAP (lite connector)

### Warehouse Management
- Receive orders into warehouse
- Inventory tracking
- Barcode/QR scanning

### Advanced Analytics
- Predictive inventory
- Vendor risk scoring
- Budget management
- Purchase order approvals workflow

### Enterprise Features
- SSO (SAML, OIDC)
- Custom roles and permission sets
- Dedicated onboarding
- SLA-based support
- White-label option
- Custom integrations via webhook API
