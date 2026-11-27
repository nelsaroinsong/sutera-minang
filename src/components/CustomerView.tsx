import React, { useState, useEffect } from 'react';
import {
  Category,
  MenuItem,
  CartItem,
  Order,
  UserProfile,
} from '../types';
import { CustomerTab } from './Navbar';
import { MenuCard } from './MenuCard';
import {
  Search,
  ShoppingBag,
  Clock,
  ArrowRight,
  X,
  User,
  Phone,
  Mail,
  Save,
  CheckCircle2,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface CustomerViewProps {
  user: UserProfile;
  subTab: CustomerTab;
  onChangeSubTab: (tab: CustomerTab) => void;
  categories: Category[];
  menuItems: MenuItem[];
  cart: CartItem[];
  myOrders: Order[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClickDetail: (item: MenuItem) => void;
  onOpenCart: () => void;
  onSelectOrderToTrack: (order: Order) => void;
  onOpenPaymentForOrder?: (order: Order) => void;
  onUpdateUserProfile: (updated: UserProfile) => Promise<void>;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  user,
  subTab,
  onChangeSubTab,
  categories,
  menuItems,
  cart,
  myOrders,
  onAddToCart,
  onUpdateQuantity,
  onClickDetail,
  onOpenCart,
  onSelectOrderToTrack,
  onOpenPaymentForOrder,
  onUpdateUserProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Profile Form State
  const [profName, setProfName] = useState(user.full_name || '');
  const [profPhone, setProfPhone] = useState(user.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  useEffect(() => {
    setProfName(user.full_name || '');
    setProfPhone(user.phone || '');
  }, [user]);

  const cartTotalCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const cartTotalPrice = cart.reduce(
    (acc, c) => acc + c.menu_item.price * c.quantity,
    0
  );

  // Separate Makanan Utama & Minuman Tradisional
  const foodCat = categories.find((c) => c.slug === 'makanan-utama');
  const drinkCat = categories.find((c) => c.slug === 'minuman-tradisional');

  const matchesSearch = (item: MenuItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  };

  const foodItems = menuItems.filter(
    (it) =>
      (it.category_id === foodCat?.id || it.category_id === 'c1') &&
      matchesSearch(it)
  );

  const drinkItems = menuItems.filter(
    (it) =>
      (it.category_id === drinkCat?.id || it.category_id === 'c2') &&
      matchesSearch(it)
  );

  const signatureDrinks = drinkItems.filter(
    (it) => it.is_signature || it.item_number <= 2
  );
  const regularDrinks = drinkItems.filter(
    (it) => !signatureDrinks.some((s) => s.id === it.id)
  );

  const getCartCount = (id: string) =>
    cart.find((c) => c.menu_item.id === id)?.quantity || 0;

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Menunggu Konfirmasi',
          tone: 'text-[#8C5E14] border-[#C89D42]/45 bg-[#FDF6E7]',
        };
      case 'cooking':
        return {
          text: 'Sedang Dimasak',
          tone: 'text-[#4A331F] border-[#B89040]/60 bg-[#F9EFD8] font-semibold',
        };
      case 'ready':
        return {
          text: 'Siap Disajikan',
          tone: 'text-[#FFFDF9] border-[#2E6B47] bg-[#2E6B47] font-bold',
        };
      case 'completed':
        return {
          text: 'Selesai',
          tone: 'text-[#5C4D40] border-[#D9CEBE] bg-[#F3ECE2]',
        };
      case 'cancelled':
        return {
          text: 'Dibatalkan',
          tone: 'text-[#A63429] border-[#E8B4AE] bg-[#FDF1F0]',
        };
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) return;
    setSavingProfile(true);
    try {
      await onUpdateUserProfile({
        ...user,
        full_name: profName.trim(),
        phone: profPhone.trim(),
      });
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const totalSpent = myOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total_amount, 0);

  return (
    <div className="pb-24">
      {/* =================================================================== */}
      {/* VIEW 1: KATALOG MENU BERGAMBAR                                      */}
      {/* =================================================================== */}
      {subTab === 'menu' && (
        <div className="space-y-5">
          {/* Category Tabs & Search Toolbar */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E5DCCB] p-2.5 sm:p-3 shadow-xs">
            {/* Category Tabs + Search Input */}
            <search className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div
                role="group"
                aria-label="Filter Kategori Menu"
                className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
              >
                {[
                  {
                    key: 'all',
                    label: `Semua Hidangan (${menuItems.length})`,
                  },
                  {
                    key: 'makanan-utama',
                    label: `Makanan Utama (${foodItems.length})`,
                  },
                  {
                    key: 'minuman-tradisional',
                    label: `Minuman Tradisional (${drinkItems.length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === tab.key
                        ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold shadow-2xs'
                        : 'bg-[#FAF6F0] text-[#5C4D40] hover:text-[#261C14] hover:bg-[#F3ECE2] border border-[#E5DCCB]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#8A7968] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Rendang, Teh Talua, Ayam Pop..."
                  spellCheck={false}
                  className="sm-input !py-1.5 !pl-8 !pr-7 !min-h-0 h-8.5 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A7968] hover:text-[#261C14]"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </search>
          </div>

          {/* =============================================================== */}
          {/* SECTION I: MAKANAN UTAMA                                        */}
          {/* =============================================================== */}
          {(selectedCategory === 'all' ||
            selectedCategory === 'makanan-utama') && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D6C1]">
                <div className="flex items-center gap-2">
                  <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#261C14] tracking-wide uppercase">
                    Makanan Utama
                  </h2>
                  <span className="text-[11px] font-bold text-[#8C6518] bg-[#FDF6E4] border border-[#E5D4A7] px-2 py-0.5 rounded-full tabular-nums">
                    {foodItems.length} Hidangan
                  </span>
                </div>
                <span className="text-[11px] text-[#8A7968] font-medium hidden sm:inline">
                  Tradisi Pusaka Minang
                </span>
              </div>

              {foodItems.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-xl border border-[#E5DCCB] p-8 text-center">
                  <p className="text-xs text-[#8A7968] italic">
                    Tidak ada makanan utama yang sesuai pencarian &ldquo;
                    {searchQuery}&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {foodItems.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      cartCount={getCartCount(item.id)}
                      onAddToCart={onAddToCart}
                      onUpdateQuantity={onUpdateQuantity}
                      onClickDetail={onClickDetail}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* =============================================================== */}
          {/* SECTION II: MINUMAN TRADISIONAL                                 */}
          {/* =============================================================== */}
          {(selectedCategory === 'all' ||
            selectedCategory === 'minuman-tradisional') && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D6C1]">
                <div className="flex items-center gap-2">
                  <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#261C14] tracking-wide uppercase">
                    Minuman Tradisional
                  </h2>
                  <span className="text-[11px] font-bold text-[#8C6518] bg-[#FDF6E4] border border-[#E5D4A7] px-2 py-0.5 rounded-full tabular-nums">
                    {drinkItems.length} Minuman
                  </span>
                </div>
                <span className="text-[11px] text-[#8A7968] font-medium hidden sm:inline">
                  Koleksi Penyejuk Ranah
                </span>
              </div>

              {/* Signature Delicacy Highlight Box */}
              {signatureDrinks.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-[#C89D42]/45 bg-[#FDF9F0] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-[0.14em] uppercase bg-[#4A331F] text-[#F5DEB3]">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      Signature Delicacy
                    </span>
                    <span className="text-xs text-[#7D5A14] font-medium">
                      Khas Bukittinggi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signatureDrinks.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        cartCount={getCartCount(item.id)}
                        onAddToCart={onAddToCart}
                        onUpdateQuantity={onUpdateQuantity}
                        onClickDetail={onClickDetail}
                        isHighlighted
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Drinks Grid */}
              {regularDrinks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regularDrinks.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      cartCount={getCartCount(item.id)}
                      onAddToCart={onAddToCart}
                      onUpdateQuantity={onUpdateQuantity}
                      onClickDetail={onClickDetail}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: RIWAYAT & STATUS PESANAN SAYA                               */}
      {/* =================================================================== */}
      {subTab === 'my-orders' && (
        <section className="sm-menu-frame rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5DCCB]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6F18]">
                Pemantauan Dapur Langsung
              </span>
              <h2 className="font-cinzel text-lg font-bold text-[#261C14] tracking-wider uppercase">
                Status &amp; Riwayat Pesanan Saya
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onChangeSubTab('menu')}
              className="sm-btn-secondary self-start sm:self-center"
            >
              <span>Tambah Pesanan Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-12 bg-[#FAF6F0] rounded-xl border border-[#E5DCCB]">
              <p className="font-serif-menu text-lg font-bold text-[#261C14]">
                Belum ada pesanan aktif
              </p>
              <p className="text-xs text-[#6B5A4B] mt-1 mb-4">
                Silakan pilih hidangan dari Katalog Menu untuk mulai memesan.
              </p>
              <button
                type="button"
                onClick={() => onChangeSubTab('menu')}
                className="sm-btn-primary"
              >
                <span>Jelajahi Katalog Menu</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOrders.map((order) => {
                const st = getStatusLabel(order.status);
                const methodStr = (order.payment_method || 'qris').toUpperCase();
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-[#FAF6F0] border border-[#DFD3C0] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#E5DCCB]">
                        <div className="flex items-center gap-2">
                          <span className="font-serif-menu text-base font-bold text-[#261C14] tabular-nums">
                            {order.order_code}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#FFFFFF] text-[#4A331F] border border-[#D9CEBE]">
                            {order.order_type === 'dine_in'
                              ? order.table_number || 'Dine-In'
                              : 'Bungkus'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              order.payment_status === 'paid'
                                ? 'bg-[#EDF7F1] text-[#2E6B47] border-[#B7DFC5]'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {order.payment_status === 'paid'
                              ? `Lunas • ${methodStr}`
                              : 'Menunggu Uang Tunai di Kasir'}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-md border ${st.tone}`}
                        >
                          {st.text}
                        </span>
                      </div>

                      {order.payment_status !== 'paid' && (
                        <div className="mb-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>
                            Silakan serahkan uang tunai Rp {order.total_amount.toLocaleString('id-ID')} ke kasir / pelayan meja. Koki akan mulai memasak segera setelah uang diterima.
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span className="text-[#4A3B2F]">
                              <strong className="text-[#261C14] tabular-nums">
                                {it.quantity}x
                              </strong>{' '}
                              {it.item_name}
                              {it.notes && (
                                <span className="text-[#8C6518] italic ml-1">
                                  ({it.notes})
                                </span>
                              )}
                            </span>
                            <span className="text-[#5C4D40] font-medium tabular-nums shrink-0">
                              Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5DCCB] flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#8A7968] block">
                          Total Pembayaran
                        </span>
                        <span className="font-serif-menu text-base font-bold text-[#4A331F] tabular-nums">
                          Rp {order.total_amount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectOrderToTrack(order)}
                          className="sm-btn-primary !py-1.5 !px-3.5 !min-h-0 text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Lacak Status</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* VIEW 3: PROFIL PEMBELI (USER PROFILE PAGE)                          */}
      {/* =================================================================== */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Identity Card & Summary Metrics */}
          <div className="space-y-4">
            <section className="sm-menu-frame rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#4A331F] text-[#F5DEB3] border-2 border-[#C89D42] flex items-center justify-center font-cinzel text-lg font-bold shrink-0">
                  {user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5ECD9] text-[#7D5A14] border border-[#DFC99B]">
                    Pembeli Terdaftar
                  </span>
                  <h2 className="font-serif-menu text-xl font-bold text-[#261C14] truncate mt-0.5">
                    {user.full_name}
                  </h2>
                  <p className="text-xs text-[#6B5A4B] truncate">{user.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DCCB] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5C4D40]">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8C6518]" />
                    WhatsApp
                  </span>
                  <span className="font-medium text-[#261C14] tabular-nums">
                    {user.phone || 'Belum diisi'}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Customer Activity Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#E5DCCB] p-4">
                <div className="flex items-center justify-between text-[#8A7968] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Total Pesanan
                  </span>
                  <Receipt className="w-3.5 h-3.5 text-[#9A6F18]" />
                </div>
                <p className="font-serif-menu text-2xl font-bold text-[#261C14] tabular-nums">
                  {myOrders.length}
                </p>
                <p className="text-[11px] text-[#6B5A4B] mt-0.5">
                  Transaksi di Sutera Minang
                </p>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#E5DCCB] p-4">
                <div className="flex items-center justify-between text-[#8A7968] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Total Belanja
                  </span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#9A6F18]" />
                </div>
                <p className="font-serif-menu text-lg font-bold text-[#4A331F] tabular-nums">
                  Rp {totalSpent.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-[#6B5A4B] mt-0.5">
                  Akumulasi pesanan aktif
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile & Dining Preferences Form */}
          <section className="lg:col-span-2 sm-menu-frame rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5DCCB]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6F18]">
                  Pengaturan Akun &amp; Preferensi Sajian
                </span>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#261C14] uppercase tracking-wider">
                  Profil &amp; Preferensi Pembeli
                </h3>
              </div>

              {profileSavedToast && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF7F1] text-[#2E6B47] border border-[#B7DFC5] text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Profil Tersimpan
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm-field">
                  <label htmlFor="profile-fullname" className="sm-label">
                    Nama Lengkap Pemesan
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8A7968] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="profile-fullname"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="sm-input !pl-8.5"
                    />
                  </div>
                </div>

                <div className="sm-field">
                  <label htmlFor="profile-email" className="sm-label">
                    Alamat Email Akun
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8A7968] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="profile-email"
                      type="email"
                      disabled
                      value={user.email}
                      className="sm-input !pl-8.5 !bg-[#F3ECE2] !text-[#6B5A4B] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm-field">
                  <label htmlFor="profile-phone" className="sm-label">
                    Nomor WhatsApp / Telepon
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#8A7968] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="0812xxxxxxxx"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      className="sm-input !pl-8.5"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#6B5A4B]">
                  Data profil Anda digunakan saat memesan hidangan.
                </span>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="sm-btn-primary"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Compact Sticky Bottom Checkout Bar */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full py-3 px-4 rounded-xl bg-[#4A331F] text-[#FFFDF9] font-semibold text-xs shadow-xl border border-[#785334] flex items-center justify-between hover:bg-[#3A2717] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-md bg-[#D4AF37] text-[#261C14] flex items-center justify-center font-bold text-[11px] tabular-nums">
                {cartTotalCount}
              </span>
              <span>Lihat Keranjang &amp; Checkout</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#F5DEB3] tabular-nums">
              <span>Rp {cartTotalPrice.toLocaleString('id-ID')}</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
