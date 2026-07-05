import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES (Business / Workspace — V1: 1 business = 1 workspace)
// ─────────────────────────────────────────────────────────────────────────────
export const companies = sqliteTable('companies', {
  id:                  text('id').primaryKey(),
  name:                text('name').notNull(),
  logo_url:            text('logo_url'),
  currency:            text('currency').default('USD').notNull(),
  commission_rate:     real('commission_rate').default(0).notNull(),
  status:              text('status').default('active').notNull(),   // active | suspended | cancelled
  industry:            text('industry'),
  business_type:       text('business_type'),
  country:             text('country'),
  state_province:      text('state_province'),
  city:                text('city'),
  timezone:            text('timezone'),
  language:            text('language'),
  website:             text('website'),
  phone:               text('phone'),
  email:               text('email'),
  tax_id:              text('tax_id'),
  // Kept for backwards compatibility — subscription details now in subscriptions table
  plan:                text('plan'),
  billing_cycle:       text('billing_cycle'),
  max_users:           integer('max_users'),
  max_workers:         integer('max_workers'),
  storage_limit_gb:    integer('storage_limit_gb'),
  trial_expiration:    text('trial_expiration'),
  owner_name:          text('owner_name'),
  owner_phone:         text('owner_phone'),
  setup_complete:      integer('setup_complete').default(0).notNull(),
  pos_type:            text('pos_type'),
  form_fields:         text('form_fields'),   // JSON array of field definitions
  created_at:          text('created_at').default('').notNull(),
  updated_at:          text('updated_at').default('').notNull(),
  deleted_at:          text('deleted_at'),   // soft delete
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id:                  text('id').primaryKey(),
  company_id:          text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name:                text('name').notNull(),
  email:               text('email'),
  pin_hash:            text('pin_hash').notNull(),
  role:                text('role').default('worker').notNull(),   // worker | manager | owner | admin | super_admin
  is_activated:        integer('is_activated', { mode: 'boolean' }).default(false).notNull(),
  reset_code:          text('reset_code'),          // 6-digit code, null when not pending
  reset_code_expires:  text('reset_code_expires'),  // ISO timestamp
  created_at:          text('created_at').default('').notNull(),
  updated_at:          text('updated_at').default('').notNull(),
  deleted_at:          text('deleted_at'),   // soft delete
}, (t) => ({
  idx_users_company: index('idx_users_company_id').on(t.company_id),
  idx_users_email:   index('idx_users_email').on(t.email),
  idx_users_role:    index('idx_users_role').on(t.role),
}));

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────────────────────────────────────
export const vendors = sqliteTable('vendors', {
  id:              text('id').primaryKey(),
  company_id:      text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name:            text('name').notNull(),
  frequency_score: integer('frequency_score').default(0).notNull(),
  created_at:      text('created_at').default('').notNull(),
  deleted_at:      text('deleted_at'),   // soft delete
}, (t) => ({
  idx_vendors_company: index('idx_vendors_company_id').on(t.company_id),
}));

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────
export const orders = sqliteTable('orders', {
  id:               text('id').primaryKey(),
  company_id:       text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name:             text('name').notNull(),
  startDate:        text('startDate').notNull(),
  workerId:         text('workerId').notNull(),
  workerName:       text('workerName').notNull(),
  status:           text('status').default('open').notNull(),   // open | submitted | imported
  shippingCost:     real('shippingCost').default(0).notNull(),
  workerCommission: real('workerCommission').default(0).notNull(),
  totalOrderCost:   real('totalOrderCost').default(0).notNull(),
  commissionPaid:   integer('commissionPaid', { mode: 'boolean' }).default(false).notNull(),
  orderType:        text('orderType').default('store').notNull(),
  createdAt:        text('createdAt').notNull(),
  closedAt:         text('closedAt').default('').notNull(),
  itemCount:        integer('itemCount').default(0).notNull(),
  totalValue:       real('totalValue').default(0).notNull(),
  deleted_at:       text('deleted_at'),   // soft delete
}, (t) => ({
  idx_orders_company:    index('idx_orders_company_id').on(t.company_id),
  idx_orders_worker:     index('idx_orders_worker_id').on(t.workerId),
  idx_orders_status:     index('idx_orders_status').on(t.status),
  idx_orders_created:    index('idx_orders_created_at').on(t.createdAt),
}));

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS
// ─────────────────────────────────────────────────────────────────────────────
export const orderItems = sqliteTable('order_items', {
  id:         text('id').primaryKey(),
  order_id:   text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  workerId:   text('workerId').default('').notNull(),
  vendor:     text('vendor').notNull(),
  code:       text('code').notNull(),
  category:   text('category').notNull(),
  colors:     text('colors').notNull(),   // JSON string array
  sizes:      text('sizes').notNull(),    // JSON string array
  price:      real('price').notNull(),
  qty:        integer('qty').default(1).notNull(),
  notes:      text('notes').default('').notNull(),
  ownerNote:  text('ownerNote').default('').notNull(),
  status:     text('status').default('pending').notNull(),   // pending | approved | flagged
  createdAt:  text('createdAt').notNull(),
  photo:      text('photo').default('').notNull(),   // Base64 or URL
  deleted_at: text('deleted_at'),   // soft delete
}, (t) => ({
  idx_items_order:   index('idx_items_order_id').on(t.order_id),
  idx_items_worker:  index('idx_items_worker_id').on(t.workerId),
  idx_items_status:  index('idx_items_status').on(t.status),
}));

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notifications = sqliteTable('notifications', {
  id:           text('id').primaryKey(),
  company_id:   text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  type:         text('type').notNull(),
  for_who:      text('for_who').notNull(),
  worker_id:    text('worker_id').notNull(),
  worker_name:  text('worker_name').notNull(),
  order_id:     text('order_id').notNull(),
  order_name:   text('order_name').notNull(),
  item_id:      text('item_id').notNull(),
  item_code:    text('item_code').notNull(),
  message:      text('message').notNull(),
  read:         integer('read', { mode: 'boolean' }).default(false).notNull(),
  created_at:   text('created_at').notNull(),
}, (t) => ({
  idx_notif_company: index('idx_notifications_company_id').on(t.company_id),
  idx_notif_worker:  index('idx_notifications_worker_id').on(t.worker_id),
  idx_notif_read:    index('idx_notifications_read').on(t.read),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE (order-scoped activity — kept for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────
export const timeline = sqliteTable('timeline', {
  id:           text('id').primaryKey(),
  company_id:   text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  order_id:     text('order_id').notNull(),
  order_name:   text('order_name').notNull(),
  action:       text('action').notNull(),
  by:           text('by').notNull(),
  timestamp:    text('timestamp').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS REQUESTS (onboarding pipeline)
// ─────────────────────────────────────────────────────────────────────────────
export const accessRequests = sqliteTable('access_requests', {
  id:               text('id').primaryKey(),
  business_name:    text('business_name').notNull(),
  industry:         text('industry').notNull(),
  country:          text('country').notNull(),
  email:            text('email').notNull(),
  whatsapp:         text('whatsapp').default('').notNull(),
  num_workers:      integer('num_workers').default(1).notNull(),
  current_system:   text('current_system').default('').notNull(),
  status:           text('status').default('pending').notNull(),   // pending | approved | rejected
  onboarding_token: text('onboarding_token').default('').notNull(),
  notes:            text('notes').default('').notNull(),
  created_at:       text('created_at').notNull(),
  updated_at:       text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS (billing record per company)
// ─────────────────────────────────────────────────────────────────────────────
export const subscriptions = sqliteTable('subscriptions', {
  id:                     text('id').primaryKey(),
  company_id:             text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  plan:                   text('plan').notNull().default('trial'),   // trial | professional | business | enterprise
  status:                 text('status').notNull().default('active'), // active | suspended | cancelled | past_due
  trial_ends_at:          text('trial_ends_at'),
  current_period_start:   text('current_period_start'),
  current_period_end:     text('current_period_end'),
  stripe_customer_id:     text('stripe_customer_id'),
  stripe_subscription_id: text('stripe_subscription_id'),
  cancelled_at:           text('cancelled_at'),
  upgrade_requested_at:   text('upgrade_requested_at'),
  upgrade_target_plan:    text('upgrade_target_plan'),
  created_at:             text('created_at').notNull(),
  updated_at:             text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PLAN CONFIGS (DB-configurable plans — no code change needed to update plans)
// ─────────────────────────────────────────────────────────────────────────────
export const planConfigs = sqliteTable('plan_configs', {
  id:            text('id').primaryKey(),
  plan_key:      text('plan_key').notNull(),          // trial | professional | business | enterprise
  display_name:  text('display_name').notNull(),
  description:   text('description').notNull(),
  price_monthly: real('price_monthly').notNull().default(0),
  price_annual:  real('price_annual').notNull().default(0),
  max_workers:   integer('max_workers'),              // NULL = unlimited
  max_storage_gb:integer('max_storage_gb'),           // NULL = unlimited
  features:      text('features').notNull().default('[]'), // JSON array of FeatureKey strings
  is_public:     integer('is_public', { mode: 'boolean' }).default(true).notNull(),
  sort_order:    integer('sort_order').default(0).notNull(),
  created_at:    text('created_at').notNull(),
  updated_at:    text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAGS (per-company overrides on top of plan features)
// ─────────────────────────────────────────────────────────────────────────────
export const feature_flags = sqliteTable('feature_flags', {
  id:              text('id').primaryKey(),
  scope:           text('scope').notNull().default('company'),   // global | company
  company_id:      text('company_id'),                           // null for global scope
  feature_key:     text('feature_key').notNull(),
  enabled:         integer('enabled').notNull().default(0),
  override_reason: text('override_reason'),
  set_by:          text('set_by'),
  created_at:      text('created_at').notNull(),
  updated_at:      text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS (POS connections per company)
// ─────────────────────────────────────────────────────────────────────────────
export const integrations = sqliteTable('integrations', {
  id:            text('id').primaryKey(),
  company_id:    text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  provider:      text('provider').notNull(),   // square | shopify | clover | lightspeed
  display_name:  text('display_name').notNull(),
  status:        text('status').notNull().default('pending'),   // connected | disconnected | error | pending
  config:        text('config').notNull().default(''),          // AES-256-GCM encrypted JSON
  last_synced_at:text('last_synced_at'),
  sync_error:    text('sync_error'),
  created_at:    text('created_at').notNull(),
  updated_at:    text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG (system-wide immutable activity trail)
// ─────────────────────────────────────────────────────────────────────────────
export const audit_log = sqliteTable('audit_log', {
  id:          text('id').primaryKey(),
  company_id:  text('company_id').notNull(),    // intentionally no FK cascade — keep logs after company deleted
  actor_id:    text('actor_id').notNull(),
  actor_name:  text('actor_name').notNull(),
  actor_role:  text('actor_role').notNull(),
  action:      text('action').notNull(),         // e.g. 'order.created'
  entity_type: text('entity_type').notNull(),    // e.g. 'order'
  entity_id:   text('entity_id').notNull(),
  meta:        text('meta'),                     // JSON: extra context
  ip_address:  text('ip_address'),
  request_id:  text('request_id'),
  created_at:  text('created_at').notNull(),
}, (t) => ({
  idx_audit_company: index('idx_audit_log_company_id').on(t.company_id),
  idx_audit_actor:   index('idx_audit_log_actor_id').on(t.actor_id),
  idx_audit_action:  index('idx_audit_log_action').on(t.action),
}));

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS (flexible key-value config per company)
// ─────────────────────────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  id:         text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  key:        text('key').notNull(),    // e.g. 'default_currency', 'order_prefix', 'require_photo'
  value:      text('value').notNull(), // JSON-encoded value
  updated_by: text('updated_by').notNull(),
  updated_at: text('updated_at').notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TRUSTED DEVICES (architecture ready — UI in V2)
// ─────────────────────────────────────────────────────────────────────────────
export const trusted_devices = sqliteTable('trusted_devices', {
  id:                 text('id').primaryKey(),
  company_id:         text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  user_id:            text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  device_fingerprint: text('device_fingerprint').notNull(),
  device_name:        text('device_name').notNull(),
  last_seen_at:       text('last_seen_at').notNull(),
  expires_at:         text('expires_at').notNull(),
  created_at:         text('created_at').notNull(),
});
