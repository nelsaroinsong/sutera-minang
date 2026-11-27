import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '../data/initialMenu';

const STORAGE_KEY_SESSION = 'SM_USER_SESSION';

const localOrderChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('sm_order_updates')
    : null;

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request gagal (${res.status})`);
  }
  return data as T;
}

// Legacy config helpers kept for compatibility with SupabaseModal if referenced
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  return { url: 'sqlite://database.sqlite', anonKey: 'local-sqlite' };
}

export function saveSupabaseConfig(_url: string, _anonKey: string): void {}

export function clearSupabaseConfig(): void {}

export function getSupabase(): any {
  return null;
}

// ==============================================================================
// 1. Authentication & Role Management (SQLite-backed)
// ==============================================================================

export function getStoredUserSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUserSession(profile: UserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(profile));
  }
}

export async function signUpCustomer(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<UserProfile> {
  const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  setStoredUserSession(user);
  return user;
}

export async function signInCustomer(
  email: string,
  password: string
): Promise<UserProfile> {
  const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredUserSession(user);
  return user;
}

export async function signInAdminPortal(
  email: string,
  password: string
): Promise<UserProfile> {
  const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/admin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredUserSession(user);
  return user;
}

export async function signOutAccount(): Promise<void> {
  setStoredUserSession(null);
}

export async function updateCustomerProfile(
  updated: UserProfile
): Promise<UserProfile> {
  const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
  setStoredUserSession(user);
  return user;
}

// ==============================================================================
// 2. Data Service (SQLite CRUD)
// ==============================================================================

export async function getCategories(): Promise<Category[]> {
  try {
    const { categories } = await apiRequest<{ categories: Category[] }>('/api/categories');
    if (categories && categories.length > 0) return categories;
  } catch (e) {
    console.warn('SQLite getCategories failed, using fallback:', e);
  }
  return INITIAL_CATEGORIES;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const { items } = await apiRequest<{ items: MenuItem[] }>('/api/menu-items');
    if (items && items.length > 0) return items;
  } catch (e) {
    console.warn('SQLite getMenuItems failed, using fallback:', e);
  }
  return INITIAL_MENU_ITEMS;
}

export async function createMenuItem(
  input: Omit<MenuItem, 'id'>
): Promise<MenuItem> {
  const { item } = await apiRequest<{ item: MenuItem }>('/api/menu-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  return item;
}

export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<MenuItem, 'id'>>
): Promise<void> {
  await apiRequest(`/api/menu-items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiRequest(`/api/menu-items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<void> {
  await updateMenuItem(id, { is_available: isAvailable });
}

export async function updateMenuItemPrice(
  id: string,
  newPrice: number
): Promise<void> {
  await updateMenuItem(id, { price: newPrice });
}

// Orders
export async function getOrders(): Promise<Order[]> {
  try {
    const { orders } = await apiRequest<{ orders: Order[] }>('/api/orders');
    return orders || [];
  } catch (e) {
    console.warn('SQLite getOrders failed:', e);
    return [];
  }
}

export async function createOrder(
  orderInput: Omit<Order, 'id' | 'order_code' | 'created_at'>
): Promise<Order> {
  const { order } = await apiRequest<{ order: Order }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderInput),
  });
  localOrderChannel?.postMessage({ type: 'ORDER_CREATED', order });
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  localOrderChannel?.postMessage({
    type: 'ORDER_STATUS_CHANGED',
    orderId,
    status,
  });
}

export async function updateOrderPayment(
  orderId: string,
  payment_status: 'paid' | 'unpaid',
  payment_method?: 'qris' | 'va' | 'card' | 'cash'
): Promise<void> {
  await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_status, payment_method }),
  });
  localOrderChannel?.postMessage({
    type: 'ORDER_UPDATED',
    orderId,
  });
}

export function subscribeToOrders(onUpdate: (payload?: any) => void): () => void {
  const handleBroadcast = (event: MessageEvent) => {
    onUpdate(event.data);
  };

  localOrderChannel?.addEventListener('message', handleBroadcast);

  return () => {
    localOrderChannel?.removeEventListener('message', handleBroadcast);
  };
}
