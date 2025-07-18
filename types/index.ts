export interface Customer {
  id: string;
  name: string;
  mobile: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  isActive: boolean;
  totalDues: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  unit: string; // 'L', 'kg', 'piece', etc.
  defaultPrice: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  frequency: 'daily' | 'alternate' | 'custom';
  customDays?: number[]; // Days of week (0-6, Sunday-Saturday) for custom schedule
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Delivery {
  id: string;
  customerId: string;
  productId: string;
  subscriptionId?: string; // Optional - for subscription-based deliveries
  quantity: number;
  price: number;
  date: Date;
  status: 'pending' | 'delivered' | 'missed' | 'cancelled';
  notes?: string;
  deliveredAt?: Date;
  amount: number;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  mode: 'cash' | 'upi' | 'card';
  date: Date;
  notes?: string;
  deliveryIds?: string[]; // Which deliveries this payment covers
}

export interface DeliveryRouteItem {
  customer: Customer;
  deliveries: (Delivery & { 
    product: Product;
  })[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'partial';
}

export type PaymentMode = 'cash' | 'upi' | 'card';
export type DeliveryStatus = 'pending' | 'delivered' | 'missed' | 'cancelled';
export type SubscriptionFrequency = 'daily' | 'alternate' | 'custom'; 