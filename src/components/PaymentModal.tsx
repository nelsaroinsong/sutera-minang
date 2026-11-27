import React, { useEffect, useRef, useState } from 'react';
import { Order, PaymentMethod } from '../types';
import {
  X,
  QrCode,
  Building2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  Clock,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playOrderChime } from '../utils/audio';

export interface PendingPaymentOrder {
  order_type: 'dine_in' | 'takeaway';
  table_number?: string;
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  total_amount: number;
  items: {
    menu_item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingOrder: PendingPaymentOrder | null;
  existingOrder?: Order | null;
  onPaymentSuccess: (
    method: PaymentMethod,
    confirmedOrder: Order
  ) => void;
  onProcessOrder: (orderInput: any) => Promise<Order>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  pendingOrder,
  existingOrder,
  onPaymentSuccess,
  onProcessOrder,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Active payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');

  // VA State
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca');
  const [copiedVA, setCopiedVA] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [confirmedOrderResult, setConfirmedOrderResult] = useState<Order | null>(null);

  // 15-Minute Countdown Timer for QRIS / VA
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      setTimeLeft(15 * 60);
      setPaymentDone(false);
      setConfirmedOrderResult(null);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Countdown effect
  useEffect(() => {
    if (!isOpen || paymentDone) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentDone]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom;
    if (isOutside && !isProcessing) {
      onClose();
    }
  };

  const totalAmount =
    existingOrder?.total_amount || pendingOrder?.total_amount || 0;
  const totalItemCount =
    existingOrder?.items.reduce((a, b) => a + b.quantity, 0) ||
    pendingOrder?.items.reduce((a, b) => a + b.quantity, 0) ||
    0;

  // Virtual Account Numbers per Bank
  const vaNumbers = {
    bca: '8802 0812 9481 0293',
    mandiri: '8910 0812 9481 0293',
    bri: '1029 0812 9481 0293',
    bni: '8277 0812 9481 0293',
  };

  const handleCopyVA = () => {
    const num = vaNumbers[selectedBank].replace(/\s/g, '');
    navigator.clipboard?.writeText(num);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2500);
  };

  // Card Number Formatter
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Card Expiry Formatter MM/YY
  const handleCardExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExp(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExp(digits);
    }
  };

  // Execute payment completion
  const handleConfirmPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);
    try {
      let resolvedOrder = existingOrder;

      // If we don't have an existing order yet, submit the order now with payment details
      if (!resolvedOrder && pendingOrder) {
        resolvedOrder = await onProcessOrder({
          ...pendingOrder,
          payment_method: method,
          payment_status: method === 'cash' ? 'unpaid' : 'paid',
        });
      }

      // Simulate network verification delay (800ms)
      await new Promise((res) => setTimeout(res, 800));

      setConfirmedOrderResult(resolvedOrder || null);
      setPaymentDone(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4A331F', '#D4AF37', '#9A6F18', '#2E6B47'],
      });

      playOrderChime();

      if (resolvedOrder) {
        onPaymentSuccess(method, resolvedOrder);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert('Terjadi kendala dalam proses pembayaran. Silakan coba kembali.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || (!pendingOrder && !existingOrder)) return null;

  return (
    <dialog
      ref={dialogRef}
      onPointerDown={handlePointerDown}
      onCancel={(e) => {
        e.preventDefault();
        if (!isProcessing) onClose();
      }}
      aria-labelledby="payment-modal-title"
      className="m-auto p-0 rounded-2xl bg-[#FFFFFF] text-[#261C14] border border-[#DFD3C0] shadow-2xl w-full max-w-lg overflow-hidden backdrop:bg-[#261C14]/55 backdrop:backdrop-blur-xs"
    >
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[#EFE8DC] bg-[#FAF6F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A331F] text-[#F5DEB3] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="payment-modal-title"
                className="font-cinzel text-base font-bold text-[#261C14] uppercase tracking-wide"
              >
                {paymentDone ? 'Bukti Pembayaran' : 'Pembayaran Pesanan'}
              </h2>
              <p className="text-xs text-[#6B5A4B]">
                Rumah Makan Sutera Minang • Pembayaran Resmi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="sm-btn-ghost !p-1.5"
            aria-label="Tutup halaman pembayaran"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* =============================================================== */}
          {/* STATE A: SELESAI / LUNAS (DIGITAL RECEIPT & CONFIRMATION)       */}
          {/* =============================================================== */}
          {paymentDone && confirmedOrderResult ? (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-full bg-[#EDF7F1] text-[#2E6B47] border border-[#B7DFC5] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif-menu text-xl font-bold text-[#261C14]">
                  {selectedMethod === 'cash'
                    ? 'Pesanan Diteruskan ke Kasir'
                    : 'Pembayaran Berhasil!'}
                </h3>
                <p className="text-xs text-[#6B5A4B]">
                  {selectedMethod === 'cash'
                    ? 'Silakan lakukan pembayaran tunai di kasir saat hidangan siap.'
                    : 'Terima kasih, tagihan Anda telah lunas dan pesanan masuk ke dapur.'}
                </p>
              </div>

              {/* Digital E-Receipt Card */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                  <span className="font-bold text-[#4A331F] font-serif-menu text-sm">
                    {confirmedOrderResult.order_code}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-[#EDF7F1] text-[#2E6B47] border border-[#B7DFC5]">
                    {selectedMethod === 'cash' ? 'BAYAR DI KASIR' : 'LUNAS (PAID)'}
                  </span>
                </div>

                <div className="space-y-1 text-[#5C4D40]">
                  <div className="flex justify-between">
                    <span>Pemesan:</span>
                    <strong className="text-[#261C14]">
                      {confirmedOrderResult.customer_name}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Layanan:</span>
                    <span className="text-[#261C14]">
                      {confirmedOrderResult.order_type === 'dine_in'
                        ? confirmedOrderResult.table_number || 'Dine-In'
                        : 'Bungkus / Takeaway'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-medium text-[#261C14] uppercase">
                      {selectedMethod === 'qris'
                        ? 'QRIS Standar Nasional'
                        : selectedMethod === 'va'
                        ? `Virtual Account (${selectedBank.toUpperCase()})`
                        : selectedMethod === 'card'
                        ? 'Kartu Debit / Kredit'
                        : 'Tunai di Meja Kasir'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu Transaksi:</span>
                    <span className="text-[#261C14] tabular-nums">
                      {new Date().toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EFE8DC] flex justify-between font-bold text-sm">
                  <span className="text-[#261C14]">Total Tagihan</span>
                  <span className="text-[#4A331F] tabular-nums font-serif-menu text-base">
                    Rp {confirmedOrderResult.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="sm-btn-primary w-full"
                >
                  <span>Pantau Pesanan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* STATE B: PILIH METODE & FORM PEMBAYARAN                         */
            /* =============================================================== */
            <div className="space-y-4">
              {/* Order Summary Strip */}
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6F18] block">
                    Total Pembayaran ({totalItemCount} porsi)
                  </span>
                  <span className="font-serif-menu text-2xl font-bold text-[#4A331F] tabular-nums">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#5C4D40] block">
                    {pendingOrder?.customer_name || existingOrder?.customer_name}
                  </span>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DFD3C0] text-[#4A331F]">
                    {(pendingOrder?.order_type || existingOrder?.order_type) ===
                    'dine_in'
                      ? pendingOrder?.table_number ||
                        existingOrder?.table_number ||
                        'Meja Makan'
                      : 'Bungkus / Takeaway'}
                  </span>
                </div>
              </div>

              {/* Exclusive 4-Option Payment Method Tabs */}
              <fieldset>
                <legend className="sm-label mb-1.5">
                  Pilih Saluran Pembayaran
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E5DCCB]">
                  {[
                    {
                      id: 'qris',
                      label: 'QRIS',
                      sub: 'Scan Otomatis',
                      icon: <QrCode className="w-4 h-4" />,
                    },
                    {
                      id: 'va',
                      label: 'Transfer VA',
                      sub: 'Virtual Account',
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      id: 'card',
                      label: 'Kartu',
                      sub: 'Debit / Kredit',
                      icon: <CreditCard className="w-4 h-4" />,
                    },
                    {
                      id: 'cash',
                      label: 'Tunai Kasir',
                      sub: 'Bayar di Kasir',
                      icon: <Banknote className="w-4 h-4" />,
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-colors ${
                        selectedMethod === m.id
                          ? 'bg-[#4A331F] text-[#FFFDF9] font-bold shadow-2xs'
                          : 'bg-[#FFFFFF] text-[#5C4D40] hover:text-[#261C14] hover:bg-[#F3ECE2] border border-[#E5DCCB]'
                      }`}
                    >
                      <div className="mb-0.5">{m.icon}</div>
                      <span className="font-semibold">{m.label}</span>
                      <span className="text-[9.5px] opacity-80">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* =========================================================== */}
              {/* TAB 1: QRIS DINAMIS                                         */}
              {/* =========================================================== */}
              {selectedMethod === 'qris' && (
                <div className="p-4 rounded-xl border border-[#DFD3C0] bg-[#FFFFFF] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-[#FAF6F0] border border-[#E5DCCB] text-[#4A331F]">
                        QRIS Standar Nasional
                      </span>
                      <span className="text-[11px] text-[#6B5A4B]">
                        NMID: ID102030405060
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-[#8C6518] tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(timeLeft)}</span>
                    </div>
                  </div>

                  {/* Clean SVG QR Code Representation */}
                  <div className="flex flex-col items-center justify-center p-4 bg-[#FAF6F0] rounded-xl border border-[#E5DCCB]">
                    <div className="p-3 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#DFD3C0]">
                      <svg
                        viewBox="0 0 160 160"
                        className="w-44 h-44"
                        shapeRendering="crispEdges"
                        aria-label="QRIS Code Pembayaran Sutera Minang"
                      >
                        {/* Finder Top Left */}
                        <rect x="10" y="10" width="40" height="40" fill="#261C14" />
                        <rect x="16" y="16" width="28" height="28" fill="#FFFFFF" />
                        <rect x="22" y="22" width="16" height="16" fill="#4A331F" />

                        {/* Finder Top Right */}
                        <rect x="110" y="10" width="40" height="40" fill="#261C14" />
                        <rect x="116" y="16" width="28" height="28" fill="#FFFFFF" />
                        <rect x="122" y="22" width="16" height="16" fill="#4A331F" />

                        {/* Finder Bottom Left */}
                        <rect x="10" y="110" width="40" height="40" fill="#261C14" />
                        <rect x="16" y="116" width="28" height="28" fill="#FFFFFF" />
                        <rect x="22" y="122" width="16" height="16" fill="#4A331F" />

                        {/* Data Matrix Elements */}
                        <rect x="60" y="15" width="8" height="8" fill="#261C14" />
                        <rect x="75" y="15" width="12" height="6" fill="#4A331F" />
                        <rect x="95" y="20" width="6" height="14" fill="#261C14" />
                        <rect x="60" y="32" width="15" height="8" fill="#4A331F" />
                        <rect x="85" y="30" width="8" height="8" fill="#261C14" />

                        <rect x="15" y="60" width="10" height="8" fill="#261C14" />
                        <rect x="35" y="60" width="12" height="10" fill="#4A331F" />
                        <rect x="18" y="75" width="18" height="8" fill="#261C14" />
                        <rect x="12" y="90" width="14" height="10" fill="#4A331F" />

                        {/* Center Badge with Minang Roof Silhouette Accent */}
                        <rect x="62" y="62" width="36" height="36" rx="6" fill="#4A331F" />
                        <text
                          x="80"
                          y="84"
                          fill="#F5DEB3"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          SUTERA
                        </text>

                        {/* Right and Bottom Random Authentic Grid */}
                        <rect x="110" y="60" width="12" height="10" fill="#261C14" />
                        <rect x="130" y="70" width="14" height="8" fill="#4A331F" />
                        <rect x="115" y="85" width="10" height="10" fill="#261C14" />
                        <rect x="135" y="90" width="12" height="10" fill="#4A331F" />

                        <rect x="60" y="115" width="12" height="10" fill="#261C14" />
                        <rect x="80" y="110" width="8" height="15" fill="#4A331F" />
                        <rect x="65" y="135" width="15" height="10" fill="#261C14" />
                        <rect x="90" y="130" width="12" height="15" fill="#4A331F" />
                        <rect x="115" y="120" width="10" height="10" fill="#261C14" />
                        <rect x="130" y="135" width="15" height="8" fill="#4A331F" />
                      </svg>
                    </div>

                    <p className="font-serif-menu text-sm font-bold text-[#261C14] mt-2.5">
                      RM SUTERA MINANG RESTAURANT
                    </p>
                    <p className="text-[11px] text-[#6B5A4B]">
                      Mendukung BCA Mobile, Mandiri Livin&apos;, GoPay, OVO, Dana, ShopeePay
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmPayment('qris')}
                    disabled={isProcessing}
                    className="sm-btn-primary w-full !py-2.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Memverifikasi Pembayaran QRIS...'
                        : 'Simulasi Scan & Konfirmasi QRIS'}
                    </span>
                  </button>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 2: VIRTUAL ACCOUNT (TRANSFER BANK)                      */}
              {/* =========================================================== */}
              {selectedMethod === 'va' && (
                <div className="p-4 rounded-xl border border-[#DFD3C0] bg-[#FFFFFF] space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="sm-label">Pilih Bank Virtual Account</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['bca', 'mandiri', 'bri', 'bni'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold uppercase transition-colors border ${
                            selectedBank === b
                              ? 'bg-[#4A331F] text-[#FFFDF9] border-[#4A331F]'
                              : 'bg-[#FAF6F0] text-[#5C4D40] border-[#E5DCCB] hover:bg-[#F3ECE2]'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VA Number & Copy Button */}
                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7968]">
                        Nomor Virtual Account {selectedBank.toUpperCase()}
                      </span>
                      {copiedVA && (
                        <span className="text-[10px] font-bold text-[#2E6B47] bg-[#EDF7F1] px-2 py-0.5 rounded border border-[#B7DFC5]">
                          Nomor Tersalin!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif-menu text-lg font-bold text-[#261C14] tabular-nums tracking-wider">
                        {vaNumbers[selectedBank]}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVA}
                        className="sm-btn-secondary !py-1 !px-2.5 !min-h-0 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-[#6B5A4B] pt-1 border-t border-[#EFE8DC]">
                      Atas Nama: <strong>SUTERA MINANG RESTO</strong>
                    </p>
                  </div>

                  {/* Transfer Guide */}
                  <div className="text-[11px] text-[#5C4D40] space-y-1 bg-[#FAF6F0] p-3 rounded-lg border border-[#E5DCCB]">
                    <p className="font-semibold text-[#261C14]">
                      Petunjuk Pembayaran m-Banking:
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Buka aplikasi m-Banking Anda, pilih menu <strong>Transfer / Virtual Account</strong>.</li>
                      <li>Masukkan nomor VA di atas, pastikan nominal sesuai Rp {totalAmount.toLocaleString('id-ID')}.</li>
                      <li>Konfirmasi nama merchant Sutera Minang dan selesaikan transfer.</li>
                    </ol>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmPayment('va')}
                    disabled={isProcessing}
                    className="sm-btn-primary w-full !py-2.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>
                      {isProcessing ? 'Memverifikasi Transfer...' : 'Saya Sudah Melakukan Transfer'}
                    </span>
                  </button>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 3: KARTU DEBIT / KREDIT (AUTOFILL-PAYMENT-FORM)         */}
              {/* =========================================================== */}
              {selectedMethod === 'card' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmPayment('card');
                  }}
                  className="p-4 rounded-xl border border-[#DFD3C0] bg-[#FFFFFF] space-y-3"
                >
                  <div className="sm-field">
                    <label htmlFor="cc-number" className="sm-label">
                      Nomor Kartu Debit / Kredit
                    </label>
                    <input
                      id="cc-number"
                      name="cc-number"
                      type="text"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      maxLength={19}
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="sm-input"
                    />
                  </div>

                  <div className="sm-field">
                    <label htmlFor="cc-name" className="sm-label">
                      Nama Pemilik Kartu
                    </label>
                    <input
                      id="cc-name"
                      name="cc-name"
                      type="text"
                      autoComplete="cc-name"
                      required
                      placeholder="Nama sesuai di kartu"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="sm-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="sm-field">
                      {/* Mandatory per autofill-payment-form: Hint placed ABOVE input & linked via aria-describedby */}
                      <div className="flex items-center justify-between">
                        <label htmlFor="cc-exp" className="sm-label">
                          Masa Berlaku
                        </label>
                        <span id="exp-hint" className="text-[10px] text-[#8A7968]">
                          MM/YY
                        </span>
                      </div>
                      <input
                        id="cc-exp"
                        name="cc-exp"
                        type="text"
                        autoComplete="cc-exp"
                        aria-describedby="exp-hint"
                        maxLength={5}
                        required
                        placeholder="MM/YY"
                        value={cardExp}
                        onChange={handleCardExpChange}
                        className="sm-input"
                      />
                    </div>

                    <div className="sm-field">
                      <label htmlFor="cc-csc" className="sm-label">
                        CVV / CVC
                      </label>
                      <input
                        id="cc-csc"
                        name="cc-csc"
                        type="text"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) =>
                          setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        className="sm-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="sm-btn-primary w-full !py-2.5 mt-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Memproses Kartu...'
                        : `Bayar Tagihan Rp ${totalAmount.toLocaleString('id-ID')}`}
                    </span>
                  </button>
                </form>
              )}

              {/* =========================================================== */}
              {/* TAB 4: BAYAR TUNAI DI KASIR                                 */}
              {/* =========================================================== */}
              {selectedMethod === 'cash' && (
                <div className="p-4 rounded-xl border border-[#DFD3C0] bg-[#FFFFFF] space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#8C6518]" />
                      <h4 className="font-serif-menu text-sm font-bold text-[#261C14]">
                        Pembayaran Tunai di Meja Kasir
                      </h4>
                    </div>
                    <p className="text-xs text-[#5C4D40] leading-relaxed">
                      Cocok untuk Anda yang ingin bersantap langsung di tempat. Pesanan
                      akan segera dikirim ke koki dapur Sutera Minang, dan Anda dapat
                      melakukan pembayaran tunai di kasir saat hidangan disajikan atau
                      sebelum beranjak pulang.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B5A4B] px-1">
                    <span>Tagihan yang disiapkan:</span>
                    <strong className="text-[#4A331F] font-serif-menu text-sm">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmPayment('cash')}
                    disabled={isProcessing}
                    className="sm-btn-primary w-full !py-2.5"
                  >
                    <span>Konfirmasi &amp; Bayar di Kasir</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
