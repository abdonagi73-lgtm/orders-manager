// src/lib/sheets.ts
// Tabs: Workers | Orders | Items | Settings | Registry

import { google } from 'googleapis';
import type { Worker, Order, OrderItem, SessionSettings } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

const TAB_WORKERS  = 'Workers';
const TAB_ORDERS   = 'Orders';
const TAB_ITEMS    = 'Items';
const TAB_SETTINGS = 'Settings';
const TAB_REGISTRY = 'Registry';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
async function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function safeJSON<T>(v: string, fb: T): T {
  try { return JSON.parse(v); } catch { return fb; }
}

// ── WORKERS ────────────────────────────────────────────────────────────────

export async function getWorkers(): Promise<Worker[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_WORKERS}!A2:C`,
  });
  return (res.data.values ?? []).filter(r => r[0]).map(r => ({
    id: r[0], name: r[1] ?? '', pin: r[2] ?? '',
  }));
}

export async function verifyWorker(pin: string): Promise<Worker | null> {
  const workers = await getWorkers();
  return workers.find(w => w.pin === pin) ?? null;
}

export async function saveWorkers(workers: Worker[]): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID, range: `${TAB_WORKERS}!A2:C`,
  });
  if (!workers.length) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_WORKERS}!A2:C${workers.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: workers.map(w => [w.id, w.name, w.pin]) },
  });
}

// ── ORDERS ─────────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<Order[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_ORDERS}!A2:J`,
  });
  return (res.data.values ?? []).filter(r => r[0]).map(r => ({
    id: r[0], name: r[1] ?? '', startDate: r[2] ?? '',
    workerId: r[3] ?? '', workerName: r[4] ?? '',
    status: (r[5] ?? 'open') as Order['status'],
    shippingCost: parseFloat(r[6]) || 0,
    workerCommission: parseFloat(r[7]) || 0,
    totalOrderCost: parseFloat(r[8]) || 0,
    commissionPaid: r[9] === 'true',
    createdAt: r[10] ?? '', closedAt: r[11] ?? '',
    itemCount: parseInt(r[12]) || 0,
    totalValue: parseFloat(r[13]) || 0,
  }));
}

export async function getOrdersByWorker(workerId: string): Promise<Order[]> {
  const all = await getAllOrders();
  return all.filter(o => o.workerId === workerId);
}

export async function createOrder(order: Order): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_ORDERS}!A:M`,
    valueInputOption: 'RAW',
    requestBody: { values: [orderToRow(order)] },
  });
}

export async function updateOrder(order: Order): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_ORDERS}!A:A`,
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.findIndex(id => id === order.id);
  if (rowIndex < 1) throw new Error('Order not found');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ORDERS}!A${rowIndex + 1}:N${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [orderToRow(order)] },
  });
}

function orderToRow(o: Order): string[] {
  return [
    o.id, o.name, o.startDate, o.workerId, o.workerName,
    o.status, String(o.shippingCost), String(o.workerCommission || 0),
    String(o.totalOrderCost || 0), String(o.commissionPaid || false),
    o.createdAt, o.closedAt,
    String(o.itemCount), String(o.totalValue),
  ];
}

// ── ITEMS ──────────────────────────────────────────────────────────────────

export async function getItemsByOrder(orderId: string): Promise<OrderItem[]> {
  const all = await getAllItems();
  return all.filter(i => i.orderId === orderId);
}

export async function getAllItems(): Promise<OrderItem[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_ITEMS}!A2:M`,
  });
  return (res.data.values ?? []).filter(r => r[0]).map(r => ({
    id: r[0], orderId: r[1] ?? '', vendor: r[2] ?? '',
    code: r[3] ?? '', category: r[4] ?? '',
    colors: safeJSON(r[5], []), sizes: safeJSON(r[6], []),
    price: parseFloat(r[7]) || 0, qty: parseInt(r[8]) || 1,
    notes: r[9] ?? '', ownerNote: r[10] ?? '',
    status: (r[11] ?? 'pending') as OrderItem['status'],
    createdAt: r[12] ?? new Date().toISOString(),
    photo: r[13] ?? '',
  }));
}

export async function appendItem(item: OrderItem): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_ITEMS}!A:N`,
    valueInputOption: 'RAW',
    requestBody: { values: [itemToRow(item)] },
  });
  // Update order item count + total value
  await refreshOrderStats(item.orderId);
}

export async function updateItem(item: OrderItem): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_ITEMS}!A:A`,
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.findIndex(id => id === item.id);
  if (rowIndex < 1) throw new Error('Item not found');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A${rowIndex + 1}:N${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [itemToRow(item)] },
  });
}

export async function deleteItem(id: string): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TAB_ITEMS}!A:A`,
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.findIndex(r => r === id);
  if (rowIndex < 1) return;
  const item = (await getAllItems()).find(i => i.id === id);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A${rowIndex + 1}:N${rowIndex + 1}`,
  });
  if (item) await refreshOrderStats(item.orderId);
}

async function refreshOrderStats(orderId: string): Promise<void> {
  const items = await getItemsByOrder(orderId);
  const orders = await getAllOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.itemCount = items.length;
  order.totalValue = items.reduce((s, i) => s + i.price * i.qty, 0);
  await updateOrder(order);
}

function itemToRow(i: OrderItem): string[] {
  return [
    i.id, i.orderId, i.vendor, i.code, i.category,
    JSON.stringify(i.colors), JSON.stringify(i.sizes),
    String(i.price), String(i.qty), i.notes, i.ownerNote,
    i.status, i.createdAt, i.photo || '',
  ];
}

// ── SETTINGS ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SessionSettings = {
  tax: 6, markup: 3.5, shipping: 6.10,
  ownerPin: process.env.OWNER_PIN ?? '1234',
};

export async function getSettings(): Promise<SessionSettings> {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB_SETTINGS}!B1:B4`,
    });
    const v = res.data.values ?? [];
    return {
      tax:      parseFloat(v[0]?.[0]) || DEFAULT_SETTINGS.tax,
      markup:   parseFloat(v[1]?.[0]) || DEFAULT_SETTINGS.markup,
      shipping: parseFloat(v[2]?.[0]) || DEFAULT_SETTINGS.shipping,
      ownerPin: v[3]?.[0]            || DEFAULT_SETTINGS.ownerPin,
    };
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(s: SessionSettings): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_SETTINGS}!A1:B4`,
    valueInputOption: 'RAW',
    requestBody: { values: [
      ['tax', String(s.tax)], ['markup', String(s.markup)],
      ['shipping', String(s.shipping)], ['ownerPin', String(s.ownerPin)],
    ]},
  });
}

// ── REGISTRY ───────────────────────────────────────────────────────────────

export async function getRegistry(): Promise<Record<string, number>> {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${TAB_REGISTRY}!A:B`,
    });
    const reg: Record<string, number> = {};
    (res.data.values ?? []).forEach(r => { if (r[0] && r[1]) reg[r[0]] = parseInt(r[1]); });
    return reg;
  } catch { return {}; }
}

export async function ensureVendorInRegistry(name: string): Promise<number> {
  const reg = await getRegistry();
  const existing = Object.entries(reg).find(([k]) => k.toLowerCase() === name.toLowerCase());
  if (existing) return existing[1];
  const newCode = Math.max(1060, ...Object.values(reg)) + 1;
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${TAB_REGISTRY}!A:B`,
    valueInputOption: 'RAW',
    requestBody: { values: [[name, String(newCode)]] },
  });
  return newCode;
}

// ── INIT ───────────────────────────────────────────────────────────────────

export async function initSheet(): Promise<void> {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = meta.data.sheets?.map(s => s.properties?.title) ?? [];
  const toCreate = [TAB_WORKERS, TAB_ORDERS, TAB_ITEMS, TAB_SETTINGS, TAB_REGISTRY]
    .filter(t => !existing.includes(t));

  if (toCreate.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: toCreate.map(title => ({ addSheet: { properties: { title } } })) },
    });
  }

  // Headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_WORKERS}!A1:C1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['id','name','pin']] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_ORDERS}!A1:N1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['id','name','startDate','workerId','workerName','status','shippingCost','workerCommission','totalOrderCost','commissionPaid','createdAt','closedAt','itemCount','totalValue']] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${TAB_ITEMS}!A1:M1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['id','orderId','vendor','code','category','colors','sizes','price','qty','notes','ownerNote','status','createdAt','photo']] },
  });

  // Seed workers: Morad + Abdo
  await saveWorkers([
    { id: 'w1', name: 'Morad', pin: '2026' },
    { id: 'w2', name: 'Abdo',  pin: '7111' },
  ]);

  // Default settings
  await saveSettings(DEFAULT_SETTINGS);

  // Vendor registry
  const vendors: [string, number][] = [
    ['SAW',1001],['ACTUAL',1002],['AirLife',1003],['Daynamo',1004],
    ['Punch',1005],['RCJ',1006],['Rugatchi',1007],['Crash',1008],
    ['2Y',1009],['Plus18',1010],['Marrakesh',1011],['Rollie',1012],
    ['Yadawiya',1014],['Juan Raul (JR)',1015],['NEGRO',1016],
    ['King Brich',1017],['Mr.lii',1018],['Champ',1019],
    ['Look Man',1020],['BREEZY',1021],['JCJ',1022],['Polize',1023],
    ['Nomarc',1024],['Maxim',1025],['Deezy',1026],['LenaSo',1027],
    ['3 line',1029],['2512',1030],['oscar',1031],['Tarz',1032],
    ['2 Morrow',1033],['Lorben',1033],['Essens of life',1033],
    ['Antioch',1034],['doa',1034],['Dezzy',1034],['Sparf',1034],
    ['Daniel',1035],['Gabbia',1035],['Jacy jace',1035],['The Dad',1035],
    ['Delart',1036],['GUARESS',1037],['Marrakesh',1037],['Breezify',1060],
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_REGISTRY}!A1:B${vendors.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: vendors.map(([n,c]) => [n, String(c)]) },
  });
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────

export async function addNotification(
  type: string, forWho: string, workerId: string,
  workerName: string, orderId: string, orderName: string,
  itemId: string, itemCode: string, message: string
): Promise<void> {
  try {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Notifications!A:L',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'n_' + Date.now(), type, forWho,
          workerId, workerName, orderId, orderName,
          itemId, itemCode, message, 'false',
          new Date().toISOString()
        ]]
      },
    });
  } catch(e) {
    console.error('Notification write error:', e);
  }
}
