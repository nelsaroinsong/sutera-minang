import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '../data/initialMenu';

const STORAGE_KEY_SESSION = 'SM_USER_SESSION';
const STORAGE_KEY_USERS = 'SM_LOCAL_USERS';
const STORAGE_KEY_MENU = 'SM_MENU_ITEMS_LOCAL';
const STORAGE_KEY_ORDERS = 'SM_ORDERS_LOCAL';

const localOrderChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('sm_order_updates')
    : null;

class ApiUnavailableError extends Error {
  constructor() {
    super('Backend API tidak tersedia');
    this.name = 'ApiUnavailableError';
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new ApiUnavailableError();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // On static hosts like Vercel, /api/* returns 404 without our JSON error payload
    if (res.status === 404 && !data.error) {
      throw new ApiUnavailableError();
    }
    throw new Error(data.error || `Request gagal (${res.status})`);
  }
  return data as T;
}

// LocalStorage helpers for static/Vercel fallback
interface LocalUserRecord extends UserProfile {
  password: string;
}

function getLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUserRecord[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function stripPassword(record: LocalUserRecord): UserProfile {
  const { password: _password, ...profile } = record;
  return profile;
}

function getLocalMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MENU);
    if (raw) return JSON.parse(raw) as MenuItem[];
  } catch {
    // ignore parse error
  }
  return INITIAL_MENU_ITEMS;
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
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
// 1. Authentication & Role Management (SQLite locally, localStorage on Vercel)
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
  const emailClean = input.email.trim().toLowerCase();
  const fullNameClean = input.full_name.trim();
  const phoneClean = input.phone.trim();

  try {
    const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setStoredUserSession(user);
    return user;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    if (!emailClean || !input.password || !fullNameClean) {
      throw new Error('Nama lengkap, email, dan kata sandi wajib diisi.');
    }
    if (input.password.length < 6) {
      throw new Error('Kata sandi minimal 6 karakter.');
    }

    const users = getLocalUsers();
    if (users.some((u) => u.email.toLowerCase() === emailClean)) {
      throw new Error('Email sudah terdaftar. Silakan masuk dengan akun Anda.');
    }

    const newRecord: LocalUserRecord = {
      id: `usr_${Date.now()}`,
      email: emailClean,
      password: input.password,
      full_name: fullNameClean,
      phone: phoneClean,
      spice_preference: 'normal',
      default_notes: '',
      role: 'user',
    };
    saveLocalUsers([...users, newRecord]);

    const profile = stripPassword(newRecord);
    setStoredUserSession(profile);
    return profile;
  }
}

export async function signInCustomer(
  email: string,
  password: string
): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();

  try {
    const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredUserSession(user);
    return user;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    if (
      emailClean === 'admin@suteraminang.com' ||
      emailClean === 'admin@padang.com'
    ) {
      throw new Error(
        'Akun ini adalah akun Admin. Silakan masuk melalui Portal Admin.'
      );
    }

    const users = getLocalUsers();
    const matched = users.find(
      (u) => u.email.toLowerCase() === emailClean && u.password === password
    );
    if (!matched) {
      throw new Error(
        'Email atau kata sandi salah. Silakan periksa kembali atau daftar akun baru.'
      );
    }

    const profile = stripPassword(matched);
    setStoredUserSession(profile);
    return profile;
  }
}

export async function signInAdminPortal(
  email: string,
  password: string
): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();

  try {
    const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/admin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredUserSession(user);
    return user;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    if (
      (emailClean === 'admin@suteraminang.com' && password === 'admin123') ||
      (emailClean === 'admin@padang.com' && password === 'suteraminang123')
    ) {
      const adminProfile: UserProfile = {
        id: 'admin_master_01',
        email: emailClean,
        full_name: 'Administrator Sutera Minang',
        role: 'admin',
      };
      setStoredUserSession(adminProfile);
      return adminProfile;
    }

    throw new Error(
      'Kredensial Admin tidak valid. Gunakan akun resmi Admin Rumah Makan.'
    );
  }
}

export async function signOutAccount(): Promise<void> {
  setStoredUserSession(null);
}

export async function updateCustomerProfile(
  updated: UserProfile
): Promise<UserProfile> {
  try {
    const { user } = await apiRequest<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    setStoredUserSession(user);
    return user;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const cleanProfile: UserProfile = {
      ...updated,
      full_name: updated.full_name.trim(),
      phone: updated.phone?.trim() || '',
      spice_preference: updated.spice_preference || 'normal',
      default_notes: updated.default_notes?.trim() || '',
    };

    const users = getLocalUsers();
    const nextUsers = users.map((u) =>
      u.id === cleanProfile.id ? { ...u, ...cleanProfile } : u
    );
    saveLocalUsers(nextUsers);
    setStoredUserSession(cleanProfile);
    return cleanProfile;
  }
}

// ==============================================================================
// 2. Data Service (SQLite locally, localStorage on Vercel)
// ==============================================================================

export async function getCategories(): Promise<Category[]> {
  try {
    const { categories } = await apiRequest<{ categories: Category[] }>(
      '/api/categories'
    );
    if (categories && categories.length > 0) return categories;
  } catch {
    // fallback below
  }
  return INITIAL_CATEGORIES;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const { items } = await apiRequest<{ items: MenuItem[] }>('/api/menu-items');
    if (items && items.length > 0) return items;
  } catch {
    // fallback below
  }
  return getLocalMenuItems();
}

export async function createMenuItem(
  input: Omit<MenuItem, 'id'>
): Promise<MenuItem> {
  try {
    const { item } = await apiRequest<{ item: MenuItem }>('/api/menu-items', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
    return item;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const newItem: MenuItem = { ...input, id: `m_${Date.now()}` };
    const current = getLocalMenuItems();
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify([...current, newItem]));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
    return newItem;
  }
}

export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<MenuItem, 'id'>>
): Promise<void> {
  try {
    await apiRequest(`/api/menu-items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const current = getLocalMenuItems();
    const updated = current.map((it) => (it.id === id ? { ...it, ...updates } : it));
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await apiRequest(`/api/menu-items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const current = getLocalMenuItems();
    const updated = current.filter((it) => it.id !== id);
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  }
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
  } catch {
    return getLocalOrders();
  }
}

export async function createOrder(
  orderInput: Omit<Order, 'id' | 'order_code' | 'created_at'>
): Promise<Order> {
  try {
    const { order } = await apiRequest<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderInput),
    });
    localOrderChannel?.postMessage({ type: 'ORDER_CREATED', order });
    return order;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const isCash = orderInput.payment_method === 'cash';
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order_code: `SM-${Math.floor(1000 + Math.random() * 9000)}`,
      order_type: orderInput.order_type,
      table_number: orderInput.table_number,
      customer_name: orderInput.customer_name,
      customer_phone: orderInput.customer_phone,
      status: 'pending',
      payment_method: orderInput.payment_method || (isCash ? 'cash' : 'qris'),
      payment_status: orderInput.payment_status || (isCash ? 'unpaid' : 'paid'),
      total_amount: orderInput.total_amount,
      notes: orderInput.notes,
      created_at: new Date().toISOString(),
      items: orderInput.items,
    };
    const existing = getLocalOrders();
    localStorage.setItem(
      STORAGE_KEY_ORDERS,
      JSON.stringify([newOrder, ...existing])
    );
    localOrderChannel?.postMessage({ type: 'ORDER_CREATED', order: newOrder });
    return newOrder;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    localOrderChannel?.postMessage({
      type: 'ORDER_STATUS_CHANGED',
      orderId,
      status,
    });
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const now = new Date().toISOString();
    const updated = getLocalOrders().map((o) =>
      o.id === orderId ? { ...o, status, updated_at: now } : o
    );
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    localOrderChannel?.postMessage({
      type: 'ORDER_STATUS_CHANGED',
      orderId,
      status,
    });
  }
}

export async function updateOrderPayment(
  orderId: string,
  payment_status: 'paid' | 'unpaid',
  payment_method?: 'qris' | 'va' | 'card' | 'cash'
): Promise<void> {
  try {
    await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status, payment_method }),
    });
    localOrderChannel?.postMessage({
      type: 'ORDER_UPDATED',
      orderId,
    });
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const now = new Date().toISOString();
    const updated = getLocalOrders().map((o) =>
      o.id === orderId
        ? {
            ...o,
            payment_status,
            payment_method: payment_method || o.payment_method || 'cash',
            updated_at: now,
          }
        : o
    );
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    localOrderChannel?.postMessage({
      type: 'ORDER_UPDATED',
      orderId,
    });
  }
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
