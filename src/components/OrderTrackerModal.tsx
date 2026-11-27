import React from 'react';
import { Order, OrderStatus } from '../types';
import { X, CheckCircle2, Clock, ChefHat, BellRing } from 'lucide-react';

interface OrderTrackerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const steps: {
    status: OrderStatus;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      status: 'pending',
      label: 'Menunggu Konfirmasi',
      desc: 'Pesanan telah diterima & diteruskan ke dapur.',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      status: 'cooking',
      label: 'Sedang Dimasak',
      desc: 'Koki sedang menyiapkan hidangan rempah Anda.',
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      status: 'ready',
      label: 'Siap Disajikan',
      desc:
        order.order_type === 'dine_in'
          ? `Diantarkan ke ${order.table_number || 'meja Anda'}.`
          : 'Siap diambil di meja kasir.',
      icon: <BellRing className="w-4 h-4" />,
    },
    {
      status: 'completed',
      label: 'Selesai',
      desc: 'Selamat menikmati sajian Sutera Minang.',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (s: OrderStatus) => {
    switch (s) {
      case 'pending':
        return 0;
      case 'cooking':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return -1;
    }
  };

  const currentIdx = getStepIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261C14]/55 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FFFFFF] text-[#261C14] border border-[#DFD3C0] rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between border-b border-[#EFE8DC] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-menu text-lg font-bold text-[#261C14] tabular-nums">
                Pesanan {order.order_code}
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FAF6F0] text-[#4A331F] border border-[#D9CEBE]">
                {order.order_type === 'dine_in'
                  ? order.table_number || 'Dine-In'
                  : 'Bawa Pulang'}
              </span>
            </div>
            <p className="text-xs text-[#6B5A4B] mt-0.5">
              {order.customer_name} •{' '}
              {new Date(order.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sm-btn-ghost !p-1"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Progress Timeline */}
        <ol className="space-y-3">
          {steps.map((st, idx) => {
            const isPassed = currentIdx > idx;
            const isCurrent = currentIdx === idx;

            return (
              <li
                key={st.status}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs ${
                    isCurrent
                      ? 'bg-[#4A331F] text-[#F5DEB3] border-[#4A331F]'
                      : isPassed
                      ? 'bg-[#EDF7F1] text-[#2E6B47] border-[#B7DFC5]'
                      : 'bg-[#FAF6F0] text-[#9A8B7A] border-[#E5DCCB]'
                  }`}
                >
                  {st.icon}
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-serif-menu text-sm font-bold ${
                      isCurrent
                        ? 'text-[#4A331F]'
                        : isPassed
                        ? 'text-[#2E6B47]'
                        : 'text-[#8A7968]'
                    }`}
                  >
                    {st.label}
                  </h4>
                  <p className="text-[11px] text-[#6B5A4B] leading-snug">
                    {st.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Order Summary */}
        <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-1.5 text-xs">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-[#4A3B2F]">
                <strong className="text-[#261C14] tabular-nums">
                  {it.quantity}x
                </strong>{' '}
                {it.item_name}
              </span>
              <span className="text-[#5C4D40] font-medium tabular-nums">
                Rp {(it.price * it.quantity).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-1 border-t border-[#E5DCCB] flex justify-between font-bold text-xs">
            <span className="text-[#261C14]">Total Pembayaran</span>
            <span className="text-[#4A331F] tabular-nums">
              Rp {order.total_amount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="sm-btn-secondary w-full"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
