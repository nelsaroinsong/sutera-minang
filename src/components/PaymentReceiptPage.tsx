import React from 'react';
import { Order } from '../types';
import { Logo } from './Logo';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  Package,
  ShieldCheck,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface PaymentReceiptPageProps {
  order: Order;
  onTrackOrder: (order: Order) => void;
  onBackToMenu: () => void;
}

export const PaymentReceiptPage: React.FC<PaymentReceiptPageProps> = ({
  order,
  onTrackOrder,
  onBackToMenu,
}) => {
  const isPaid = order.payment_status === 'paid';
  const method = order.payment_method || 'qris';

  const methodLabelMap: Record<string, string> = {
    qris: 'QRIS Standar Nasional (GPN)',
    va: 'Transfer Virtual Account (VA)',
    card: 'Kartu Debit / Kredit',
    cash: 'Tunai di Meja Kasir',
  };

  const transactionCode = `TRX-${order.order_code}-${new Date(
    order.created_at
  ).getTime().toString().slice(-6)}`;

  return (
    <div className="pb-24 max-w-2xl mx-auto space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5DCCB]">
        <button
          type="button"
          onClick={onBackToMenu}
          className="sm-btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembali ke Buku Menu</span>
        </button>

        <span className="text-[11px] font-bold text-[#8C6518] uppercase tracking-wider inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Bukti Transaksi Sah
        </span>
      </div>

      {/* Main Official Receipt Paper Card */}
      <article className="bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] shadow-sm overflow-hidden">
        {/* Brand Banner Header */}
        <header className="p-6 text-center border-b border-[#EFE8DC] bg-[#FAF6F0] space-y-3">
          <div className="flex justify-center">
            <Logo size="md" variant="full" />
          </div>

          <div className="pt-2">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 shadow-2xs border ${
                isPaid
                  ? 'bg-[#EDF7F1] text-[#2E6B47] border-[#B7DFC5]'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6 text-amber-700" />
              )}
            </div>

            <h1 className="font-serif-menu text-2xl font-bold text-[#261C14]">
              {isPaid
                ? 'Pembayaran Berhasil Terverifikasi'
                : 'Menunggu Pembayaran Tunai di Kasir'}
            </h1>
            <p className="text-xs text-[#6B5A4B] max-w-md mx-auto mt-0.5">
              {isPaid
                ? 'Terima kasih atas pesanan Anda. Hidangan pusaka sedang disiapkan oleh koki Sutera Minang.'
                : 'Silakan serahkan uang tunai ke kasir atau pelayan meja Anda. Koki dapur akan mulai memasak segera setelah uang diterima kasir.'}
            </p>
          </div>
        </header>

        {/* Transaction Summary Grid */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#EFE8DC] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Nomor Pesanan
              </span>
              <strong className="font-serif-menu text-base text-[#261C14] tabular-nums">
                {order.order_code}
              </strong>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Nomor Transaksi
              </span>
              <span className="font-mono text-xs font-semibold text-[#4A331F] tabular-nums">
                {transactionCode}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Waktu Transaksi
              </span>
              <span className="text-[#261C14] tabular-nums">
                {new Date(order.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Metode Pembayaran
              </span>
              <span className="font-semibold text-[#261C14]">
                {methodLabelMap[method] || method.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Nama Pemesan
              </span>
              <strong className="text-[#261C14]">{order.customer_name}</strong>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-wider block">
                Layanan &amp; Meja
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#4A331F]">
                {order.order_type === 'dine_in' ? (
                  <>
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>{order.table_number || 'Dine-In'}</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" />
                    <span>Bungkus / Takeaway</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Ordered Dish Items Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A7968]">
                Daftar Sajian Menu
              </span>
              <span className="text-xs font-semibold text-[#6B5A4B] tabular-nums">
                {order.items.reduce((a, b) => a + b.quantity, 0)} Porsi
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] flex justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#261C14]">
                      <strong className="text-[#4A331F] tabular-nums mr-1">
                        {it.quantity}x
                      </strong>
                      {it.item_name}
                    </span>
                    {it.notes && (
                      <p className="text-[11px] text-[#8C6518] italic mt-0.5">
                        ↳ Catatan: {it.notes}
                      </p>
                    )}
                    <span className="text-[10.5px] text-[#8A7968] tabular-nums block mt-0.5">
                      @ Rp {it.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <span className="font-bold text-[#4A331F] tabular-nums text-right shrink-0">
                    Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="pt-3 border-t border-[#EFE8DC] space-y-2 text-xs text-[#5C4D40]">
            <div className="flex justify-between">
              <span>Subtotal Sajian</span>
              <span className="font-semibold text-[#261C14] tabular-nums">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan &amp; Pemesanan</span>
              <span className="text-[#2E6B47] font-semibold">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak Restoran (PB1)</span>
              <span className="text-[#6B5A4B]">Sudah Termasuk</span>
            </div>

            <div className="pt-3 mt-1 border-t border-[#EFE8DC] flex items-baseline justify-between font-bold">
              <div>
                <span className="text-sm text-[#261C14] block">
                  Total Tagihan Lunas
                </span>
                <span className="text-[10px] text-[#2E6B47] uppercase tracking-wider font-semibold">
                  Status: {isPaid ? 'Lunas Terverifikasi' : 'Menunggu Bayar di Kasir'}
                </span>
              </div>
              <span className="font-serif-menu text-2xl text-[#4A331F] tabular-nums">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Note to User (No Print Button per Request!) */}
          <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] text-[11px] text-[#6B5A4B] text-center">
            Bukti pembayaran digital ini tersimpan otomatis di akun Anda dan dapat diakses kapan saja melalui tab <strong>Pesanan Saya</strong>.
          </div>

          {/* User Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToMenu}
              className="sm-btn-secondary !py-2.5 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembali ke Buku Menu</span>
            </button>

            <button
              type="button"
              onClick={() => onTrackOrder(order)}
              className="sm-btn-primary !py-2.5 text-xs font-bold shadow-md"
            >
              <span>Pantau Status di Dapur</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F5DEB3]" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
