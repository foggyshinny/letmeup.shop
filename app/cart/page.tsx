"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { won } from "@/lib/format";

export default function CartPage() {
  const { lines, setQty, remove, subtotal, ready, findCoupon } = useCart();

  if (!ready) {
    return <div className="container-page py-16 text-center text-ink-muted">불러오는 중…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-4 text-2xl font-extrabold">장바구니가 비어 있어요</h1>
        <p className="mt-2 text-ink-muted">마음에 드는 할인 쿠폰을 담아보세요.</p>
        <Link href="/coupons" className="btn-primary mt-6">쿠폰 구경하기</Link>
      </div>
    );
  }

  const items = lines
    .map((l) => ({ line: l, coupon: findCoupon(l.couponId) }))
    .filter((x): x is { line: typeof x.line; coupon: NonNullable<typeof x.coupon> } => !!x.coupon);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">장바구니</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map(({ line, coupon }) => (
            <div
              key={coupon.id}
              className="flex gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100"
            >
              <div className={`h-20 w-24 shrink-0 rounded-xl bg-gradient-to-br ${coupon.thumb}`} />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-ink-muted">{coupon.brand}</div>
                    <Link href={`/coupons/${coupon.id}`} className="font-bold hover:text-brand">
                      {coupon.title}
                    </Link>
                  </div>
                  <button
                    onClick={() => remove(coupon.id)}
                    className="text-sm text-ink-muted hover:text-accent"
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-lg ring-1 ring-slate-200">
                    <button
                      onClick={() => setQty(coupon.id, line.qty - 1)}
                      className="grid h-8 w-8 place-items-center font-bold text-ink-muted"
                      aria-label="감소"
                    >−</button>
                    <span className="w-8 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      onClick={() => setQty(coupon.id, line.qty + 1)}
                      className="grid h-8 w-8 place-items-center font-bold text-ink-muted"
                      aria-label="증가"
                    >+</button>
                  </div>
                  <div className="font-extrabold">{won(coupon.price * line.qty)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
          <h2 className="text-lg font-extrabold">결제 정보</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">상품금액</span>
              <span className="font-semibold">{won(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">수수료</span>
              <span className="font-semibold text-brand">무료</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
            <span className="font-bold">총 결제금액</span>
            <span className="text-2xl font-extrabold">{won(subtotal)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            결제하기
          </Link>
          <Link href="/coupons" className="btn-ghost mt-2 w-full">
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    </div>
  );
}
