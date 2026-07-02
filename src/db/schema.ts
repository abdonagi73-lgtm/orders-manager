import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo_url: text('logo_url'),
  currency: text('currency').default('USD').notNull(),
  commission_rate: real('commission_rate').default(0).notNull(),
  status: text('status').default('active').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  pin_hash: text('pin_hash').notNull(),
  role: text('role').default('worker').notNull(),
});

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  frequency_score: integer('frequency_score').default(0).notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  startDate: text('startDate').notNull(),
  workerId: text('workerId').notNull(),
  workerName: text('workerName').notNull(),
  status: text('status').default('open').notNull(),
  shippingCost: real('shippingCost').default(0).notNull(),
  workerCommission: real('workerCommission').default(0).notNull(),
  totalOrderCost: real('totalOrderCost').default(0).notNull(),
  commissionPaid: integer('commissionPaid', { mode: 'boolean' }).default(false).notNull(),
  orderType: text('orderType').default('store').notNull(),
  createdAt: text('createdAt').notNull(),
  closedAt: text('closedAt').default('').notNull(),
  itemCount: integer('itemCount').default(0).notNull(),
  totalValue: real('totalValue').default(0).notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  order_id: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  workerId: text('workerId').default('').notNull(),
  vendor: text('vendor').notNull(),
  code: text('code').notNull(),
  category: text('category').notNull(),
  colors: text('colors').notNull(), // JSON string array
  sizes: text('sizes').notNull(), // JSON string array
  price: real('price').notNull(),
  qty: integer('qty').default(1).notNull(),
  notes: text('notes').default('').notNull(),
  ownerNote: text('ownerNote').default('').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: text('createdAt').notNull(),
  photo: text('photo').default('').notNull(), // Base64 or URL
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  for_who: text('for_who').notNull(),
  worker_id: text('worker_id').notNull(),
  worker_name: text('worker_name').notNull(),
  order_id: text('order_id').notNull(),
  order_name: text('order_name').notNull(),
  item_id: text('item_id').notNull(),
  item_code: text('item_code').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).default(false).notNull(),
  created_at: text('created_at').notNull(),
});

export const timeline = sqliteTable('timeline', {
  id: text('id').primaryKey(),
  company_id: text('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  order_id: text('order_id').notNull(),
  order_name: text('order_name').notNull(),
  action: text('action').notNull(),
  by: text('by').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const accessRequests = sqliteTable('access_requests', {
  id: text('id').primaryKey(),
  business_name: text('business_name').notNull(),
  industry: text('industry').notNull(),
  country: text('country').notNull(),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').default('').notNull(),
  num_workers: integer('num_workers').default(1).notNull(),
  current_system: text('current_system').default('').notNull(),
  status: text('status').default('pending').notNull(), // pending | approved | rejected
  onboarding_token: text('onboarding_token').default('').notNull(),
  notes: text('notes').default('').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});
