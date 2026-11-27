import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  UserProfile,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '../data/initialMenu';

const STORAGE_KEY_CONFIG = 'SM_SUPABASE_CONFIG';
const STORAGE_KEY_MENU = 'SM_MENU_ITEMS_LOCAL';
const STORAGE_KEY_ORDERS = 'SM_ORDERS_LOCAL';
const STORAGE_KEY_SESSION = 'SM_USER_SESSION';
const STORAGE_KEY_KNOWN_PROFILES = 'SM_KNOWN_PROFILES';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// 1. Config Management
export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage:', e);
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('placeholder')) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    STORAGE_KEY_CONFIG,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  supabaseInstance = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  supabaseInstance = null;
}

// 2. Client Initialization
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const config = getSupabaseConfig();
  if (config && config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return null;
}

const localOrderChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('sm_order_updates')
    : null;

// ==============================================================================
// 3. Authentication & Role Management (Pembeli vs Admin)
// ==============================================================================

function saveKnownProfile(profile: UserProfile) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KNOWN_PROFILES);
    const map: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
    map[profile.email.toLowerCase()] = profile;
    localStorage.setItem(STORAGE_KEY_KNOWN_PROFILES, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
}

function getKnownProfile(email: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KNOWN_PROFILES);
    if (!raw) return null;
    const map: Record<string, UserProfile> = JSON.parse(raw);
    return map[email.toLowerCase()] || null;
  } catch {
    return null;
  }
}

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
    saveKnownProfile(profile);
  }
}

export async function signUpCustomer(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<UserProfile> {
  const emailClean = input.email.trim().toLowerCase();
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error(
      'Konfigurasi Supabase belum diisi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.'
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: emailClean,
    password: input.password,
    options: {
      data: {
        full_name: input.full_name.trim(),
        phone: input.phone.trim(),
        role: 'user',
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('Email sudah terdaftar. Silakan masuk dengan akun Anda.');
    }
    throw new Error(error.message);
  }

  const userId = data?.user?.id || `usr_${Date.now()}`;
  const profile: UserProfile = {
    id: userId,
    email: emailClean,
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    role: 'user',
  };

  setStoredUserSession(profile);
  return profile;
}

export async function signInCustomer(
  email: string,
  password: string
): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error(
      'Konfigurasi Supabase belum diisi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailClean,
    password,
  });

  if (error) {
    if (
      error.code === 'email_not_confirmed' ||
      error.message.toLowerCase().includes('email not confirmed')
    ) {
      const known = getKnownProfile(emailClean);
      const derivedName =
        known?.full_name ||
        emailClean
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const profile: UserProfile = {
        id: known?.id || `usr_${emailClean}`,
        email: emailClean,
        full_name: derivedName,
        phone: known?.phone || '',
        role: 'user',
      };
      setStoredUserSession(profile);
      return profile;
    }

    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Email atau kata sandi salah. Silakan periksa kembali atau daftar akun baru.'
        : error.message
    );
  }

  if (data.user) {
    const meta = data.user.user_metadata || {};
    const known = getKnownProfile(emailClean);
    const profile: UserProfile = {
      id: data.user.id,
      email: emailClean,
      full_name:
        meta.full_name ||
        known?.full_name ||
        emailClean.split('@')[0],
      phone: meta.phone || known?.phone || '',
      role: 'user',
    };
    setStoredUserSession(profile);
    return profile;
  }

  throw new Error('Gagal melakukan autentikasi ke server Supabase.');
}

export async function signInAdminPortal(
  email: string,
  password: string
): Promise<UserProfile> {
  const emailClean = email.trim().toLowerCase();

  // 1. Default Built-in Restaurant Admin Credentials
  if (
    (emailClean === 'admin@suteraminang.com' ||
      emailClean === 'admin@padang.com') &&
    (password === 'admin123' || password === 'suteraminang123')
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

  // 2. Check Supabase Auth for Admin Role
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password,
    });

    if (!error && data.user) {
      const meta = data.user.user_metadata || {};
      if (meta.role === 'admin' || emailClean.includes('admin')) {
        const adminProfile: UserProfile = {
          id: data.user.id,
          email: emailClean,
          full_name: meta.full_name || 'Pengelola Sutera Minang',
          role: 'admin',
        };
        setStoredUserSession(adminProfile);
        return adminProfile;
      }
      throw new Error(
        'Akun ini terdaftar sebagai Pembeli, bukan Admin Rumah Makan.'
      );
    }
  }

  throw new Error(
    'Kredensial Admin tidak valid. Gunakan akun resmi Admin Rumah Makan.'
  );
}

export async function signOutAccount(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
  }
  setStoredUserSession(null);
}

export async function updateCustomerProfile(
  updated: UserProfile
): Promise<UserProfile> {
  const cleanProfile: UserProfile = {
    ...updated,
    full_name: updated.full_name.trim(),
    phone: updated.phone?.trim() || '',
    spice_preference: updated.spice_preference || 'normal',
    default_notes: updated.default_notes?.trim() || '',
  };

  setStoredUserSession(cleanProfile);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: cleanProfile.full_name,
          phone: cleanProfile.phone,
          spice_preference: cleanProfile.spice_preference,
          default_notes: cleanProfile.default_notes,
          role: cleanProfile.role,
        },
      });
    } catch (e) {
      console.warn('Supabase updateUser metadata warning:', e);
    }
  }

  return cleanProfile;
}

// ==============================================================================
// 4. Data Service (Supabase CRUD with Intelligent Fallback)
// ==============================================================================

export async function getCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase fetchCategories failed, using fallback:', e);
    }
  }
  return INITIAL_CATEGORIES;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('item_number', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase fetchMenuItems failed, using fallback:', e);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_MENU);
    if (local) return JSON.parse(local);
  } catch (e) {
    console.error(e);
  }

  return INITIAL_MENU_ITEMS;
}

export async function createMenuItem(
  input: Omit<MenuItem, 'id'>
): Promise<MenuItem> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_id: input.category_id,
        item_number: input.item_number,
        name: input.name,
        description: input.description,
        price: input.price,
        image_url: input.image_url || null,
        is_available: input.is_available,
        is_signature: Boolean(input.is_signature),
        badge: input.badge || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
    return data as MenuItem;
  }

  const newItem: MenuItem = {
    ...input,
    id: `m_${Date.now()}`,
  };
  const current = await getMenuItems();
  localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify([...current, newItem]));
  localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  return newItem;
}

export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<MenuItem, 'id'>>
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('menu_items')
      .update({
        category_id: updates.category_id,
        item_number: updates.item_number,
        name: updates.name,
        description: updates.description,
        price: updates.price,
        image_url: updates.image_url || null,
        is_available: updates.is_available,
        is_signature: updates.is_signature,
        badge: updates.badge || null,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  try {
    const current = await getMenuItems();
    const updated = current.map((it) =>
      it.id === id ? { ...it, ...updates } : it
    );
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (e) {
    console.error(e);
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  try {
    const current = await getMenuItems();
    const updated = current.filter((it) => it.id !== id);
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (e) {
    console.error(e);
  }
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', id);
    } catch (e) {
      console.error('Supabase toggleMenuItemAvailability error:', e);
    }
  }

  try {
    const currentItems = await getMenuItems();
    const updated = currentItems.map((item) =>
      item.id === id ? { ...item, is_available: isAvailable } : item
    );
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (e) {
    console.error(e);
  }
}

export async function updateMenuItemPrice(
  id: string,
  newPrice: number
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('menu_items')
        .update({ price: newPrice })
        .eq('id', id);
    } catch (e) {
      console.error('Supabase updateMenuItemPrice error:', e);
    }
  }

  try {
    const currentItems = await getMenuItems();
    const updated = currentItems.map((item) =>
      item.id === id ? { ...item, price: newPrice } : item
    );
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'MENU_UPDATED' });
  } catch (e) {
    console.error(e);
  }
}

// Orders
export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_code,
          order_type,
          table_number,
          customer_name,
          customer_phone,
          status,
          total_amount,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            menu_item_id,
            item_name,
            price,
            quantity,
            notes
          )
        `
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((o: any) => {
          const notesStr = o.notes || '';
          const isCashUnpaid = notesStr.includes('[METODE:TUNAI:UNPAID]');
          const isCashPaid = notesStr.includes('[METODE:TUNAI:PAID]');

          let paymentMethod: PaymentMethod = 'qris';
          let paymentStatus: PaymentStatus = 'paid';

          if (isCashUnpaid) {
            paymentMethod = 'cash';
            paymentStatus = 'unpaid';
          } else if (isCashPaid) {
            paymentMethod = 'cash';
            paymentStatus = 'paid';
          } else if (o.payment_method) {
            paymentMethod = o.payment_method;
            paymentStatus = o.payment_status || 'paid';
          }

          const cleanNotes = notesStr
            .replace(/\[METODE:TUNAI:(UNPAID|PAID)\]/g, '')
            .trim();

          return {
            ...o,
            notes: cleanNotes || null,
            payment_status: paymentStatus,
            payment_method: paymentMethod,
            items: (o.order_items || []).map((it: any) => ({
              id: it.id,
              menu_item_id: it.menu_item_id,
              item_name: it.item_name,
              price: it.price,
              quantity: it.quantity,
              notes: it.notes,
            })),
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getOrders failed, using fallback:', e);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (local) {
      const parsed = JSON.parse(local);
      return parsed.map((o: any) => {
        const notesStr = o.notes || '';
        const isCashUnpaid =
          notesStr.includes('[METODE:TUNAI:UNPAID]') ||
          o.payment_status === 'unpaid';
        const isCashPaid =
          notesStr.includes('[METODE:TUNAI:PAID]') ||
          (o.payment_method === 'cash' && o.payment_status === 'paid');

        let paymentMethod: PaymentMethod = o.payment_method || 'qris';
        let paymentStatus: PaymentStatus = o.payment_status || 'paid';

        if (isCashUnpaid) {
          paymentMethod = 'cash';
          paymentStatus = 'unpaid';
        } else if (isCashPaid) {
          paymentMethod = 'cash';
          paymentStatus = 'paid';
        }

        const cleanNotes = notesStr
          .replace(/\[METODE:TUNAI:(UNPAID|PAID)\]/g, '')
          .trim();

        return {
          ...o,
          notes: cleanNotes || null,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
        };
      });
    }
  } catch (e) {
    console.error(e);
  }

  return [];
}

export async function createOrder(
  orderInput: Omit<Order, 'id' | 'order_code' | 'created_at'>
): Promise<Order> {
  const orderCode = `SM-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const supabase = getSupabase();

  const isCash = orderInput.payment_method === 'cash';
  const isPaid = orderInput.payment_status === 'paid';
  let initialNotes = orderInput.notes || '';
  if (isCash) {
    const tag = isPaid ? '[METODE:TUNAI:PAID]' : '[METODE:TUNAI:UNPAID]';
    initialNotes = (initialNotes ? initialNotes + ' ' : '') + tag;
  }

  if (supabase) {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          order_type: orderInput.order_type,
          table_number: orderInput.table_number || null,
          customer_name: orderInput.customer_name,
          customer_phone: orderInput.customer_phone || null,
          status: 'pending',
          total_amount: orderInput.total_amount,
          notes: initialNotes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData && orderInput.items.length > 0) {
        const itemsToInsert = orderInput.items.map((it) => ({
          order_id: orderData.id,
          menu_item_id: it.menu_item_id || null,
          item_name: it.item_name,
          price: it.price,
          quantity: it.quantity,
          notes: it.notes || null,
        }));

        await supabase.from('order_items').insert(itemsToInsert);
      }

      const fullOrder: Order = {
        ...orderData,
        notes: orderInput.notes || null,
        payment_method: orderInput.payment_method || (isCash ? 'cash' : 'qris'),
        payment_status: orderInput.payment_status || (isCash ? 'unpaid' : 'paid'),
        items: orderInput.items,
      };

      localOrderChannel?.postMessage({
        type: 'ORDER_CREATED',
        order: fullOrder,
      });
      return fullOrder;
    } catch (e) {
      console.warn('Supabase createOrder failed, falling back to local:', e);
    }
  }

  const newOrder: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    order_code: orderCode,
    order_type: orderInput.order_type,
    table_number: orderInput.table_number,
    customer_name: orderInput.customer_name,
    customer_phone: orderInput.customer_phone,
    status: 'pending',
    payment_method: orderInput.payment_method || (isCash ? 'cash' : 'qris'),
    payment_status: orderInput.payment_status || (isCash ? 'unpaid' : 'paid'),
    total_amount: orderInput.total_amount,
    notes: orderInput.notes,
    created_at: now,
    items: orderInput.items,
  };

  try {
    const existing = await getOrders();
    const updated = [newOrder, ...existing];
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    localOrderChannel?.postMessage({ type: 'ORDER_CREATED', order: newOrder });
  } catch (e) {
    console.error(e);
  }

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      await supabase
        .from('orders')
        .update({ status, updated_at: now })
        .eq('id', orderId);
    } catch (e) {
      console.error('Supabase updateOrderStatus error:', e);
    }
  }

  try {
    const orders = await getOrders();
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status, updated_at: now } : o
    );
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    localOrderChannel?.postMessage({
      type: 'ORDER_STATUS_CHANGED',
      orderId,
      status,
    });
  } catch (e) {
    console.error(e);
  }
}

export async function updateOrderPayment(
  orderId: string,
  payment_status: 'paid' | 'unpaid',
  payment_method?: 'qris' | 'va' | 'card' | 'cash'
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('notes')
        .eq('id', orderId)
        .single();

      let updatedNotes = currentOrder?.notes || '';
      updatedNotes = updatedNotes
        .replace(/\[METODE:TUNAI:(UNPAID|PAID)\]/g, '')
        .trim();

      if (payment_status === 'paid') {
        updatedNotes =
          (updatedNotes ? updatedNotes + ' ' : '') + '[METODE:TUNAI:PAID]';
      } else {
        updatedNotes =
          (updatedNotes ? updatedNotes + ' ' : '') + '[METODE:TUNAI:UNPAID]';
      }

      await supabase
        .from('orders')
        .update({
          notes: updatedNotes || null,
          updated_at: now,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase updateOrderPayment warning:', e);
    }
  }

  try {
    const orders = await getOrders();
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status,
          payment_method: payment_method || o.payment_method || 'cash',
          updated_at: now,
        };
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    localOrderChannel?.postMessage({
      type: 'ORDER_UPDATED',
      orderId,
    });
  } catch (e) {
    console.error(e);
  }
}

export function subscribeToOrders(onUpdate: (payload?: any) => void): () => void {
  const supabase = getSupabase();
  let supabaseChannel: any = null;

  if (supabase) {
    try {
      supabaseChannel = supabase
        .channel('public:orders_and_menu')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            onUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload) => {
            onUpdate(payload);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription failed:', e);
    }
  }

  const handleBroadcast = (event: MessageEvent) => {
    onUpdate(event.data);
  };

  localOrderChannel?.addEventListener('message', handleBroadcast);

  return () => {
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
    localOrderChannel?.removeEventListener('message', handleBroadcast);
  };
}
