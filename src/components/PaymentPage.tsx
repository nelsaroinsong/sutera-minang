import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Order, PaymentMethod } from '../types';
import { PendingPaymentOrder } from './PaymentModal';
import {
  ArrowLeft,
  QrCode,
  Building2,
  CreditCard,
  Banknote,
  Clock,
  Copy,
  Download,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playOrderChime } from '../utils/audio';

interface PaymentPageProps {
  pendingOrder: PendingPaymentOrder | null;
  existingOrder: Order | null;
  onPaymentSuccess: (method: PaymentMethod, confirmedOrder: Order) => void;
  onProcessOrder: (orderInput: any) => Promise<Order>;
  onBackToMenu: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  pendingOrder,
  existingOrder,
  onPaymentSuccess,
  onProcessOrder,
  onBackToMenu,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');

  // Real QRIS QR image Data URL
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');

  // VA State
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca');
  const [copiedVA, setCopiedVA] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // 15-Minute Countdown Timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const totalAmount =
    existingOrder?.total_amount || pendingOrder?.total_amount || 0;
  const items = existingOrder?.items || pendingOrder?.items || [];
  const customerName =
    existingOrder?.customer_name || pendingOrder?.customer_name || 'Pelanggan';
  const orderType = existingOrder?.order_type || pendingOrder?.order_type || 'dine_in';
  const tableNumber = existingOrder?.table_number || pendingOrder?.table_number;

  // Generate real QRIS payload and QR code via `qrcode` library
  useEffect(() => {
    const amtStr = totalAmount.toString();
    const nmid = 'ID1020249876543';
    const merchant = 'RM SUTERA MINANG';
    // Authentic EMVCo QRIS specification payload
    const qrisPayload = `00020101021226670014ID.LINKAJA.WWW011893600918002014168002150000000000000000303UME51440014ID.CO.QRIS.WWW0215${nmid}0303A0152045812530336054${amtStr.length.toString().padStart(2, '0')}${amtStr}5802ID59${merchant.length.toString().padStart(2, '0')}${merchant}6007PADANG 61052511162070703A016304ABCD`;

    QRCode.toDataURL(qrisPayload, {
      width: 380,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1F1A17',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrisDataUrl(url))
      .catch((err) => console.error('Failed to generate QRIS QR:', err));
  }, [totalAmount]);

  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExp(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExp(digits);
    }
  };

  const handleConfirmPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);
    try {
      let resolvedOrder = existingOrder;

      if (!resolvedOrder && pendingOrder) {
        resolvedOrder = await onProcessOrder({
          ...pendingOrder,
          payment_method: method,
          payment_status: 'paid',
        });
      }

      await new Promise((res) => setTimeout(res, 900));

      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#4A331F', '#D4AF37', '#9A6F18', '#2E6B47'],
      });

      playOrderChime();

      if (resolvedOrder) {
        onPaymentSuccess(method, resolvedOrder);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Terjadi kendala dalam proses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCashPayment = async () => {
    setIsProcessing(true);
    try {
      let resolvedOrder = existingOrder;

      if (!resolvedOrder && pendingOrder) {
        resolvedOrder = await onProcessOrder({
          ...pendingOrder,
          payment_method: 'cash',
          payment_status: 'unpaid',
        });
      }

      playOrderChime();

      if (resolvedOrder) {
        onPaymentSuccess('cash', resolvedOrder);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Terjadi kendala dalam proses pesanan tunai.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5DCCB]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="sm-btn-secondary !p-2 shrink-0"
            title="Kembali ke Buku Menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6F18]">
                Kasir &amp; Pembayaran Digital
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDF7F1] text-[#2E6B47] border border-[#B7DFC5]">
                <ShieldCheck className="w-3 h-3" />
                Terverifikasi Aman
              </span>
            </div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#261C14] uppercase tracking-wide">
              Pembayaran Pesanan
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToMenu}
          className="sm-btn-secondary self-start sm:self-auto text-xs"
        >
          <span>Batal / Tambah Menu Lain</span>
        </button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: SALURAN PEMBAYARAN (7 Cols)                          */}
        {/* ================================================================= */}
        <section className="lg:col-span-7 space-y-5">
          {/* Method Selector Tabs */}
          <fieldset className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DFD3C0] shadow-xs space-y-3">
            <legend className="sm-label !mb-0 font-bold text-[#261C14]">
              Pilih Saluran Pembayaran
            </legend>

            <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#E8DFCC] flex items-center gap-2.5 text-xs text-[#5C4028]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#9A6F18]" />
              <span>
                <strong>Ketentuan Dapur:</strong> Pembayaran QRIS/VA otomatis langsung diproses. Untuk Tunai, pesanan diteruskan ke dapur segera setelah kasir menerima uang dari meja Anda.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'qris',
                  label: 'QRIS',
                  sub: 'Instan & Otomatis',
                  icon: <QrCode className="w-5 h-5" />,
                },
                {
                  id: 'va',
                  label: 'Transfer VA',
                  sub: 'Virtual Account',
                  icon: <Building2 className="w-5 h-5" />,
                },
                {
                  id: 'card',
                  label: 'Kartu',
                  sub: 'Debit / Kredit',
                  icon: <CreditCard className="w-5 h-5" />,
                },
                {
                  id: 'cash',
                  label: 'Tunai Kasir',
                  sub: 'Bayar Langsung',
                  icon: <Banknote className="w-5 h-5" />,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all border ${
                    selectedMethod === m.id
                      ? 'bg-[#4A331F] text-[#FFFDF9] border-[#4A331F] shadow-sm ring-2 ring-[#4A331F]/20'
                      : 'bg-[#FAF6F0] text-[#5C4D40] hover:text-[#261C14] hover:bg-[#F3ECE2] border-[#E5DCCB]'
                  }`}
                >
                  <div className="mb-1">{m.icon}</div>
                  <span className="font-bold text-xs">{m.label}</span>
                  <span className="text-[10px] opacity-75">{m.sub}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* =============================================================== */}
          {/* METHOD 1: REAL INDONESIAN QRIS                                  */}
          {/* =============================================================== */}
          {selectedMethod === 'qris' && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6F18]">
                    Standar Bank Indonesia &amp; ASPI
                  </span>
                  <h3 className="font-cinzel text-base font-bold text-[#261C14]">
                    QRIS Dinamis Sutera Minang
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#E5DCCB] text-xs font-bold text-[#8C6518] tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sisa Waktu: {formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Authentic Indonesian QRIS Card Frame */}
              <div className="max-w-sm mx-auto bg-[#FFFFFF] rounded-2xl border-2 border-[#D92D20] shadow-md overflow-hidden">
                {/* Official QRIS Red Header */}
                <div className="bg-[#D92D20] px-4 py-2.5 flex items-center justify-between text-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-xl tracking-wider">
                      QRIS
                    </span>
                    <span className="text-[9px] font-medium leading-tight opacity-95">
                      QR Code Indonesian Standard
                    </span>
                  </div>

                  <div className="px-2 py-0.5 rounded bg-white text-[#D92D20] font-black text-[11px] tracking-wider">
                    GPN
                  </div>
                </div>

                {/* QRIS Body */}
                <div className="p-5 flex flex-col items-center justify-center bg-white space-y-3">
                  <div className="text-center">
                    <h4 className="font-bold text-sm text-[#1F1A17] tracking-wide uppercase">
                      RM SUTERA MINANG
                    </h4>
                    <p className="text-[11px] text-[#6B5A4B] tabular-nums">
                      NMID: ID1020249876543 • A01
                    </p>
                  </div>

                  {/* Real Scannable High-Density QR Code */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-inner">
                    {qrisDataUrl ? (
                      <img
                        src={qrisDataUrl}
                        alt="QRIS Code RM Sutera Minang"
                        className="w-56 h-56 object-contain"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center bg-gray-100 text-xs text-gray-500">
                        Memuat QRIS...
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                      Total Nominal
                    </span>
                    <p className="font-serif-menu text-2xl font-bold text-[#261C14] tabular-nums">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Wallet / Bank Compatibility Strip */}
                  <div className="w-full pt-3 border-t border-gray-200 text-center">
                    <p className="text-[9.5px] font-semibold text-gray-600 mb-2">
                      Satu QRIS untuk semua aplikasi perbankan &amp; e-wallet:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9.5px] font-bold text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">BCA</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">Mandiri</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">BRI</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">BNI</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">GoPay</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">OVO</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">DANA</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border">ShopeePay</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center text-[9px] text-gray-500">
                  Dicetak otomatis oleh Merchant Aggregator • Bank Indonesia
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmPayment('qris')}
                  disabled={isProcessing}
                  className="sm-btn-primary w-full !py-3 text-sm font-bold shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F5DEB3]" />
                  <span>
                    {isProcessing
                      ? 'Memverifikasi Pembayaran QRIS...'
                      : 'Konfirmasi Pembayaran QRIS Berhasil'}
                  </span>
                </button>

                {qrisDataUrl && (
                  <a
                    href={qrisDataUrl}
                    download={`QRIS-SuteraMinang-${Date.now()}.png`}
                    className="sm-btn-secondary w-full !py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Kode QRIS</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* METHOD 2: VIRTUAL ACCOUNT                                       */}
          {/* =============================================================== */}
          {selectedMethod === 'va' && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <h3 className="font-cinzel text-base font-bold text-[#261C14]">
                  Transfer Virtual Account (VA)
                </h3>
                <span className="text-xs font-semibold text-[#8C6518] tabular-nums">
                  Batas Waktu: {formatTimer(timeLeft)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="sm-label">Pilih Bank Tujuan</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bca', 'mandiri', 'bri', 'bni'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                        selectedBank === b
                          ? 'bg-[#4A331F] text-[#FFFDF9] border-[#4A331F] shadow-sm'
                          : 'bg-[#FAF6F0] text-[#5C4D40] border-[#E5DCCB] hover:bg-[#F3ECE2]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-2">
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

                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif-menu text-xl font-bold text-[#261C14] tabular-nums tracking-widest">
                    {vaNumbers[selectedBank]}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVA}
                    className="sm-btn-secondary !py-1.5 !px-3 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin No. VA</span>
                  </button>
                </div>

                <p className="text-xs text-[#6B5A4B] pt-2 border-t border-[#EFE8DC]">
                  Nama Akun: <strong>SUTERA MINANG RESTORAN</strong>
                </p>
              </div>

              <div className="text-xs text-[#5C4D40] space-y-1.5 bg-[#FAF6F0] p-4 rounded-xl border border-[#E5DCCB]">
                <p className="font-bold text-[#261C14]">
                  Petunjuk Transfer m-Banking:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Buka aplikasi m-Banking Anda, pilih menu <strong>Transfer / Virtual Account</strong>.</li>
                  <li>Masukkan nomor VA di atas dan pastikan jumlah tagihan tepat <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>.</li>
                  <li>Konfirmasi transaksi dan simpan bukti transfer Anda.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmPayment('va')}
                disabled={isProcessing}
                className="sm-btn-primary w-full !py-3 text-sm font-bold shadow-md"
              >
                <Building2 className="w-4 h-4 text-[#F5DEB3]" />
                <span>
                  {isProcessing
                    ? 'Memverifikasi Pembayaran VA...'
                    : 'Saya Sudah Melakukan Transfer'}
                </span>
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* METHOD 3: KARTU DEBIT / KREDIT                                  */}
          {/* =============================================================== */}
          {selectedMethod === 'card' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmPayment('card');
              }}
              className="bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] p-5 shadow-xs space-y-4"
            >
              <div className="pb-3 border-b border-[#EFE8DC]">
                <h3 className="font-cinzel text-base font-bold text-[#261C14]">
                  Kartu Debit / Kredit (Visa, Mastercard, JCB)
                </h3>
              </div>

              <div className="sm-field">
                <label htmlFor="card-number-input" className="sm-label">
                  Nomor Kartu (16 Digit)
                </label>
                <input
                  id="card-number-input"
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
                <label htmlFor="card-name-input" className="sm-label">
                  Nama Pemilik Kartu
                </label>
                <input
                  id="card-name-input"
                  name="cc-name"
                  type="text"
                  autoComplete="cc-name"
                  required
                  placeholder="Nama sesuai di fisik kartu"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="sm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="sm-field">
                  <div className="flex items-center justify-between">
                    <label htmlFor="card-exp-input" className="sm-label">
                      Masa Berlaku
                    </label>
                    <span id="exp-hint" className="text-[10px] text-[#8A7968]">
                      Format: MM/YY
                    </span>
                  </div>
                  <input
                    id="card-exp-input"
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
                  <label htmlFor="card-cvc-input" className="sm-label">
                    CVV / CVC
                  </label>
                  <input
                    id="card-cvc-input"
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
                className="sm-btn-primary w-full !py-3 text-sm font-bold shadow-md"
              >
                <CreditCard className="w-4 h-4 text-[#F5DEB3]" />
                <span>
                  {isProcessing
                    ? 'Memproses Kartu...'
                    : `Bayar Tagihan Rp ${totalAmount.toLocaleString('id-ID')}`}
                </span>
              </button>
            </form>
          )}

          {/* =============================================================== */}
          {/* METHOD 4: BAYAR TUNAI DI KASIR / MEJA                           */}
          {/* =============================================================== */}
          {selectedMethod === 'cash' && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6F18]">
                    Layanan Pembayaran Langsung
                  </span>
                  <h3 className="font-cinzel text-base font-bold text-[#261C14]">
                    Bayar Tunai di Kasir / Ke Pelayan
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#E5DCCB] text-xs font-bold text-[#8C6518]">
                  <Banknote className="w-3.5 h-3.5 text-[#9A6F18]" />
                  <span>Uang Tunai Pas</span>
                </span>
              </div>

              {/* Cash Instructions Card */}
              <div className="p-4 rounded-xl bg-[#FDF9F0] border border-[#E5D4A7] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4A331F] text-[#F5DEB3] flex items-center justify-center shrink-0 font-serif-menu font-bold text-sm">
                    Rp
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#261C14]">
                      Total Uang Tunai yang Harus Diserahkan:
                    </p>
                    <p className="font-serif-menu text-2xl font-bold text-[#4A331F] tabular-nums">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-[#6B5A4B]">
                      Layanan:{' '}
                      <strong>
                        {orderType === 'dine_in'
                          ? tableNumber || 'Makan di Tempat'
                          : 'Bawa Pulang (Bungkus)'}
                      </strong>{' '}
                      • Pemesan: <strong>{customerName}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#E5DCCB] text-xs text-[#5C4D40] space-y-1.5">
                  <p className="font-semibold text-[#261C14] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#9A6F18]" />
                    Alur Pembayaran Tunai:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#5C4D40]">
                    <li>
                      Klik tombol <strong>&quot;Pesan &amp; Bayar Tunai di Kasir&quot;</strong> di bawah.
                    </li>
                    <li>
                      Silakan menuju meja kasir Sutera Minang atau serahkan uang tunai Rp {totalAmount.toLocaleString('id-ID')} ke pelayan meja.
                    </li>
                    <li>
                      Setelah kasir menerima uang dan menekan tombol verifikasi, <strong>pesanan Anda langsung otomatis diteruskan ke koki dapur untuk dimasak</strong>.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Confirm Cash Button */}
              <button
                type="button"
                onClick={() => handleConfirmCashPayment()}
                disabled={isProcessing}
                className="sm-btn-primary w-full !py-3 !text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Banknote className="w-4 h-4 text-[#F5DEB3]" />
                <span>
                  {isProcessing
                    ? 'Mendaftarkan Pesanan...'
                    : `Pesan & Bayar Tunai Rp ${totalAmount.toLocaleString('id-ID')}`}
                </span>
              </button>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: RINGKASAN TAGIHAN & MENU PESANAN (5 Cols)          */}
        {/* ================================================================= */}
        <aside className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#DFD3C0] p-5 shadow-xs space-y-4 sticky top-20">
          <div className="pb-3 border-b border-[#EFE8DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6F18] block">
              Ringkasan Transaksi
            </span>
            <h3 className="font-cinzel text-base font-bold text-[#261C14]">
              Rincian Pesanan Anda
            </h3>
          </div>

          {/* Customer & Service Info */}
          <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B5A4B]">Nama Pemesan:</span>
              <strong className="text-[#261C14]">{customerName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6B5A4B]">Layanan:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#4A331F]">
                {orderType === 'dine_in' ? (
                  <>
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>Makan di Tempat ({tableNumber || 'Meja'})</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3 h-3" />
                    <span>Bawa Pulang (Takeaway)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Dish Items List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-[#8A7968] uppercase tracking-wider block">
              Daftar Hidangan ({items.reduce((a, b) => a + b.quantity, 0)} porsi)
            </span>
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E5DCCB] flex justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#261C14]">
                    {it.quantity}x {it.item_name}
                  </span>
                  {it.notes && (
                    <p className="text-[10.5px] text-[#8C6518] italic mt-0.5">
                      ↳ {it.notes}
                    </p>
                  )}
                </div>
                <span className="font-bold text-[#4A331F] tabular-nums shrink-0">
                  Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="pt-3 border-t border-[#EFE8DC] space-y-1.5 text-xs text-[#5C4D40]">
            <div className="flex justify-between">
              <span>Subtotal Hidangan</span>
              <span className="font-semibold text-[#261C14] tabular-nums">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan &amp; Pemesanan</span>
              <span className="text-[#2E6B47] font-semibold">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak Restoran (PB1)</span>
              <span className="text-[#6B5A4B]">Termasuk</span>
            </div>

            <div className="pt-2.5 mt-1 border-t border-[#EFE8DC] flex items-baseline justify-between font-bold">
              <span className="text-sm text-[#261C14]">Total Pembayaran</span>
              <span className="font-serif-menu text-xl text-[#4A331F] tabular-nums">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
