# Flowxiq — Product Vision

## Mission

Flowxiq is a cloud-based, multi-tenant SaaS platform that helps retail businesses manage their complete purchasing lifecycle — from supplier visits and product sourcing in the field, through approval workflows, to synchronization with POS and ERP systems.

## The Problem We Solve

Retail buyers and field workers visit vendor showrooms, trade shows, and suppliers to source products. Today this process is fragmented: they use paper order forms, WhatsApp photos, spreadsheets, or generic note-taking apps. The owner back at the store has no visibility, no approval control, and no automated way to import selected products into their POS system.

Flowxiq replaces this entire manual workflow with a purpose-built, role-aware platform.

## Target Customer

- **Small to mid-size retail businesses** with 1–50 purchasing team members
- Businesses that source products from multiple vendors
- Businesses that already use Square, Shopify, Clover, Lightspeed, or similar POS systems
- Industries: fashion/streetwear, boutique retail, specialty goods, wholesale buyers

## The Four Portals

| Portal | Who Uses It | Purpose |
|---|---|---|
| **Public Website** | Prospective customers | Marketing, pricing, access request form |
| **Worker Portal** (`/field-fast`) | Field buyers / purchasing workers | Create orders, add items, take product photos, submit for review |
| **Manager Portal** (`/owner`) | Business owners and managers | Review orders, approve/flag items, manage team, run analytics |
| **HQ Portal** (`/super-admin`) | Flowxiq internal team | Manage all tenants, approve access requests, monitor platform health |

## Core Principles

| Principle | What It Means in Practice |
|---|---|
| **Simplicity over complexity** | Every screen serves one clear purpose. Workers need no training. |
| **Enterprise-grade UX** | The product looks and feels premium. No compromises on design quality. |
| **Multi-tenant SaaS** | Every company's data is strictly isolated. No cross-tenant data leaks. |
| **Secure by design** | Authentication, encryption, and RBAC are foundational, not afterthoughts. |
| **Automation first** | Manual steps that can be automated should be automated. |
| **Scalable architecture** | Every design decision must support 10x the current load without rearchitecting. |
| **Documentation as source of truth** | Code follows the docs. If the docs say it, the code must reflect it. |

## Business Model

- **SaaS subscription** per business (not per seat for standard plans)
- Four tiers: Free Trial → Professional → Business → Enterprise
- Plans are capability-based, not usage-limited (unlimited orders, unlimited items)
- Manual upgrade flow initially; Stripe integration in V2

## Differentiation

1. **Purpose-built for purchasing** — not a generic task manager or spreadsheet
2. **Mobile-first worker experience** — optimized for field use on mobile devices
3. **POS-ready exports** — direct integration with Square, Shopify, Clover, Lightspeed
4. **Real-time manager visibility** — notifications and live status updates
5. **Multi-vendor workflow** — handles multiple vendors per order with separate line items
