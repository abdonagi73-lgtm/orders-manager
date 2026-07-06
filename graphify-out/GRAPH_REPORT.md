# Graph Report - orders-manager-saas  (2026-07-06)

## Corpus Check
- 139 files · ~124,922 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 796 nodes · 1548 edges · 56 communities (36 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0962b008`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_decryptSession|decryptSession]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_types.ts|types.ts]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_gate.ts|gate.ts]]
- [[_COMMUNITY_Flowxiq — API Contracts|Flowxiq — API Contracts]]
- [[_COMMUNITY_V2 — Growth Features|V2 — Growth Features]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_Flowxiq — Development Rules|Flowxiq — Development Rules]]
- [[_COMMUNITY_Flowxiq — UI Design System|Flowxiq — UI Design System]]
- [[_COMMUNITY_Flowxiq — Platform Architecture|Flowxiq — Platform Architecture]]
- [[_COMMUNITY_Orders Manager — Setup Guide|Orders Manager — Setup Guide]]
- [[_COMMUNITY_Tables|Tables]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Flowxiq — Authentication Flows|Flowxiq — Authentication Flows]]
- [[_COMMUNITY_Flowxiq — Subscription Model|Flowxiq — Subscription Model]]
- [[_COMMUNITY_manifest.json|manifest.json]]
- [[_COMMUNITY_Flowxiq — Product Vision|Flowxiq — Product Vision]]
- [[_COMMUNITY_SetupWizard.tsx|SetupWizard.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_seed-plan-configs.mjs|seed-plan-configs.mjs]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_add-reset-code-columns.mjs|add-reset-code-columns.mjs]]
- [[_COMMUNITY_fix-entities.mjs|fix-entities.mjs]]
- [[_COMMUNITY_fix-entities2.mjs|fix-entities2.mjs]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_FlowxiqLogo.tsx|FlowxiqLogo.tsx]]
- [[_COMMUNITY_add-setup-columns.mjs|add-setup-columns.mjs]]
- [[_COMMUNITY_next.config.mjs|next.config.mjs]]
- [[_COMMUNITY_next-env.d.ts|next-env.d.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_sw.js|sw.js]]
- [[_COMMUNITY_dump.mjs|dump.mjs]]
- [[_COMMUNITY_resetCodes.ts|resetCodes.ts]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_types.ts|types.ts]]
- [[_COMMUNITY_showSuccess|showSuccess]]
- [[_COMMUNITY_pricing.ts|pricing.ts]]
- [[_COMMUNITY_settings-sections.tsx|settings-sections.tsx]]
- [[_COMMUNITY_graphify|graphify.md]]
- [[_COMMUNITY_graphify|graphify.md]]

## God Nodes (most connected - your core abstractions)
1. `db` - 42 edges
2. `decryptSession()` - 40 edges
3. `internalError()` - 31 edges
4. `ok()` - 29 edges
5. `err()` - 28 edges
6. `enforcePerm()` - 25 edges
7. `companies` - 17 edges
8. `users` - 17 edges
9. `getSession()` - 17 edges
10. `Flowxiq — Development Rules` - 16 edges

## Surprising Connections (you probably didn't know these)
- `PATCH()` --indirect_call--> `err()`  [INFERRED]
  src/app/api/access-requests/[id]/route.ts → src/lib/api/response.ts
- `POST()` --indirect_call--> `err()`  [INFERRED]
  src/app/api/access-requests/route.ts → src/lib/api/response.ts
- `GET()` --indirect_call--> `err()`  [INFERRED]
  src/app/api/access-requests/route.ts → src/lib/api/response.ts
- `GET()` --indirect_call--> `err()`  [INFERRED]
  src/app/api/onboard/validate/route.ts → src/lib/api/response.ts
- `ManagerOrderCard()` --references--> `react`  [EXTRACTED]
  src/app/owner/page.tsx → package.json

## Import Cycles
- None detected.

## Communities (56 total, 20 thin omitted)

### Community 0 - "decryptSession"
Cohesion: 0.06
Nodes (89): GET(), getSession(), POST(), GET(), getSession(), POST(), POST(), DELETE() (+81 more)

### Community 1 - "schema.ts"
Cohesion: 0.05
Nodes (58): PATCH(), GET(), POST(), DELETE(), GET(), POST(), PUT(), GET() (+50 more)

### Community 2 - "page.tsx"
Cohesion: 0.14
Nodes (16): react, addCatalogItem(), addWorker(), copyOrderItems(), deleteCatalogItem(), loadNotifs(), ManagerOrderCard(), PriceRow() (+8 more)

### Community 3 - "route.ts"
Cohesion: 0.07
Nodes (41): POST(), getSession(), PATCH(), doMgmtSearch(), Platform, PlatformConfig, NOTE: Required secrets use ES `get` accessors so they are validated lazily, getClient() (+33 more)

### Community 4 - "page.tsx"
Cohesion: 0.07
Nodes (35): deleteWholeOrder(), duplicateRow(), editRow(), flat(), goTo(), onPop(), openExistingOrder(), parseVoiceInput() (+27 more)

### Community 5 - "types.ts"
Cohesion: 0.12
Nodes (23): GET(), getSession(), ConnectorConfigField, IntegrationConnector, cloverConnector, lightspeedConnector, shopifyConnector, squareConnector (+15 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (37): dependencies, bcryptjs, drizzle-orm, googleapis, jose, @libsql/client, lucide-react, next (+29 more)

### Community 7 - "gate.ts"
Cohesion: 0.27
Nodes (9): checkFeature(), getDb(), getEnabledFeatures(), GLOBAL_DEFAULTS, isFeatureEnabled(), FeatureCheckResult, FeatureFlag, FeatureKey (+1 more)

### Community 8 - "Flowxiq — API Contracts"
Cohesion: 0.08
Nodes (25): Audit Log Routes, Auth Routes, Authentication, Base URL, Conventions, `DELETE /api/v1/integrations?id=xxx`, Error Code Reference, Export Routes (+17 more)

### Community 9 - "V2 — Growth Features"
Cohesion: 0.09
Nodes (21): Advanced Analytics, Advanced Analytics, AI Features, Billing & Payments, ✅ Completed, Customer Portal, Enterprise Features, ERP Integrations (+13 more)

### Community 10 - "page.tsx"
Cohesion: 0.12
Nodes (13): Mode, ROLE_DESTINATIONS, Workspace, metadata, MarketingNav(), AccessRequest, Company, LIFECYCLE_STAGES (+5 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "Flowxiq — Development Rules"
Cohesion: 0.12
Nodes (16): File Organization Rules, Flowxiq — Development Rules, Rule 10: Environment Variables Through Platform Config, Rule 11: Use Business Terminology, Rule 12: Mobile-First Worker Portal, Rule 13: No Hardcoded Customer Data, Rule 14: TypeScript Strictness, Rule 1: Docs First (+8 more)

### Community 13 - "Flowxiq — UI Design System"
Cohesion: 0.12
Nodes (16): Animation Guidelines, Badge (Status), Border Radius, Button, Card, Color Tokens, Component Specs, Design Philosophy (+8 more)

### Community 14 - "Flowxiq — Platform Architecture"
Cohesion: 0.12
Nodes (15): API Design, Authentication Flow, Database Connection, Environment Variables, Error Codes, Every API Handler Follows This Pattern, Feature Flag System, Flowxiq — Platform Architecture (+7 more)

### Community 15 - "Orders Manager — Setup Guide"
Cohesion: 0.12
Nodes (15): Changing settings per order session, Choices For You · Vendor → Square POS workflow, File structure, Orders Manager — Setup Guide, Sharing with your worker, Starting a new order session, Step 1 — Create a Google Sheet, Step 2 — Create a Google Cloud service account (+7 more)

### Community 16 - "Tables"
Cohesion: 0.13
Nodes (14): `audit_log` — Immutable Activity Trail, Cascade Rules, `companies` — Business Workspaces, ER Diagram, Flowxiq — Database Schema, Index Strategy, `integrations` — POS Connections, `order_items` — Line Items (+6 more)

### Community 17 - "page.tsx"
Cohesion: 0.14
Nodes (10): addBtnStyle, btnPrimStyle, btnSecStyle, cardStyle, containerStyle, CURRENCIES, Step, stepHeaderStyle (+2 more)

### Community 18 - "Flowxiq — Authentication Flows"
Cohesion: 0.15
Nodes (12): Flow 1 — Standard Login (Email + Password), Flow 2 — PIN Login (Worker Portal), Flow 3 — First-Time Activation, Flow 4 — Forgot Password, Flow 5 — Logout, Flowxiq — Authentication Flows, Future: 2FA (V3), Future: Trusted Devices (V2) (+4 more)

### Community 19 - "Flowxiq — Subscription Model"
Cohesion: 0.15
Nodes (12): 1. Feature Access, 2. Worker Count Limit, 3. Subscription Status, Configuring Plans Without Code Changes, Design Principles, Flowxiq — Subscription Model, How Plans Are Enforced, Plan Tiers (+4 more)

### Community 20 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 21 - "Flowxiq — Product Vision"
Cohesion: 0.22
Nodes (8): Business Model, Core Principles, Differentiation, Flowxiq — Product Vision, Mission, Target Customer, The Four Portals, The Problem We Solve

### Community 22 - "SetupWizard.tsx"
Cohesion: 0.29
Nodes (6): BUSINESS_TYPES, FormField, POS_OPTIONS, POS_TEMPLATES, Props, SetupWizard()

### Community 23 - "page.tsx"
Cohesion: 0.33
Nodes (6): AccessRequest, BusinessStat, FlowxiqConsolePage(), fmt(), PlatformTotals, Tab

### Community 24 - "seed-plan-configs.mjs"
Cohesion: 0.29
Nodes (5): client, __dirname, envPath, envVars, plans

### Community 25 - "page.tsx"
Cohesion: 0.33
Nodes (4): INFRA_ITEMS, metadata, SECURITY_ITEMS, SecurityItem

### Community 29 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), getAuth(), POST()

### Community 50 - "types.ts"
Cohesion: 0.15
Nodes (12): CartItem, CompanyInfo, PDFInner(), safeArr(), ItemStatus, OrderItem, OrderStatus, OrderType (+4 more)

### Community 51 - "showSuccess"
Cohesion: 0.27
Nodes (10): closeOrder(), deleteItem(), deleteOrderHandler(), doExport(), markCommissionPaid(), saveEditItem(), saveOrderEdit(), showConfirmModal() (+2 more)

### Community 52 - "pricing.ts"
Cohesion: 0.39
Nodes (7): calcRetailPrice(), calcUnitCost(), getVendorAbbr(), getWeight(), itemToSquareRows(), SquareRow, WEIGHT_TABLE

### Community 53 - "settings-sections.tsx"
Cohesion: 0.29
Nodes (7): ACTION_COLORS, ActivitySection(), FIELDS, IntegrationsSection(), PROVIDER_META, SubscriptionSection(), timeAgo()

## Knowledge Gaps
- **314 isolated node(s):** `files`, `replacements`, `c`, `reps`, `nextConfig` (+309 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `page.tsx` to `dependencies`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `page.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `OrderItem` connect `types.ts` to `schema.ts`, `page.tsx`, `page.tsx`, `pricing.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `err()` (e.g. with `PATCH()` and `GET()`) actually correct?**
  _`err()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `files`, `replacements`, `c` to the rest of the system?**
  _318 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `decryptSession` be split into smaller, more focused modules?**
  _Cohesion score 0.06044226044226044 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._