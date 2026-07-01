// src/lib/types.ts

export type ItemStatus = 'pending' | 'approved' | 'flagged';
export type OrderStatus = 'open' | 'submitted' | 'imported';

export interface Worker {
  id: string;
  name: string;
  pin: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  workerId?: string;
  vendor: string;
  code: string;
  category: string;
  colors: string[];
  sizes: string[];
  price: number;
  qty: number;
  notes: string;
  ownerNote: string;
  status: ItemStatus;
  photo?: string;      // base64 image
  createdAt: string;
}

export type OrderType = 'store' | 'online';

export interface Order {
  id: string;
  name: string;
  startDate: string;
  workerId: string;
  workerName: string;
  status: OrderStatus;
  shippingCost: number;
  workerCommission: number;
  commissionPaid: boolean;
  orderType: OrderType;
  totalOrderCost: number;
  createdAt: string;
  closedAt: string;
  itemCount: number;
  totalValue: number;
}

export interface UsageData {
  vendors: Record<string, number>;      // vendor name -> use count
  categories: Record<string, number>;   // category -> use count
  colors: Record<string, number>;       // color -> use count
  sizes: Record<string, number>;        // size -> use count
}

export interface SessionSettings {
  tax: number;
  markup: number;
  shipping: number;
  ownerPin: string;
}

// For offline queue
export interface QueuedItem {
  tempId: string;
  orderId: string;
  workerId: string;
  vendor: string;
  code: string;
  category: string;
  colors: string[];
  sizes: string[];
  price: number;
  qty: number;
  notes: string;
  photo?: string;
  queuedAt: string;
}
