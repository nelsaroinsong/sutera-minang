import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Category, MenuItem, Order, OrderStatus } from '../types';
import { resolveDishImage } from '../data/initialMenu';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  BellRing,
  Volume2,
  VolumeX,
  Printer,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  XCircle,
  Banknote,
} from 'lucide-react';
import { playOrderChime } from '../utils/audio';

interface AdminDashboardProps {
  categories: Category[];
  orders: Order[];
  menuItems: MenuItem[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdatePaymentStatus?: (
    orderId: string,
    status: 'paid' | 'unpaid'
  ) => Promise<void>;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => Promise<void>;
  onCreateMenuItem: (input: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (
    id: string,
    updates: Partial<Omit<MenuItem, 'id'>>
  ) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  orders,
  menuItems,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onToggleAvailability,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'reports'>(
    'orders'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = new Set(orders.map((o) => o.id));
      return;
    }

    const hasNewOrder = orders.some(
      (o) => !knownOrderIdsRef.current!.has(o.id) && o.status === 'pending'
    );
    knownOrderIdsRef.current = new Set(orders.map((o) => o.id));

    if (hasNewOrder && soundEnabled) {
      playOrderChime();
    }
  }, [orders, soundEnabled]);
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'takeaway'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Menu CRUD Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formNumber, setFormNumber] = useState(1);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState(15000);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formIsSignature, setFormIsSignature] = useState(false);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Statistics
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const cookingCount = orders.filter((o) => o.status === 'cooking').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total_amount, 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterType !== 'all' && o.order_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = o.customer_name.toLowerCase().includes(q);
      const matchCode = o.order_code.toLowerCase().includes(q);
      const matchTable = o.table_number?.toLowerCase().includes(q);
      return matchName || matchCode || matchTable;
    }
    return true;
  });

  const handlePrintReceipt = (order: Order) => {
    setReceiptOrder(order);
    setTimeout(() => {
      const handleAfterPrint = () => {
        setReceiptOrder(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      window.print();
    }, 250);
  };

  const openAddMenuModal = () => {
    setEditingItem(null);
    setFormCategoryId(
      categories[0]?.id || 'c1000000-0000-0000-0000-000000000001'
    );
    setFormNumber(menuItems.length + 1);
    setFormName('');
    setFormDesc('');
    setFormPrice(18000);
    setFormImageUrl('/assets/menu/rendang-daging.jpg');
    setFormBadge('');
    setFormIsSignature(false);
    setFormIsAvailable(true);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormCategoryId(item.category_id);
    setFormNumber(item.item_number);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormPrice(item.price);
    setFormImageUrl(resolveDishImage(item));
    setFormBadge(item.badge || '');
    setFormIsSignature(Boolean(item.is_signature));
    setFormIsAvailable(item.is_available);
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMenu(true);
    try {
      const payload = {
        category_id: formCategoryId,
        item_number: Number(formNumber),
        name: formName.trim(),
        description: formDesc.trim(),
        price: Number(formPrice),
        image_url: formImageUrl.trim() || '/assets/menu/rendang-daging.jpg',
        badge: formBadge.trim() || null,
        is_signature: formIsSignature,
        is_available: formIsAvailable,
      };

      if (editingItem) {
        await onUpdateMenuItem(editingItem.id, payload);
      } else {
        await onCreateMenuItem(payload);
      }
      setIsMenuModalOpen(false);
    } catch (err: any) {
      alert(`Gagal menyimpan menu: ${err.message || 'Coba lagi'}`);
    } finally {
      setIsSavingMenu(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Compact Header & KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A7968]">
              Menunggu Konfirmasi
            </p>
            <p className="font-serif-menu text-2xl font-bold text-[#8C6518] tabular-nums mt-0.5">
              {pendingCount}
            </p>
          </div>
          <Clock className="w-4 h-4 text-[#9A6F18]" />
        </div>

        <div className="px-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A7968]">
              Sedang Dimasak
            </p>
            <p className="font-serif-menu text-2xl font-bold text-[#261C14] tabular-nums mt-0.5">
              {cookingCount}
            </p>
          </div>
          <ChefHat className="w-4 h-4 text-[#4A331F]" />
        </div>

        <div className="px-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A7968]">
              Siap Disajikan
            </p>
            <p className="font-serif-menu text-2xl font-bold text-[#2E6B47] tabular-nums mt-0.5">
              {readyCount}
            </p>
          </div>
          <BellRing className="w-4 h-4 text-[#2E6B47]" />
        </div>

        <div className="px-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8A7968]">
              Total Pendapatan
            </p>
            <p className="font-serif-menu text-xl font-bold text-[#4A331F] tabular-nums mt-0.5">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playOrderChime();
            }}
            className="sm-btn-secondary !p-1.5 !min-h-0"
            title={
              soundEnabled
                ? 'Suara Notifikasi Aktif'
                : 'Suara Notifikasi Nonaktif'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#4A331F]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#8A7968]" />
            )}
          </button>
        </div>
      </div>

      {/* Unified Toolbar: Module Switcher + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5DCCB] shadow-2xs">
        <div
          role="tablist"
          aria-label="Modul Pengelola"
          className="flex items-center gap-1 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold'
                : 'text-[#5C4D40] hover:text-[#261C14] hover:bg-[#FAF6F0]'
            }`}
          >
            <span>Antrean Dapur</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 rounded text-[10px] font-bold tabular-nums ${
                  activeTab === 'orders'
                    ? 'bg-[#D4AF37] text-[#261C14]'
                    : 'bg-[#4A331F] text-[#FFFDF9]'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'menu'}
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'menu'
                ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold'
                : 'text-[#5C4D40] hover:text-[#261C14] hover:bg-[#FAF6F0]'
            }`}
          >
            Katalog Menu ({menuItems.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold'
                : 'text-[#5C4D40] hover:text-[#261C14] hover:bg-[#FAF6F0]'
            }`}
          >
            Rekap Transaksi ({orders.length})
          </button>
        </div>

        {/* Contextual Toolbar Right */}
        {activeTab === 'orders' && (
          <search className="flex items-center gap-2">
            <select
              aria-label="Filter Tipe Pesanan"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="sm-select !w-40 !py-1 !min-h-0 h-8 !text-xs"
            >
              <option value="all">Semua Layanan</option>
              <option value="dine_in">Makan di Tempat</option>
              <option value="takeaway">Bawa Pulang</option>
            </select>

            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-[#8A7968] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari kode / nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                spellCheck={false}
                className="sm-input !py-1 !pl-8 !pr-3 !min-h-0 h-8 !text-xs"
              />
            </div>
          </search>
        )}

        {activeTab === 'menu' && (
          <button
            type="button"
            onClick={openAddMenuModal}
            className="sm-btn-primary !py-1.5 !px-3 !min-h-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Hidangan</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: KITCHEN ORDERS BOARD                                           */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Menunggu Konfirmasi */}
          <div className="bg-[#FFFFFF] border border-[#E5DCCB] rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE8DC]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C89D42]" />
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#7D5A14]">
                  Pesanan Masuk
                </h3>
              </div>
              <span className="text-xs font-bold text-[#7D5A14] tabular-nums">
                {filteredOrders.filter((o) => o.status === 'pending').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredOrders
                .filter((o) => o.status === 'pending')
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-[#FDF9F0] border border-[#DFC99B] space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif-menu text-sm font-bold text-[#261C14] tabular-nums">
                            {order.order_code}
                          </span>
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#FFFFFF] text-[#4A331F] border border-[#D9CEBE]">
                            {order.order_type === 'dine_in'
                              ? order.table_number || 'Meja -'
                              : 'Bungkus'}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              order.payment_status === 'paid'
                                ? 'bg-[#EDF7F1] text-[#2E6B47] border-[#B7DFC5]'
                                : 'bg-[#FDF6E7] text-[#8C5E14] border-[#C89D42]/45'
                            }`}
                          >
                            {order.payment_status === 'paid'
                              ? `LUNAS (${(order.payment_method || 'QRIS').toUpperCase()})`
                              : 'TUNAI KASIR'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#4A3B2F] mt-0.5">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#8A7968] tabular-nums">
                        {new Date(order.created_at).toLocaleTimeString(
                          'id-ID',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5DCCB] space-y-1 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between gap-2">
                          <span className="text-[#261C14]">
                            <strong className="text-[#4A331F] tabular-nums">
                              {it.quantity}x
                            </strong>{' '}
                            {it.item_name}
                            {it.notes && (
                              <span className="block text-[11px] text-[#8C6518] italic">
                                ↳ {it.notes}
                              </span>
                            )}
                          </span>
                          <span className="text-[#6B5A4B] font-medium tabular-nums shrink-0">
                            {(it.price * it.quantity) / 1000}K
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-[#7D5A14] italic px-2.5 py-1 rounded bg-[#F5ECD9]">
                        Catatan: {order.notes}
                      </p>
                    )}

                    {order.payment_status !== 'paid' ? (
                      <div className="space-y-2 pt-1 border-t border-[#DFC99B]">
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            Uang Tunai Belum Diterima
                          </span>
                          <span className="font-bold tabular-nums">
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              if (onUpdatePaymentStatus) {
                                await onUpdatePaymentStatus(order.id, 'paid');
                              }
                              await onUpdateStatus(order.id, 'cooking');
                            }}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Banknote className="w-4 h-4 text-[#F5DEB3]" />
                            <span>Terima Uang &amp; Mulai Masak</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateStatus(order.id, 'cancelled')}
                            className="sm-btn-secondary !p-2 !min-h-0 hover:!text-[#A63429] hover:!border-[#E8B4AE]"
                            title="Batalkan"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(order.id, 'cooking')}
                          className="sm-btn-primary flex-1 !py-1.5 !min-h-0"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Terima &amp; Masak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(order.id, 'cancelled')}
                          className="sm-btn-secondary !p-1.5 !min-h-0 hover:!text-[#A63429] hover:!border-[#E8B4AE]"
                          title="Batalkan"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order)}
                          className="sm-btn-secondary !p-1.5 !min-h-0"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              {filteredOrders.filter((o) => o.status === 'pending').length ===
                0 && (
                <p className="text-center py-8 text-xs text-[#8A7968]">
                  Belum ada antrean baru.
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Sedang Dimasak */}
          <div className="bg-[#FFFFFF] border border-[#E5DCCB] rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE8DC]">
              <div className="flex items-center gap-2">
                <ChefHat className="w-3.5 h-3.5 text-[#4A331F]" />
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#261C14]">
                  Sedang Dimasak
                </h3>
              </div>
              <span className="text-xs font-bold text-[#4A331F] tabular-nums">
                {filteredOrders.filter((o) => o.status === 'cooking').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredOrders
                .filter((o) => o.status === 'cooking')
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-[#FAF6F0] border border-[#D9CEBE] space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-serif-menu text-sm font-bold text-[#261C14] tabular-nums">
                          {order.order_code}
                        </span>
                        <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#FFFFFF] text-[#5C4D40] border border-[#D9CEBE]">
                          {order.order_type === 'dine_in'
                            ? order.table_number || 'Meja -'
                            : 'Bungkus'}
                        </span>
                        <p className="text-xs text-[#5C4D40] mt-0.5">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#8A7968] tabular-nums">
                        {new Date(order.created_at).toLocaleTimeString(
                          'id-ID',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5DCCB] space-y-1 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="text-[#4A3B2F]">
                          <strong className="text-[#261C14] tabular-nums">
                            {it.quantity}x
                          </strong>{' '}
                          {it.item_name}
                          {it.notes && (
                            <span className="block text-[11px] text-[#8C6518] italic">
                              ↳ {it.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onUpdateStatus(order.id, 'ready')}
                      className="sm-btn-secondary w-full !py-1.5 !min-h-0"
                    >
                      <BellRing className="w-3.5 h-3.5 text-[#8C6518]" />
                      <span>Tandai Siap Disajikan</span>
                    </button>
                  </div>
                ))}
              {filteredOrders.filter((o) => o.status === 'cooking').length ===
                0 && (
                <p className="text-center py-8 text-xs text-[#8A7968]">
                  Tidak ada hidangan sedang dimasak.
                </p>
              )}
            </div>
          </div>

          {/* Column 3: Siap Disajikan / Selesai */}
          <div className="bg-[#FFFFFF] border border-[#E5DCCB] rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE8DC]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B47]" />
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#261C14]">
                  Siap Saji &amp; Selesai
                </h3>
              </div>
              <span className="text-xs font-bold text-[#2E6B47] tabular-nums">
                {
                  filteredOrders.filter(
                    (o) => o.status === 'ready' || o.status === 'completed'
                  ).length
                }
              </span>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredOrders
                .filter((o) => o.status === 'ready' || o.status === 'completed')
                .map((order) => (
                  <div
                    key={order.id}
                    className={`p-3 rounded-xl border space-y-2 ${
                      order.status === 'ready'
                        ? 'bg-[#EDF7F1] border-[#B7DFC5]'
                        : 'bg-[#FAF6F0] border-[#E5DCCB] opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-serif-menu text-xs font-bold text-[#261C14] tabular-nums">
                          {order.order_code}
                        </span>
                        <span
                          className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${
                            order.status === 'ready'
                              ? 'bg-[#2E6B47] text-[#FFFDF9] border-[#2E6B47] font-bold'
                              : 'bg-[#FFFFFF] text-[#6B5A4B] border-[#D9CEBE]'
                          }`}
                        >
                          {order.status === 'ready' ? 'Siap Antar' : 'Selesai'}
                        </span>
                        <p className="text-xs text-[#5C4D40] mt-0.5">
                          {order.customer_name} •{' '}
                          {order.table_number || 'Bungkus'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#4A331F] tabular-nums">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                        className="sm-btn-primary w-full !py-1.5 !min-h-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesaikan Pesanan</span>
                      </button>
                    )}
                  </div>
                ))}
              {filteredOrders.filter(
                (o) => o.status === 'ready' || o.status === 'completed'
              ).length === 0 && (
                <p className="text-center py-8 text-xs text-[#8A7968]">
                  Belum ada pesanan selesai.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: FULL MENU CRUD & STOCK MANAGEMENT                              */}
      {/* ===================================================================== */}
      {activeTab === 'menu' && (
        <div className="sm-menu-frame rounded-xl overflow-hidden">
          <div className="divide-y divide-[#EFE8DC]">
            {menuItems.map((item) => {
              const catName =
                categories.find((c) => c.id === item.category_id)?.name ||
                'Hidangan';
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF6F0] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolveDishImage(item)}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover border border-[#DFD3C0] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif-menu text-xs font-bold text-[#8C6518] tabular-nums">
                          #{item.item_number}
                        </span>
                        <h4 className="font-serif-menu text-base font-bold text-[#261C14]">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FAF6F0] text-[#5C4D40] border border-[#D9CEBE]">
                          {catName}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5ECD9] text-[#7D5A14] border border-[#DFC99B]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5C4D40] truncate max-w-xl mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="font-serif-menu text-sm font-bold text-[#4A331F] tabular-nums mr-2">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleAvailability(item.id, !item.is_available)
                      }
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                        item.is_available
                          ? 'bg-[#EDF7F1] border-[#B7DFC5] text-[#2E6B47]'
                          : 'bg-[#FDF1F0] border-[#E8B4AE] text-[#A63429]'
                      }`}
                    >
                      {item.is_available ? 'Tersedia' : 'Habis'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditMenuModal(item)}
                      className="sm-btn-secondary !p-1.5 !min-h-0"
                      title="Edit Hidangan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Hapus menu "${item.name}" dari katalog?`
                          )
                        ) {
                          await onDeleteMenuItem(item.id);
                        }
                      }}
                      className="sm-btn-secondary !p-1.5 !min-h-0 hover:!text-[#A63429] hover:!border-[#E8B4AE]"
                      title="Hapus Hidangan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SALES REPORTS & TRANSACTION HISTORY                            */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="sm-menu-frame rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5DCCB] bg-[#FAF6F0] text-[#7D5A14] text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Rincian Hidangan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DC]">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-[#8A7968] italic"
                    >
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-[#FAF6F0] transition-colors"
                    >
                      <td className="py-2.5 px-4 font-serif-menu font-bold text-[#261C14] tabular-nums">
                        {o.order_code}
                      </td>
                      <td className="py-2.5 px-4 text-[#6B5A4B] tabular-nums whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#261C14]">
                        {o.customer_name}
                      </td>
                      <td className="py-2.5 px-4 text-[#5C4D40]">
                        {o.order_type === 'dine_in'
                          ? o.table_number || 'Dine-In'
                          : 'Bungkus'}
                      </td>
                      <td className="py-2.5 px-4 text-[#5C4D40] max-w-xs truncate">
                        {o.items
                          .map((i) => `${i.quantity}x ${i.item_name}`)
                          .join(', ')}
                      </td>
                      <td className="py-2.5 px-4 space-y-1">
                        <span className="inline-block uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF6F0] text-[#4A331F] border border-[#D9CEBE]">
                          {o.status}
                        </span>
                        <span
                          className={`block uppercase text-[9px] font-bold px-1.5 py-0.5 rounded border text-center ${
                            o.payment_status === 'paid'
                              ? 'bg-[#EDF7F1] text-[#2E6B47] border-[#B7DFC5]'
                              : 'bg-[#FDF6E7] text-[#8C5E14] border-[#C89D42]/45'
                          }`}
                        >
                          {o.payment_status === 'paid'
                            ? `LUNAS (${(o.payment_method || 'qris').toUpperCase()})`
                            : 'BAYAR KASIR'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-serif-menu font-bold text-[#4A331F] tabular-nums whitespace-nowrap">
                        Rp {o.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(o)}
                          className="sm-btn-ghost !p-1.5"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT MENU ITEM                                           */}
      {/* ===================================================================== */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261C14]/55 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#DFD3C0] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-3">
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#261C14]">
                {editingItem
                  ? `Edit Menu: ${editingItem.name}`
                  : 'Tambah Hidangan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="sm-btn-ghost !p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuForm} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 sm-field">
                  <label htmlFor="menu-cat" className="sm-label">
                    Kategori Menu
                  </label>
                  <select
                    id="menu-cat"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="sm-select"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm-field">
                  <label htmlFor="menu-no" className="sm-label">
                    No. Urut
                  </label>
                  <input
                    id="menu-no"
                    type="number"
                    min={1}
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(Number(e.target.value))}
                    className="sm-input"
                  />
                </div>
              </div>

              <div className="sm-field">
                <label htmlFor="menu-name" className="sm-label">
                  Nama Hidangan
                </label>
                <input
                  id="menu-name"
                  type="text"
                  required
                  placeholder="Contoh: Rendang Daging Sapi Pilihan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="sm-input"
                />
              </div>

              <div className="sm-field">
                <label htmlFor="menu-desc" className="sm-label">
                  Deskripsi Kuliner
                </label>
                <textarea
                  id="menu-desc"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="sm-textarea"
                />
              </div>

              <div className="sm-field">
                <label htmlFor="menu-image" className="sm-label">
                  URL Foto Hidangan
                </label>
                <input
                  id="menu-image"
                  type="text"
                  placeholder="/assets/menu/rendang-daging.jpg"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="sm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="sm-field">
                  <label htmlFor="menu-price" className="sm-label">
                    Harga (Rp)
                  </label>
                  <input
                    id="menu-price"
                    type="number"
                    min={1000}
                    step={500}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="menu-badge" className="sm-label">
                    Label / Badge (Opsional)
                  </label>
                  <input
                    id="menu-badge"
                    type="text"
                    placeholder="Signature / Favorit"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="sm-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-[#4A3B2F]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsSignature}
                    onChange={(e) => setFormIsSignature(e.target.checked)}
                    className="accent-[#4A331F]"
                  />
                  <span>Tandai Signature Delicacy</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="accent-[#4A331F]"
                  />
                  <span>Stok Tersedia</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE8DC]">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="sm-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMenu}
                  className="sm-btn-primary"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMenu ? 'Menyimpan...' : 'Simpan Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PRINTABLE THERMAL RECEIPT                                             */}
      {/* ===================================================================== */}
      {receiptOrder &&
        createPortal(
          <div id="printable-receipt">
            <div className="receipt-header">
              <h2 className="receipt-title">SUTERA MINANG</h2>
              <p className="receipt-sub">Cita Rasa Asli Pusaka Ranah Minang</p>
              <p className="receipt-date">
                {new Date(receiptOrder.created_at).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="receipt-meta">
              <div>
                Kode: <strong>{receiptOrder.order_code}</strong>
              </div>
              <div>Pelanggan: {receiptOrder.customer_name}</div>
              <div>
                Layanan:{' '}
                {receiptOrder.order_type === 'dine_in'
                  ? receiptOrder.table_number
                  : 'Bawa Pulang'}
              </div>
              <div>
                Status:{' '}
                {receiptOrder.payment_status === 'paid'
                  ? 'LUNAS'
                  : 'BAYAR DI KASIR'}{' '}
                ({(receiptOrder.payment_method || 'QRIS').toUpperCase()})
              </div>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-items">
              {receiptOrder.items.map((it, idx) => (
                <div key={idx} className="receipt-item-row">
                  <span className="receipt-item-name">
                    {it.quantity}x {it.item_name}
                  </span>
                  <span className="receipt-item-price">
                    Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="receipt-divider" />

            <div className="receipt-total-row">
              <span>TOTAL</span>
              <span>
                Rp {receiptOrder.total_amount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-footer">
              <p>Terima kasih atas kunjungan Anda.</p>
              <p>Lamun lah tibo di lidah, taragak nak babaliak.</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
