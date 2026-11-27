import React from 'react';
import { Logo } from './Logo';
import {
  ShoppingBag,
  Clock,
  LogOut,
  User,
  UtensilsCrossed,
  ReceiptText,
} from 'lucide-react';
import { Order, UserProfile } from '../types';

export type CustomerTab =
  | 'menu'
  | 'my-orders'
  | 'profile'
  | 'payment'
  | 'receipt'
  | 'item-detail';

interface NavbarProps {
  user: UserProfile;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  activeOrder: Order | null;
  onOpenOrderTracker: () => void;
  customerSubTab: CustomerTab;
  onChangeCustomerSubTab: (tab: CustomerTab) => void;
  myOrdersCount: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  cartTotal,
  onOpenCart,
  activeOrder,
  onOpenOrderTracker,
  customerSubTab,
  onChangeCustomerSubTab,
  myOrdersCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E5DCCB]">
      {/* Primary Top Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (user.role === 'user') onChangeCustomerSubTab('menu');
          }}
          className="text-left focus:outline-none shrink-0"
        >
          <Logo size="sm" variant="compact" />
        </button>

        {/* Desktop Center Navigation (Pembeli) */}
        {user.role === 'user' && (
          <nav
            aria-label="Navigasi Utama Pembeli"
            className="hidden sm:inline-flex bg-[#F3ECE2] p-1 rounded-lg border border-[#E5DCCB] text-xs"
          >
            <button
              type="button"
              onClick={() => onChangeCustomerSubTab('menu')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                customerSubTab === 'menu' || customerSubTab === 'item-detail'
                  ? 'bg-[#4A331F] text-[#FFFDF9] shadow-2xs'
                  : 'text-[#5C4D40] hover:text-[#261C14]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu Hidangan</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeCustomerSubTab('my-orders')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                customerSubTab === 'my-orders'
                  ? 'bg-[#4A331F] text-[#FFFDF9] shadow-2xs'
                  : 'text-[#5C4D40] hover:text-[#261C14]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Pesanan Saya</span>
              {myOrdersCount > 0 && (
                <span
                  className={`px-1.5 rounded text-[10px] tabular-nums ${
                    customerSubTab === 'my-orders'
                      ? 'bg-[#FFFDF9]/20 text-[#FFFDF9]'
                      : 'bg-[#E5DCCB] text-[#261C14]'
                  }`}
                >
                  {myOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeCustomerSubTab('profile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                customerSubTab === 'profile'
                  ? 'bg-[#4A331F] text-[#FFFDF9] shadow-2xs'
                  : 'text-[#5C4D40] hover:text-[#261C14]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil Saya</span>
            </button>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {user.role === 'user' && (
            <>
              {activeOrder &&
                activeOrder.status !== 'completed' &&
                activeOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={onOpenOrderTracker}
                    className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDF6E4] border border-[#C9B99E] text-[#4A331F] text-xs font-semibold hover:bg-[#F7EBCF] transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#9A6F18]" />
                    <span className="tabular-nums">
                      {activeOrder.order_code}
                    </span>
                  </button>
                )}

              <button
                type="button"
                onClick={onOpenCart}
                className="sm-btn-primary !py-1.5 !px-3 !min-h-0 relative"
                aria-label="Buka Keranjang Pesanan"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartCount > 0 ? (
                  <span className="tabular-nums whitespace-nowrap">
                    {cartCount} • Rp {(cartTotal / 1000).toLocaleString('id-ID')}K
                  </span>
                ) : (
                  <span className="hidden md:inline">Keranjang</span>
                )}
              </button>
            </>
          )}

          {user.role === 'admin' && (
            <span className="hidden sm:inline text-xs font-semibold text-[#5C4D40]">
              {user.full_name}
            </span>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="sm-btn-secondary !py-1.5 !px-2.5 !min-h-0"
            title="Keluar dari sesi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (Pembeli) — Prevents text wrapping on phones */}
      {user.role === 'user' && (
        <nav
          aria-label="Navigasi Mobile Pembeli"
          className="sm:hidden grid grid-cols-3 border-t border-[#E5DCCB] bg-[#F3ECE2]/70 px-2 py-1 gap-1 text-xs"
        >
          <button
            type="button"
            onClick={() => onChangeCustomerSubTab('menu')}
            className={`py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
              customerSubTab === 'menu' || customerSubTab === 'item-detail'
                ? 'bg-[#4A331F] text-[#FFFDF9]'
                : 'text-[#5C4D40]'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeCustomerSubTab('my-orders')}
            className={`py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
              customerSubTab === 'my-orders'
                ? 'bg-[#4A331F] text-[#FFFDF9]'
                : 'text-[#5C4D40]'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Pesanan ({myOrdersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeCustomerSubTab('profile')}
            className={`py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
              customerSubTab === 'profile'
                ? 'bg-[#4A331F] text-[#FFFDF9]'
                : 'text-[#5C4D40]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
        </nav>
      )}
    </header>
  );
};
