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
  workerCommission: number;  // 3% of totalValue (excluding shipping)
  totalOrderCost: number;    // totalValue + shippingCost + workerCommission
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
