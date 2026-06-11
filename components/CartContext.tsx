"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@/lib/types";
import { coupons } from "@/lib/data";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (couponId: string, qty?: number) => void;
  setQty: (couponId: string, qty: number) => void;
  remove: (couponId: string) => void;
  clear: () => void;
  subtotal: number;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "letmeup_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // 초기 로드 (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  // 변경 시 저장
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = (couponId: string, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.couponId === couponId);
      if (existing) {
        return prev.map((l) =>
          l.couponId === couponId ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { couponId, qty }];
    });
  };

  const setQty = (couponId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.couponId !== couponId)
        : prev.map((l) => (l.couponId === couponId ? { ...l, qty } : l)),
    );
  };

  const remove = (couponId: string) =>
    setLines((prev) => prev.filter((l) => l.couponId !== couponId));

  const clear = () => setLines([]);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const subtotal = useMemo(
    () =>
      lines.reduce((s, l) => {
        const c = coupons.find((x) => x.id === l.couponId);
        return s + (c ? c.price * l.qty : 0);
      }, 0),
    [lines],
  );

  const value: CartContextValue = {
    lines,
    count,
    add,
    setQty,
    remove,
    clear,
    subtotal,
    ready,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
