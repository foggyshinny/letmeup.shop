"use client";

import { useEffect, useState } from "react";
import type { PayMethod, SavedPaymentMethod } from "@/lib/types";

const SIMPLE_PAYS: { method: PayMethod; label: string }[] = [
  { method: "applepay", label: "Apple Pay" },
  { method: "googlepay", label: "Google Pay" },
  { method: "kakaopay", label: "카카오페이" },
  { method: "naverpay", label: "네이버페이" },
  { method: "samsungpay", label: "삼성페이" },
];

export default function PaymentMethodsPage() {
  const [list, setList] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", holder: "" });

  async function load() {
    const r = await fetch("/api/payment-methods");
    const d = await r.json();
    setList(d.paymentMethods ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function registerCard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const [expMonth, expYear] = card.exp.split("/").map((s) => s.trim());
    if (!card.number || !expMonth || !expYear) {
      setError("카드 정보를 확인해 주세요. (유효기간은 MM/YY 형식)");
      return;
    }
    setBusy(true);
    const r = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "card",
        number: card.number,
        expMonth,
        expYear,
        holder: card.holder,
      }),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "카드 등록에 실패했습니다.");
      return;
    }
    setCard({ number: "", exp: "", cvc: "", holder: "" });
    load();
  }

  async function connectSimplePay(method: PayMethod) {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: method }),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "연결에 실패했습니다.");
      return;
    }
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    load();
  }
  async function makeDefault(id: string) {
    await fetch(`/api/payment-methods/${id}`, { method: "PATCH" });
    load();
  }

  const connectedTypes = new Set(list.map((p) => p.type));

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">내 결제수단</h1>
      <p className="mt-2 text-ink-muted">
        카드나 간편결제를 등록해두면 다음 구매부터 빠르게 결제할 수 있어요.
      </p>

      {/* 등록된 목록 */}
      <section className="mt-8">
        <h2 className="text-lg font-extrabold">등록된 결제수단</h2>
        {loading ? (
          <div className="mt-4 text-ink-muted">불러오는 중…</div>
        ) : list.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-ink-muted">
            아직 등록된 결제수단이 없습니다.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {list.map((pm) => (
              <li
                key={pm.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100"
              >
                <span className="grid h-10 w-12 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  {pm.type === "card" ? "CARD" : pm.label.slice(0, 3)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{pm.label}</span>
                    {pm.isDefault && (
                      <span className="chip bg-brand-light text-brand">기본</span>
                    )}
                  </div>
                  {pm.type === "card" && pm.expMonth && (
                    <div className="text-xs text-ink-muted">
                      유효기간 {pm.expMonth}/{pm.expYear} · 자동결제 등록됨
                    </div>
                  )}
                </div>
                {!pm.isDefault && (
                  <button
                    onClick={() => makeDefault(pm.id)}
                    className="text-sm font-semibold text-brand"
                  >
                    기본으로
                  </button>
                )}
                <button
                  onClick={() => remove(pm.id)}
                  className="text-sm text-ink-muted hover:text-accent"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* 카드 등록 */}
      <section className="mt-10 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <h2 className="text-lg font-extrabold">카드 등록</h2>
        <p className="mt-1 text-sm text-ink-muted">
          카드번호는 저장되지 않으며, KSNET 자동결제 키(빌링키)만 안전하게 보관됩니다.
        </p>
        <form onSubmit={registerCard} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">카드번호</label>
            <input
              className="field mt-1.5"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">유효기간 (MM/YY)</label>
              <input
                className="field mt-1.5"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
                placeholder="12/27"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">CVC</label>
              <input
                className="field mt-1.5"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                placeholder="***"
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">카드 소유자명 (선택)</label>
            <input
              className="field mt-1.5"
              value={card.holder}
              onChange={(e) => setCard({ ...card, holder: e.target.value })}
              placeholder="홍길동"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "등록 중…" : "카드 등록하기"}
          </button>
        </form>
      </section>

      {/* 간편결제 연결 */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <h2 className="text-lg font-extrabold">간편결제 연결</h2>
        <p className="mt-1 text-sm text-ink-muted">
          앱·웹에서 애플페이, 구글페이, 카카오·네이버·삼성페이로 결제할 수 있어요.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SIMPLE_PAYS.map((p) => {
            const connected = connectedTypes.has(p.method);
            return (
              <button
                key={p.method}
                disabled={busy || connected}
                onClick={() => connectSimplePay(p.method)}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-brand disabled:opacity-60"
              >
                <span className="font-semibold">{p.label}</span>
                <span className="text-sm text-ink-muted">
                  {connected ? "연결됨 ✓" : "연결"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
