// src/lib/sheets.ts
// All Google Sheets read/write logic lives here.
// The sheet has 3 tabs: Items | Settings | Registry

import { google } from 'googleapis';
import type { OrderItem, SessionSettings, SheetItemRow } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// Tab names
const TAB_ITEMS    = 'Items';
const TAB_SETTINGS = 'Settings';
const TAB_REGISTRY = 'Registry';

// Items tab columns (A→L)
const ITEM_HEADERS = [
  'id','vendor','code','category','colors','sizes',
  'price','qty','notes','ownerNote','status','createdAt'
];

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
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ── ITEMS ──────────────────────────────────────────────────────────────────

export async function getAllItems(): Promise<OrderItem[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A2:L`,
  });
  const rows = res.data.values ?? [];
  return rows.map(rowToItem).filter(Boolean) as OrderItem[];
}

export async function appendItem(item: OrderItem): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A:L`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [itemToRow(item)],
    },
  });
}

export async function updateItem(item: OrderItem): Promise<void> {
  // Find the row index by id, then overwrite it
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A:A`,
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.findIndex(id => id === item.id);
  if (rowIndex < 1) throw new Error(`Item ${item.id} not found in sheet`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A${rowIndex + 1}:L${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [itemToRow(item)],
    },
  });
}

export async function deleteItem(id: string): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A:A`,
  });
  const ids = (res.data.values ?? []).map(r => r[0]);
  const rowIndex = ids.findIndex(r => r === id);
  if (rowIndex < 1) return;

  // Clear the row (we don't physically delete to avoid row-shift bugs)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A${rowIndex + 1}:L${rowIndex + 1}`,
  });
}

function rowToItem(row: string[]): OrderItem | null {
  if (!row[0]) return null;
  return {
    id:        row[0] ?? '',
    vendor:    row[1] ?? '',
    code:      row[2] ?? '',
    category:  row[3] ?? '',
    colors:    safeParseJSON(row[4], []),
    sizes:     safeParseJSON(row[5], []),
    price:     parseFloat(row[6]) || 0,
    qty:       parseInt(row[7]) || 1,
    notes:     row[8] ?? '',
    ownerNote: row[9] ?? '',
    status:    (row[10] as OrderItem['status']) ?? 'pending',
    createdAt: row[11] ?? new Date().toISOString(),
  };
}

function itemToRow(item: OrderItem): string[] {
  return [
    item.id,
    item.vendor,
    item.code,
    item.category,
    JSON.stringify(item.colors),
    JSON.stringify(item.sizes),
    String(item.price),
    String(item.qty),
    item.notes,
    item.ownerNote,
    item.status,
    item.createdAt,
  ];
}

// ── SETTINGS ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SessionSettings = {
  tax: 6,
  markup: 3.5,
  shipping: 6.10,
  ownerPin: process.env.OWNER_PIN ?? '1234',
};

export async function getSettings(): Promise<SessionSettings> {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_SETTINGS}!B1:B4`,
    });
    const vals = res.data.values ?? [];
    return {
      tax:      parseFloat(vals[0]?.[0]) || DEFAULT_SETTINGS.tax,
      markup:   parseFloat(vals[1]?.[0]) || DEFAULT_SETTINGS.markup,
      shipping: parseFloat(vals[2]?.[0]) || DEFAULT_SETTINGS.shipping,
      ownerPin: vals[3]?.[0]            || DEFAULT_SETTINGS.ownerPin,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: SessionSettings): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_SETTINGS}!A1:B4`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        ['tax',      String(s.tax)],
        ['markup',   String(s.markup)],
        ['shipping', String(s.shipping)],
        ['ownerPin', String(s.ownerPin)],
      ],
    },
  });
}

// ── VENDOR REGISTRY ────────────────────────────────────────────────────────

export async function getRegistry(): Promise<Record<string, number>> {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_REGISTRY}!A:B`,
    });
    const rows = res.data.values ?? [];
    const reg: Record<string, number> = {};
    rows.forEach(r => {
      if (r[0] && r[1]) reg[r[0]] = parseInt(r[1]);
    });
    return reg;
  } catch {
    return {};
  }
}

export async function ensureVendorInRegistry(vendorName: string): Promise<number> {
  const registry = await getRegistry();
  const existing = Object.entries(registry).find(
    ([k]) => k.toLowerCase() === vendorName.toLowerCase()
  );
  if (existing) return existing[1];

  // Assign next code
  const maxCode = Math.max(1040, ...Object.values(registry));
  const newCode = maxCode + 1;

  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB_REGISTRY}!A:B`,
    valueInputOption: 'RAW',
    requestBody: { values: [[vendorName, String(newCode)]] },
  });
  return newCode;
}

// ── SHEET INITIALISATION ───────────────────────────────────────────────────
// Call once to set up headers and seed the registry.
// Triggered by GET /api/init (owner only)

export async function initSheet(): Promise<void> {
  const sheets = await getSheets();

  // Ensure tabs exist
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets?.map(s => s.properties?.title) ?? [];

  const tabsToCreate = [TAB_ITEMS, TAB_SETTINGS, TAB_REGISTRY].filter(
    t => !existingTabs.includes(t)
  );

  if (tabsToCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: tabsToCreate.map(title => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  // Write headers to Items tab
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_ITEMS}!A1:L1`,
    valueInputOption: 'RAW',
    requestBody: { values: [ITEM_HEADERS] },
  });

  // Write default settings
  await saveSettings(DEFAULT_SETTINGS);

  // Seed the vendor registry
  const seedVendors: [string, number][] = [
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
    ['Delart',1036],['GUARESS',1037],['Marrakesh',1037],
    ['Breezify',1060],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_REGISTRY}!A1:B${seedVendors.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: seedVendors.map(([n, c]) => [n, String(c)]) },
  });
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function safeParseJSON<T>(val: string, fallback: T): T {
  try { return JSON.parse(val); } catch { return fallback; }
}
