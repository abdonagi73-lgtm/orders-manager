// src/lib/types.ts

export type ItemStatus = 'pending' | 'approved' | 'flagged';

export interface OrderItem {
  id: string;
  vendor: string;
  code: string;
  category: string;
  colors: string[];   // ["Black", "White", "Navy blue"]
  sizes: string[];    // ["S","M","L","XL"] or ["30","31","32"]
  price: number;      // unit purchase price in USD
  qty: number;        // quantity per color/size pack
  notes: string;      // worker note
  ownerNote: string;  // owner flag note back to worker
  status: ItemStatus;
  createdAt: string;  // ISO timestamp
}

export interface SessionSettings {
  tax: number;        // e.g. 6 (percent)
  markup: number;     // e.g. 3.5 (multiplier)
  shipping: number;   // e.g. 6.10 (USD per kg)
  ownerPin: string;   // stored per session so owner can change it
}

export interface Session {
  id: string;
  name: string;       // e.g. "Spring 2025 Turkey Order"
  createdAt: string;
  settings: SessionSettings;
  items: OrderItem[];
}

// Google Sheets row shape for the Items tab
export interface SheetItemRow {
  id: string;
  vendor: string;
  code: string;
  category: string;
  colors: string;     // JSON stringified
  sizes: string;      // JSON stringified
  price: string;
  qty: string;
  notes: string;
  ownerNote: string;
  status: ItemStatus;
  createdAt: string;
}
