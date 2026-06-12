"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Coupon } from "@/lib/types";
import { coupons as seedCoupons } from "@/lib/data";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (couponId: string, qty?: number) => void;
  setQty: (couponId: string, qty: number) => void;
  remove: (couponId: string) => void;
  clear: () => void;
  subtotal: number;
  ready: boolean;
  /** 병합된 카탈로그(시드 + 판매자 상품)에서 상품 조회 */
  findCoupon: (couponId: string) => Coupon | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "letmeup_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  // 시드 + 판매자 상품을 병합한 카탈로그 (서버 /api/coupons 에서 로드)
  const [catalog, setCatalog] = useState<Coupon[]>(seedCoupons);

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

  // 병합된 카탈로그 로드 (판매자 상품 포함). 실패 시 시드 유지.
  useEffect(() => {
    let alive = true;
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.coupons) && d.coupons.length > 0) {
          setCatalog(d.coupons);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const findCoupon = useMemo(() => {
    const map = new Map(catalog.map((c) => [c.id, c]));
    return (id: string) => map.get(id);
  }, [catalog]);

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
        const c = findCoupon(l.couponId);
        return s + (c ? c.price * l.qty : 0);
      }, 0),
    [lines, findCoupon],
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
    findCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
