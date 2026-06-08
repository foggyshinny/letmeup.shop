"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { won } from "@/lib/format";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  paid: { text: "결제완료", cls: "bg-brand-light text-brand" },
  pending: { text: "결제대기", cls: "bg-slate-100 text-ink-muted" },
  failed: { text: "결제실패", cls: "bg-red-50 text-red-600" },
  canceled: { text: "취소", cls: "bg-slate-100 text-ink-muted" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  function copy(code: string) {
    navigator.clipboard?.writeText(code);
  }

  if (orders === null) {
    return <div className="container-page py-16 text-center text-ink-muted">불러오는 중…</div>;
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">구매내역</h1>
        <Link href="/account" className="text-sm font-semibold text-brand">마이페이지</Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-ink-muted">
          아직 구매내역이 없습니다.
          <div className="mt-4">
            <Link href="/coupons" className="btn-primary">쿠폰 구경하기</Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((o) => {
            const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.pending;
            return (
              <div key={o.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className={`chip ${st.cls}`}>{st.text}</span>
                    <span className="ml-2 font-mono text-sm text-ink-muted">{o.id}</span>
                  </div>
                  <div className="text-sm text-ink-muted">
                    {new Date(o.createdAt).toLocaleString("ko-KR")}
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((it) => (
                    <li key={it.couponId} className="flex justify-between">
                      <span>{it.title} <span className="text-slate-400">× {it.qty}</span></span>
                      <span className="font-semibold">{won(it.unitPrice * it.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm text-ink-muted">총 결제금액</span>
                  <span className="font-extrabold">{won(o.amount)}</span>
                </div>

                {/* 발급된 쿠폰 코드 */}
                {o.issuedCoupons && o.issuedCoupons.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold">발급된 쿠폰 코드</div>
                      {o.smsSent && <span className="text-xs text-brand">문자 발송됨 ✓</span>}
                    </div>
                    <ul className="mt-2 space-y-2">
                      {o.issuedCoupons.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-xs text-ink-muted">{c.title}</div>
                            <div className="font-mono text-sm font-bold">{c.code}</div>
                          </div>
                          <button
                            onClick={() => copy(c.code)}
                            className="shrink-0 text-xs font-semibold text-brand"
                          >
                            복사
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
