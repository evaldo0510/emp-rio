import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./products";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendor_id?: string;
  seller_id?: string;
};

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === p.id);
          if (existing) {
            return {
              items: s.items.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + qty } : i)),
            };
          }
          return {
            items: [
              ...s.items,
              {
                id: p.id,
                slug: p.slug,
                name: p.name,
                price: p.price,
                image: p.image,
                quantity: qty,
                vendor_id: (p as any).vendor_id || (p as any).seller_id,
              },
            ],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.quantity * i.price, 0),
    }),
    { name: "licuri-hub-cart" },
  ),
);
