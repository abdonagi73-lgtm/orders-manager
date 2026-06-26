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
  totalOrderCost: number;
  createdAt: string;
  closedAt: string;
  itemCount: number;
  totalValue: number;
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
