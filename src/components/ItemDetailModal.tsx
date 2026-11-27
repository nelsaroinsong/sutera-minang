import React, { useEffect, useRef, useState } from 'react';
import { MenuItem } from '../types';
import { resolveDishImage } from '../data/initialMenu';
import { X, Plus, Minus } from 'lucide-react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, quantity: number, notes: string) => void;
  initialQuantity?: number;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
  initialQuantity = 1,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity(initialQuantity > 0 ? initialQuantity : 1);
      setNotes('');
    }
  }, [item, initialQuantity]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom;
    if (isOutside) {
      onClose();
    }
  };

  if (!item) return null;

  const imageSrc = resolveDishImage(item);

  return (
    <dialog
      ref={dialogRef}
      onPointerDown={handlePointerDown}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-item-title"
      className="m-auto p-0 rounded-2xl bg-[#FFFFFF] text-[#261C14] border border-[#DFD3C0] shadow-2xl w-full max-w-md overflow-hidden"
    >
      <div onClick={(e) => e.stopPropagation()}>
        {/* Dish Hero Image */}
        <div className="relative h-48 w-full bg-[#F3ECE2]">
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FFFFFF]/90 text-[#261C14] border border-[#E5DCCB] flex items-center justify-center shadow-md hover:bg-[#FFFFFF]"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-[#261C14]/85 text-[#FAF6F0] font-serif-menu text-xs font-bold">
            Hidangan No. {item.item_number}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[#EFE8DC] pb-3">
            <div>
              {item.badge && (
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#F5ECD9] text-[#7D5A14] border border-[#DFC99B] mb-1">
                  {item.badge}
                </span>
              )}
              <h2
                id="dialog-item-title"
                className="font-serif-menu text-xl font-bold text-[#261C14]"
              >
                {item.name}
              </h2>
            </div>

            <span className="font-serif-menu text-lg font-bold text-[#4A331F] tabular-nums shrink-0">
              Rp {item.price.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-[#5C4D40] leading-relaxed">
            {item.description}
          </p>

          {/* Custom Notes */}
          <div className="sm-field">
            <label htmlFor="item-custom-notes" className="sm-label">
              Catatan Khusus Porsi (Opsional)
            </label>
            <textarea
              id="item-custom-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kuah dipisah, sambal lebih banyak, es sedikit..."
              className="sm-textarea"
            />
          </div>

          {/* Stepper & Confirm */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#EFE8DC]">
            <div className="inline-flex items-center gap-2 bg-[#FAF6F0] px-2.5 py-1.5 rounded-lg border border-[#D6C7B2]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-6 h-6 flex items-center justify-center rounded text-[#4A331F] hover:bg-[#EFE7DA] disabled:opacity-30"
                aria-label="Kurangi porsi"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-serif-menu text-sm font-bold text-[#261C14] w-6 text-center tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 flex items-center justify-center rounded text-[#4A331F] hover:bg-[#EFE7DA]"
                aria-label="Tambah porsi"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onConfirm(item, quantity, notes);
                onClose();
              }}
              className="sm-btn-primary flex-1 !justify-between !px-4"
            >
              <span>Tambah Pesanan</span>
              <span className="font-bold text-[#F5DEB3] tabular-nums">
                Rp {(item.price * quantity).toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
