"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import type { Coupon } from "@/lib/types";

export default function AddToCart({ coupon }: { coupon: Coupon }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = coupon.stock !== null && coupon.stock <= 0;

  const handleAdd = () => {
    add(coupon.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    add(coupon.id, qty);
    router.push("/cart");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-ink-muted">수량</span>
        <div className="inline-flex items-center rounded-xl ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-10 w-10 place-items-center text-lg font-bold text-ink-muted hover:text-ink"
            aria-label="수량 감소"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-10 w-10 place-items-center text-lg font-bold text-ink-muted hover:text-ink"
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="btn-ghost flex-1"
        >
          {added ? "✓ 담았습니다" : "장바구니 담기"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={soldOut}
          className="btn-primary flex-1"
        >
          {soldOut ? "품절" : "바로 구매"}
        </button>
      </div>
    </div>
  );
}
