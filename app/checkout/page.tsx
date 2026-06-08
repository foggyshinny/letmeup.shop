"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { coupons } from "@/lib/data";
import { won } from "@/lib/format";

export default function CheckoutPage() {
  const { lines, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", agree: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = lines
    .map((l) => ({ line: l, coupon: coupons.find((c) => c.id === l.couponId) }))
    .filter((x): x is { line: typeof x.line; coupon: NonNullable<typeof x.coupon> } => !!x.coupon);

  if (ready && lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-extrabold">결제할 상품이 없습니다</h1>
        <Link href="/coupons" className="btn-primary mt-6">쿠폰 구경하기</Link>
      </div>
    );
  }

  const valid =
    form.name.trim() && /^[0-9-]{9,}$/.test(form.phone) && form.email.includes("@") && form.agree;

  async function handlePay() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1) 주문 생성
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines,
          buyerName: form.name,
          buyerPhone: form.phone,
          buyerEmail: form.email,
        }),
      });
      if (!orderRes.ok) throw new Error("주문 생성에 실패했습니다.");
      const { orderId } = await orderRes.json();

      // 2) 결제 준비 (KSNET)
      const payRes = await fetch("/api/payments/ksnet/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const pay = await payRes.json();

      if (pay.mode === "live") {
        // 실거래: KSNET 결제창으로 폼 전송
        const f = document.createElement("form");
        f.method = "POST";
        f.action = pay.action;
        Object.entries(pay.fields as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          f.appendChild(input);
        });
        document.body.appendChild(f);
        f.submit();
        return;
      }

      // 모의 모드: 즉시 완료 처리
      clear();
      router.push(`/checkout/complete?order=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 처리 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">결제하기</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Buyer form */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
            <h2 className="text-lg font-extrabold">구매자 정보</h2>
            <p className="mt-1 text-sm text-ink-muted">
              쿠폰 발송 및 주문 확인을 위해 정확히 입력해 주세요.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold">이름</label>
                <input
                  className="field mt-1.5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">휴대폰 번호</label>
                <input
                  className="field mt-1.5"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">이메일</label>
                <input
                  className="field mt-1.5"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  inputMode="email"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
            <h2 className="text-lg font-extrabold">결제 수단</h2>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-light p-4 text-sm">
              <span className="text-xl">💳</span>
              <span className="font-semibold">KSNET 간편결제</span>
              <span className="text-ink-muted">(신용카드 · 계좌이체 · 간편결제)</span>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              />
              <span className="text-ink-muted">
                주문 내용을 확인했으며, 결제 진행 및{" "}
                <span className="font-semibold text-ink">개인정보 수집·이용</span>에 동의합니다.
                (쿠폰 상품은 발급 후 환불이 제한될 수 있습니다)
              </span>
            </label>
          </section>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
          <h2 className="text-lg font-extrabold">주문 상품</h2>
          <ul className="mt-4 space-y-3">
            {items.map(({ line, coupon }) => (
              <li key={coupon.id} className="flex justify-between gap-2 text-sm">
                <span className="text-ink-muted">
                  {coupon.title} <span className="text-slate-400">× {line.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{won(coupon.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
            <span className="font-bold">총 결제금액</span>
            <span className="text-2xl font-extrabold">{won(subtotal)}</span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={!valid || submitting}
            className="btn-primary mt-6 w-full"
          >
            {submitting ? "결제 진행 중…" : `${won(subtotal)} 결제하기`}
          </button>
          <p className="mt-3 text-center text-xs text-ink-muted">
            안전한 KSNET 결제 시스템으로 보호됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
