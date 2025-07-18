import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug logging for environment variables
if (typeof window === 'undefined') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'delivery';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  lat: number;
  lng: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  price: number;
  frequency: 'daily' | 'alternate' | 'custom';
  custom_schedule?: number[];
  is_active: boolean;
  start_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  customer_id: string;
  subscription_id: string;
  product_id: string;
  date: string;
  status: 'pending' | 'delivered' | 'missed';
  amount: number;
  notes?: string;
  delivered_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  mode: 'cash' | 'upi' | 'card';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
} 