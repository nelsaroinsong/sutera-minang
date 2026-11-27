import { useState, useEffect } from 'react';
import {
  Category,
  MenuItem,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  UserProfile,
} from './types';
import {
  getCategories,
  getMenuItems,
  getOrders,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  toggleMenuItemAvailability,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  subscribeToOrders,
  getStoredUserSession,
  signOutAccount,
  updateCustomerProfile,
} from './lib/supabase';
import { Navbar, CustomerTab } from './components/Navbar';
import { CustomerView } from './components/CustomerView';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { ItemDetailPage } from './components/ItemDetailPage';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { PaymentPage } from './components/PaymentPage';
import { PaymentReceiptPage } from './components/PaymentReceiptPage';
import { PendingPaymentOrder } from './components/PaymentModal';
import { AuthPage } from './components/AuthPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    getStoredUserSession()
  );
  const [customerSubTab, setCustomerSubTab] = useState<CustomerTab>('menu');

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] =
    useState<MenuItem | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Dedicated Payment & Receipt States
  const [pendingPaymentOrder, setPendingPaymentOrder] =
    useState<PendingPaymentOrder | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] =
    useState<Order | null>(null);

  const loadData = async () => {
    try {
      const [cats, items, ords] = await Promise.all([
        getCategories(),
        getMenuItems(),
        getOrders(),
      ]);
      setCategories(cats);
      setMenuItems(items);
      setOrders(ords);

      const savedActiveOrderId = localStorage.getItem('SM_ACTIVE_ORDER_ID');
      if (savedActiveOrderId) {
        const found = ords.find((o) => o.id === savedActiveOrderId);
        if (found) setActiveOrder(found);
      }
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    }
  };

  useEffect(() => {
    loadData();

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const syncOrdersAndMenu = async () => {
      try {
        const [updatedOrders, updatedMenu] = await Promise.all([
          getOrders(),
          getMenuItems(),
        ]);
        setOrders(updatedOrders);
        setMenuItems(updatedMenu);

        const savedActiveOrderId = localStorage.getItem('SM_ACTIVE_ORDER_ID');
        if (savedActiveOrderId) {
          const found = updatedOrders.find((o) => o.id === savedActiveOrderId);
          if (found) setActiveOrder(found);
        }

        setActiveReceiptOrder((prev) =>
          prev ? updatedOrders.find((o) => o.id === prev.id) || prev : null
        );
      } catch (err) {
        console.warn('Realtime sync error:', err);
      }
    };

    const unsubscribe = subscribeToOrders(() => {
      // Small debounce so orders + order_items inserts settle together
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(syncOrdersAndMenu, 150);
    });

    // Fallback polling & focus sync in case WebSocket Realtime is unavailable
    const pollInterval = setInterval(syncOrdersAndMenu, 4000);
    const handleFocus = () => {
      syncOrdersAndMenu();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOutAccount();
    setCurrentUser(null);
    setCart([]);
    setCustomerSubTab('menu');
  };

  const handleUpdateUserProfile = async (updated: UserProfile) => {
    const saved = await updateCustomerProfile(updated);
    setCurrentUser(saved);
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menu_item: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menu_item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menu_item.id !== itemId));
  };

  const handleDetailConfirm = (
    item: MenuItem,
    quantity: number,
    notes: string
  ) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item.id === item.id
            ? {
                ...c,
                quantity: c.quantity + quantity,
                notes: notes || c.notes,
              }
            : c
        );
      }
      return [...prev, { menu_item: item, quantity, notes }];
    });
  };

  // Submit order to database & update state
  const handleSubmitOrder = async (orderInput: any): Promise<Order> => {
    const created = await createOrder(orderInput);
    setOrders((prev) => [created, ...prev]);
    setActiveOrder(created);
    localStorage.setItem('SM_ACTIVE_ORDER_ID', created.id);
    setCart([]);
    return created;
  };

  // Switch to dedicated Payment Page from Cart Drawer
  const handleProceedToPayment = (pending: PendingPaymentOrder) => {
    setPendingPaymentOrder(pending);
    setActiveReceiptOrder(null);
    setCustomerSubTab('payment');
  };

  // Switch to dedicated Bukti Pembayaran (Receipt) Page
  const handleOpenReceiptForOrder = (order: Order) => {
    setActiveReceiptOrder(order);
    setCustomerSubTab('receipt');
  };

  // When payment succeeds on PaymentPage, transition directly to PaymentReceiptPage
  const handlePaymentSuccess = (
    method: PaymentMethod,
    confirmed: Order
  ) => {
    const enrichedOrder: Order = {
      ...confirmed,
      payment_method: method,
      payment_status: method === 'cash' ? 'unpaid' : 'paid',
    };
    setOrders((prev) => [
      enrichedOrder,
      ...prev.filter((o) => o.id !== confirmed.id),
    ]);
    setActiveOrder(enrichedOrder);
    setActiveReceiptOrder(enrichedOrder);
    setCart([]);
    setPendingPaymentOrder(null);
    setCustomerSubTab('receipt');
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    status: 'paid' | 'unpaid'
  ) => {
    await updateOrderPayment(orderId, status, 'cash');
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, payment_status: status, payment_method: o.payment_method || 'cash' }
          : o
      )
    );
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleToggleAvailability = async (
    itemId: string,
    isAvailable: boolean
  ) => {
    await toggleMenuItemAvailability(itemId, isAvailable);
    setMenuItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, is_available: isAvailable } : it
      )
    );
  };

  const handleCreateMenuItem = async (input: Omit<MenuItem, 'id'>) => {
    const created = await createMenuItem(input);
    setMenuItems((prev) => [...prev, created]);
  };

  const handleUpdateMenuItem = async (
    id: string,
    updates: Partial<Omit<MenuItem, 'id'>>
  ) => {
    await updateMenuItem(id, updates);
    setMenuItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleDeleteMenuItem = async (id: string) => {
    await deleteMenuItem(id);
    setMenuItems((prev) => prev.filter((it) => it.id !== id));
  };

  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          loadData();
        }}
      />
    );
  }

  const myCustomerOrders = orders.filter(
    (o) =>
      o.customer_name.toLowerCase() === currentUser.full_name.toLowerCase() ||
      o.id === localStorage.getItem('SM_ACTIVE_ORDER_ID')
  );

  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const cartTotal = cart.reduce(
    (acc, c) => acc + c.menu_item.price * c.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#261C14] flex flex-col">
      <Navbar
        user={currentUser}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrder={activeOrder}
        onOpenOrderTracker={() => setIsTrackerOpen(true)}
        customerSubTab={customerSubTab}
        onChangeCustomerSubTab={setCustomerSubTab}
        myOrdersCount={myCustomerOrders.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
        {currentUser.role === 'user' ? (
          customerSubTab === 'item-detail' && selectedItemForModal ? (
            <ItemDetailPage
              item={selectedItemForModal}
              onBackToMenu={() => setCustomerSubTab('menu')}
              onConfirmAddToCart={handleDetailConfirm}
              onOpenCart={() => setIsCartOpen(true)}
              currentCartCount={
                cart.find((c) => c.menu_item.id === selectedItemForModal.id)
                  ?.quantity || 0
              }
            />
          ) : customerSubTab === 'payment' && pendingPaymentOrder ? (
            <PaymentPage
              pendingOrder={pendingPaymentOrder}
              existingOrder={null}
              onPaymentSuccess={handlePaymentSuccess}
              onProcessOrder={handleSubmitOrder}
              onBackToMenu={() => setCustomerSubTab('menu')}
            />
          ) : customerSubTab === 'receipt' && activeReceiptOrder ? (
            <PaymentReceiptPage
              order={activeReceiptOrder}
              onTrackOrder={(order) => {
                setActiveOrder(order);
                setIsTrackerOpen(true);
              }}
              onBackToMenu={() => setCustomerSubTab('menu')}
            />
          ) : (
            <CustomerView
              user={currentUser}
              subTab={
                customerSubTab === 'payment' ||
                customerSubTab === 'receipt' ||
                customerSubTab === 'item-detail'
                  ? 'menu'
                  : customerSubTab
              }
              onChangeSubTab={setCustomerSubTab}
              categories={categories}
              menuItems={menuItems}
              cart={cart}
              myOrders={myCustomerOrders}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onClickDetail={(item) => {
                setSelectedItemForModal(item);
                setCustomerSubTab('item-detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCart={() => setIsCartOpen(true)}
              onSelectOrderToTrack={(order) => {
                setActiveOrder(order);
                setIsTrackerOpen(true);
              }}
              onOpenPaymentForOrder={handleOpenReceiptForOrder}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          )
        ) : (
          <AdminDashboard
            categories={categories}
            orders={orders}
            menuItems={menuItems}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onToggleAvailability={handleToggleAvailability}
            onCreateMenuItem={handleCreateMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToPayment={handleProceedToPayment}
      />

      <OrderTrackerModal
        order={activeOrder}
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
}

export default App;
