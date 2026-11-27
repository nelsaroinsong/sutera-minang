import React, { useState, useEffect } from 'react';
import { CartItem, Order, OrderType, UserProfile } from '../types';
import { resolveDishImage } from '../data/initialMenu';
import { PendingPaymentOrder } from './PaymentModal';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currentUser: UserProfile;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onProceedToPayment: (pendingOrder: PendingPaymentOrder) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('3');
  const [customerName, setCustomerName] = useState(currentUser.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '');
  const [orderNotes, setOrderNotes] = useState(currentUser.default_notes || '');

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.full_name || '');
      if (currentUser.phone) setCustomerPhone(currentUser.phone);
      if (currentUser.default_notes && !orderNotes) {
        setOrderNotes(currentUser.default_notes);
      }
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (acc, it) => acc + it.menu_item.price * it.quantity,
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert('Silakan isi nama pemesan.');
      return;
    }

    onProceedToPayment({
      order_type: orderType,
      table_number:
        orderType === 'dine_in' ? `Meja ${tableNumber}` : undefined,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      notes: orderNotes.trim() || undefined,
      total_amount: totalAmount,
      items: cart.map((c) => ({
        menu_item_id: c.menu_item.id,
        item_name: c.menu_item.name,
        price: c.menu_item.price,
        quantity: c.quantity,
        notes: c.notes,
      })),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#261C14]/55 backdrop-blur-xs">
      <div className="flex-1" onClick={onClose} />

      <aside
        aria-label="Keranjang Pesanan"
        className="w-full max-w-md h-full bg-[#FAF6F0] text-[#261C14] border-l border-[#DFD3C0] shadow-2xl flex flex-col justify-between"
      >
        {/* Header */}
        <header className="px-5 py-3.5 border-b border-[#E5DCCB] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#8C6518]" />
            <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#261C14]">
              Rincian Pesanan ({cart.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sm-btn-ghost !p-1.5"
            aria-label="Tutup Keranjang"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Form & Items */}
        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Exclusive 2-option Segmented Toggle */}
          <fieldset>
            <legend className="sm-label mb-1.5">Metode Layanan</legend>
            <div className="grid grid-cols-2 gap-1.5 bg-[#F3ECE2] p-1 rounded-lg border border-[#E2D6C1]">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  orderType === 'dine_in'
                    ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold shadow-2xs'
                    : 'text-[#5C4D40] hover:text-[#261C14]'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Makan di Tempat</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  orderType === 'takeaway'
                    ? 'bg-[#4A331F] text-[#FFFDF9] font-semibold shadow-2xs'
                    : 'text-[#5C4D40] hover:text-[#261C14]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Bawa Pulang</span>
              </button>
            </div>
          </fieldset>

          {/* Table Select (appearance: base-select) & Customer Name */}
          <div className="grid grid-cols-2 gap-3">
            {orderType === 'dine_in' ? (
              <div className="sm-field">
                <label htmlFor="cart-table-select" className="sm-label">
                  Nomor Meja *
                </label>
                <select
                  id="cart-table-select"
                  name="table_number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="sm-select"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n.toString()}>
                      Meja {n}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm-field">
                <label htmlFor="cart-phone" className="sm-label">
                  No. WhatsApp
                </label>
                <input
                  id="cart-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0812xxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="sm-input"
                />
              </div>
            )}

            <div className="sm-field">
              <label htmlFor="cart-customer-name" className="sm-label">
                Nama Pemesan *
              </label>
              <input
                id="cart-customer-name"
                name="customer_name"
                type="text"
                autoComplete="name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="sm-input"
              />
            </div>
          </div>

          {/* Item List */}
          <div className="pt-1">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E5DCCB]">
              <span className="sm-label">Daftar Hidangan</span>
              <span className="text-[11px] font-medium text-[#6B5A4B] tabular-nums">
                {cart.reduce((a, b) => a + b.quantity, 0)} porsi
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 bg-[#FFFFFF] rounded-xl border border-[#E5DCCB]">
                <p className="text-xs text-[#6B5A4B]">
                  Keranjang pesanan masih kosong.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div
                    key={c.menu_item.id}
                    className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] flex items-center justify-between gap-2.5"
                  >
                    <img
                      src={resolveDishImage(c.menu_item)}
                      alt={c.menu_item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#E5DCCB] shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif-menu text-sm font-bold text-[#261C14] truncate">
                        {c.menu_item.name}
                      </h4>
                      {c.notes && (
                        <p className="text-[11px] text-[#8C6518] italic truncate">
                          Catatan: &ldquo;{c.notes}&rdquo;
                        </p>
                      )}
                      <span className="text-xs font-bold text-[#4A331F] tabular-nums">
                        Rp{' '}
                        {(c.menu_item.price * c.quantity).toLocaleString(
                          'id-ID'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="inline-flex items-center bg-[#FAF6F0] border border-[#D6C7B2] rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(c.menu_item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#4A331F] hover:bg-[#EFE7DA] rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-[#261C14] tabular-nums">
                          {c.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(c.menu_item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#4A331F] hover:bg-[#EFE7DA] rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(c.menu_item.id)}
                        className="p-1.5 text-[#8A7968] hover:text-[#A63429] transition-colors"
                        title="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="sm-field">
              <label htmlFor="cart-notes" className="sm-label">
                Catatan Dapur (Opsional)
              </label>
              <textarea
                id="cart-notes"
                name="notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Contoh: Sajikan bersamaan, sambal dipisah..."
                className="sm-textarea"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        {cart.length > 0 && (
          <footer className="p-4 border-t border-[#E5DCCB] bg-[#FFFFFF] space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5A4B]">
                Total Tagihan
              </span>
              <span className="font-serif-menu text-xl font-bold text-[#4A331F] tabular-nums">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="sm-btn-primary w-full !py-2.5 !text-xs !justify-between !px-4"
            >
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Lanjut ke Pembayaran</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
};
