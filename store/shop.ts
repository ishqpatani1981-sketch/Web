'use client';

import { useIsClient } from '@/lib/client-env';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Minimal product snapshot stored client-side. Prices are display-only — the server
 * recalculates everything from the database at checkout. */
export type ProductSnapshot = {
  productId: string;
  slug: string;
  name: string;
  pricePence: number | null;
  imageUrl: string | null;
  colour: string | null;
  penType: string | null;
  maxQuantity: number | null;
};

export type BasketItem = ProductSnapshot & { quantity: number };

const MAX_QTY = 10;

const safeStorage = createJSONStorage(() => {
  try {
    const k = '__po_test__';
    window.localStorage.setItem(k, k);
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
  }
});

type BasketState = {
  items: BasketItem[];
  discountCode: string;
  deliveryOptionId: string | null;
  add: (p: ProductSnapshot, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setDiscountCode: (code: string) => void;
  setDeliveryOption: (id: string | null) => void;
};

export const useBasket = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      discountCode: '',
      deliveryOptionId: null,
      add: (p, qty = 1) =>
        set((s) => {
          const limit = Math.min(MAX_QTY, p.maxQuantity ?? MAX_QTY);
          const existing = s.items.find((i) => i.productId === p.productId);
          if (existing) {
            return { items: s.items.map((i) => (i.productId === p.productId ? { ...i, ...p, quantity: Math.min(limit, i.quantity + qty) } : i)) };
          }
          return { items: [...s.items, { ...p, quantity: Math.max(1, Math.min(limit, qty)) }] };
        }),
      setQuantity: (productId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(Math.min(MAX_QTY, i.maxQuantity ?? MAX_QTY), Math.floor(qty))) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [], discountCode: '' }),
      setDiscountCode: (code) => set({ discountCode: code.trim().toUpperCase().slice(0, 40) }),
      setDeliveryOption: (id) => set({ deliveryOptionId: id }),
    }),
    { name: 'po-basket', storage: safeStorage, version: 1 },
  ),
);

type WishlistState = {
  items: ProductSnapshot[];
  toggle: (p: ProductSnapshot) => boolean;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) => {
        const exists = get().items.some((i) => i.productId === p.productId);
        set({ items: exists ? get().items.filter((i) => i.productId !== p.productId) : [p, ...get().items].slice(0, 100) });
        return !exists;
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      has: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'po-wishlist', storage: safeStorage, version: 1 },
  ),
);

type RecentState = { items: ProductSnapshot[]; push: (p: ProductSnapshot) => void };

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (p) => set({ items: [p, ...get().items.filter((i) => i.productId !== p.productId)].slice(0, 12) }),
    }),
    { name: 'po-recent', storage: safeStorage, version: 1 },
  ),
);

type UiState = {
  basketOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  toast: { id: number; message: string } | null;
  setBasketOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  showToast: (message: string) => void;
};

export const useUi = create<UiState>()((set) => ({
  basketOpen: false,
  searchOpen: false,
  menuOpen: false,
  toast: null,
  setBasketOpen: (v) => set({ basketOpen: v, searchOpen: false, menuOpen: false }),
  setSearchOpen: (v) => set({ searchOpen: v, basketOpen: false, menuOpen: false }),
  setMenuOpen: (v) => set({ menuOpen: v, basketOpen: false, searchOpen: false }),
  showToast: (message) => set({ toast: { id: Date.now(), message } }),
}));

/** Avoids hydration mismatches for values read from localStorage. */
export function useHydrated() {
  return useIsClient();
}

export function useBasketCount() {
  const hydrated = useHydrated();
  const count = useBasket((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return hydrated ? count : 0;
}
