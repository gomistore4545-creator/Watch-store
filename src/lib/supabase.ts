import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Product = {
  id: string;
  name: string;
  detail: string | null;
  price: number;
  image_url: string | null;
  accent: 'aqua' | 'black' | 'cream';
  is_active: boolean;
  created_at: string;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
};

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
