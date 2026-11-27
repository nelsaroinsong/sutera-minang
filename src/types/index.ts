export type OrderType = 'dine_in' | 'takeaway';

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'qris' | 'va' | 'card' | 'cash';

export type PaymentStatus = 'unpaid' | 'paid';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  spice_preference?: string;
  default_notes?: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  display_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  item_number: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  is_signature?: boolean;
  badge?: string | null;
  image_url?: string;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  notes: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  item_name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_code: string;
  order_type: OrderType;
  table_number?: string;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}
