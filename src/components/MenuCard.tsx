import React from 'react';
import { MenuItem } from '../types';
import { resolveDishImage } from '../data/initialMenu';
import { Star, ChevronRight, Plus, Minus } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  cartCount: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity?: (itemId: string, delta: number) => void;
  onClickDetail: (item: MenuItem) => void;
  isHighlighted?: boolean;
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

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  cartCount,
  onAddToCart,
  onUpdateQuantity,
  onClickDetail,
  isHighlighted = false,
}) => {
  const imageSrc = resolveDishImage(item);
  const priceShort = `Rp ${item.price.toLocaleString('id-ID')}`;
  const ratingInfo = getDishRating(item);

  return (
    <article
      onClick={() => {
        if (item.is_available) onClickDetail(item);
      }}
      className={`sm-dish-card group ${
        !item.is_available
          ? 'opacity-60 grayscale cursor-not-allowed'
          : 'cursor-pointer'
      } ${
        cartCount > 0
          ? 'ring-1.5 ring-[#16A34A]/40 !border-[#16A34A]/50 bg-[#FCFDFB]'
          : isHighlighted
          ? 'border-[#C89D42]/60'
          : ''
      }`}
    >
      {/* Left Column: Details */}
      <div className="flex-1 min-w-0 pr-2 flex flex-col justify-between self-stretch">
        <div>
          {/* Halal / Veg Icon + Optional Badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-flex items-center justify-center w-3.5 h-3.5 border border-[#16A34A] rounded-[3px] p-[2px] bg-white shrink-0"
              title="100% Halal Thayyiban"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            </span>
            {item.badge && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FDF6E4] text-[#9A6F18] border border-[#E5D4A7]">
                {item.badge}
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h3 className="font-bold text-[15px] sm:text-base text-[#1E1915] leading-snug group-hover:text-[#4A331F] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Price */}
          <p className="text-xs sm:text-[13px] font-bold text-[#3D2C1E] tabular-nums mt-0.5">
            {priceShort}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] mt-1">
            <Star className="w-3 h-3 fill-[#16A34A] text-[#16A34A]" />
            <span>{ratingInfo.rating}</span>
            <span className="text-[#8C7A6B] font-normal">
              ({ratingInfo.reviews})
            </span>
          </div>

          {/* Short Description */}
          {item.description && (
            <p className="text-[11px] text-[#705E50] leading-snug line-clamp-2 mt-1.5">
              {item.description}
            </p>
          )}
        </div>

        {/* More Details > Pill Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClickDetail(item);
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#D5C9B7] text-[10.5px] font-medium text-[#5C4D40] bg-white hover:bg-[#FAF6F0] hover:border-[#4A331F] hover:text-[#261C14] transition-colors shadow-2xs"
          >
            <span>More Details</span>
            <ChevronRight className="w-3 h-3 text-[#8A7968]" />
          </button>
        </div>
      </div>

      {/* Right Column: Square Image + Floating Overlapping ADD Button */}
      <div className="relative shrink-0 flex flex-col items-center">
        <div className="w-[112px] h-[112px] sm:w-[124px] sm:h-[124px] rounded-2xl overflow-hidden bg-[#F3ECE2] border border-[#EAE2D5] shadow-xs">
          <img
            src={imageSrc}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                '/assets/menu/rendang-daging.jpg';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Floating Overlapping Button */}
        <div
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {item.is_available ? (
            cartCount > 0 && onUpdateQuantity ? (
              <div className="inline-flex items-center justify-between bg-white border border-[#E0D7CA] rounded-lg shadow-md px-1.5 py-1 min-w-[82px] text-[#16A34A] font-bold text-xs">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-emerald-50 rounded text-[#16A34A] transition-colors"
                  aria-label={`Kurangi ${item.name}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1 text-[#261C14] font-black text-xs tabular-nums">
                  {cartCount}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-emerald-50 rounded text-[#16A34A] transition-colors"
                  aria-label={`Tambah ${item.name}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                className="bg-white text-[#16A34A] hover:bg-emerald-50 font-black text-xs uppercase tracking-wider px-6 py-1.5 rounded-lg border border-[#E0D7CA] shadow-md active:scale-95 transition-all min-w-[76px] text-center"
              >
                ADD
              </button>
            )
          ) : (
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-3 py-1 rounded-lg border border-gray-200 shadow-xs whitespace-nowrap">
              HABIS
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
