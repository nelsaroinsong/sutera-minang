import React, { useState } from 'react';
import { MenuItem } from '../types';
import { resolveDishImage } from '../data/initialMenu';
import {
  ArrowLeft,
  Plus,
  Minus,
  Star,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { playOrderChime } from '../utils/audio';

interface ItemDetailPageProps {
  item: MenuItem;
  onBackToMenu: () => void;
  onConfirmAddToCart: (item: MenuItem, quantity: number, notes: string) => void;
  onOpenCart: () => void;
  currentCartCount?: number;
}

const getDishRating = (item: MenuItem) => {
  const presets = [
    { rating: '4.9', reviews: '1.4k' },
    { rating: '4.8', reviews: '920' },
    { rating: '4.9', reviews: '1.2k' },
    { rating: '4.7', reviews: '680' },
    { rating: '4.8', reviews: '1.1k' },
    { rating: '4.9', reviews: '850' },
    { rating: '4.8', reviews: '740' },
    { rating: '4.9', reviews: '1.6k' },
  ];
  const hash = (item.item_number || 1) + item.name.length;
  return presets[hash % presets.length];
};

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  item,
  onBackToMenu,
  onConfirmAddToCart,
  onOpenCart,
  currentCartCount = 0,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  const imageSrc = resolveDishImage(item);
  const ratingInfo = getDishRating(item);
  const totalItemPrice = item.price * quantity;

  const handleAdd = () => {
    onConfirmAddToCart(item, quantity, notes);
    playOrderChime();
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-4">
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5DCCB] text-xs font-semibold text-[#4A331F] hover:bg-[#FAF6F0] hover:border-[#4A331F] transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Buku Menu</span>
        </button>

        <span className="text-xs text-[#8A7968] font-medium hidden sm:inline">
          Pusaka Kuliner Ranah Minang
        </span>
      </div>

      {/* Main Detail Card Container */}
      <div className="bg-white rounded-2xl border border-[#E5DCCB] shadow-sm overflow-hidden">
        {/* Hero Image Section */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#F3ECE2] overflow-hidden">
          <img
            src={imageSrc}
            alt={item.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                '/assets/menu/rendang-daging.jpg';
            }}
            className="w-full h-full object-cover"
          />

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#261C14]/85 text-[#FAF6F0] font-serif-menu text-xs font-bold backdrop-blur-xs shadow-md">
              Hidangan No. {item.item_number}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 shadow-md backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              100% Halal
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header & Price */}
          <div className="border-b border-[#EFE8DC] pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center justify-center w-4 h-4 border border-[#16A34A] rounded-[3px] p-[2px] bg-white shrink-0"
                title="100% Halal Thayyiban"
              >
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </span>

              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FDF6E4] text-[#9A6F18] border border-[#E5D4A7]">
                  {item.badge}
                </span>
              )}

              {item.is_signature && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#4A331F] text-[#F5DEB3]">
                  <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                  Signature Delicacy
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif-menu text-2xl sm:text-3xl font-bold text-[#261C14] leading-tight">
                {item.name}
              </h1>

              <div className="text-right shrink-0">
                <span className="font-serif-menu text-2xl sm:text-3xl font-bold text-[#4A331F] tabular-nums block">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-[#8A7968]">per porsi</span>
              </div>
            </div>

            {/* Ratings & Authenticity Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 text-xs">
              <div className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{ratingInfo.rating}</span>
                <span className="text-emerald-900/60 font-normal">
                  ({ratingInfo.reviews} ulasan)
                </span>
              </div>

              <div className="inline-flex items-center gap-1 text-[#7D5A14] bg-[#FAF6EC] px-2 py-0.5 rounded border border-[#E8DFCC]">
                <Flame className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Rempah Asli Darek</span>
              </div>

              <div className="inline-flex items-center gap-1 text-[#4A331F] bg-[#F5EDE1] px-2 py-0.5 rounded border border-[#E0D3BE]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A331F]" />
                <span>Resep Turun-Temurun</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A7968]">
              Deskripsi Hidangan
            </h2>
            <p className="text-sm text-[#4A3D33] leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Notes Input Field */}
          <div className="sm-field pt-1">
            <label htmlFor="item-notes" className="sm-label flex items-center justify-between">
              <span>Catatan Khusus Porsi (Opsional)</span>
              <span className="text-[10px] text-[#8A7968] font-normal lowercase">
                opsional
              </span>
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kuah dipisah, sambal lebih banyak, es sedikit..."
              rows={3}
              className="sm-textarea !min-h-[80px]"
            />
          </div>

          {/* Feedback Toast When Added */}
          {addedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{quantity}x {item.name}</strong> berhasil ditambahkan ke keranjang!
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenCart}
                className="font-bold underline text-emerald-900 hover:text-emerald-700 whitespace-nowrap ml-2"
              >
                Lihat Keranjang
              </button>
            </div>
          )}

          {/* Bottom Action Section: Stepper & CTA */}
          <div className="pt-4 border-t border-[#EFE8DC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs font-semibold text-[#5C4D40] sm:hidden">
                Jumlah Porsi:
              </span>
              <div className="inline-flex items-center bg-[#FAF6F0] p-1 rounded-xl border border-[#D6C7B2]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#4A331F] hover:bg-[#EFE7DA] disabled:opacity-30 transition-colors"
                  aria-label="Kurangi porsi"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-serif-menu text-base font-bold text-[#261C14] w-10 text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#4A331F] hover:bg-[#EFE7DA] transition-colors"
                  aria-label="Tambah porsi"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!item.is_available}
              className="sm-btn-primary !min-h-[46px] !px-6 flex-1 !justify-between shadow-md"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Tambah Pesanan</span>
              </span>
              <span className="font-serif-menu text-base font-bold text-[#F5DEB3] tabular-nums">
                Rp {totalItemPrice.toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
