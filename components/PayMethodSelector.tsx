"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PayMethod, SavedPaymentMethod } from "@/lib/types";
import { classNames } from "@/lib/format";

export interface PaySelection {
  method: PayMethod;
  paymentMethodId?: string;
}

const SIMPLE_PAYS: { method: PayMethod; label: string; icon: string }[] = [
  { method: "applepay", label: "Apple Pay", icon: "Pay" },
  { method: "googlepay", label: "Google Pay", icon: "G" },
  { method: "kakaopay", label: "카카오페이", icon: "k" },
  { method: "naverpay", label: "네이버페이", icon: "N" },
  { method: "samsungpay", label: "삼성페이", icon: "S" },
];

export default function PayMethodSelector({
  value,
  onChange,
}: {
  value: PaySelection;
  onChange: (sel: PaySelection) => void;
}) {
  const [saved, setSaved] = useState<SavedPaymentMethod[]>([]);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => setSaved(d.paymentMethods ?? []))
      .catch(() => setSaved([]));

    // Apple Pay 사용 가능 여부 (Safari/지원 기기에서만)
    try {
      const w = window as unknown as { ApplePaySession?: { canMakePayments?: () => boolean } };
      if (w.ApplePaySession?.canMakePayments?.()) setApplePayAvailable(true);
    } catch {
      /* noop */
    }
  }, []);

  const isSelected = (sel: PaySelection) =>
    value.method === sel.method && value.paymentMethodId === sel.paymentMethodId;

  const Row = ({
    sel,
    icon,
    label,
    sub,
  }: {
    sel: PaySelection;
    icon: React.ReactNode;
    label: string;
    sub?: string;
  }) => (
    <button
      type="button"
      onClick={() => onChange(sel)}
      className={classNames(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
        isSelected(sel)
          ? "border-brand bg-brand-light ring-1 ring-brand"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {sub && <span className="block text-xs text-ink-muted">{sub}</span>}
      </span>
      <span
        className={classNames(
          "grid h-5 w-5 place-items-center rounded-full border",
          isSelected(sel) ? "border-brand bg-brand text-white" : "border-slate-300",
        )}
      >
        {isSelected(sel) && <span className="text-[11px]">✓</span>}
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      {saved.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">저장된 결제수단</span>
            <Link href="/account/payment-methods" className="text-xs font-semibold text-brand">
              관리
            </Link>
          </div>
          {saved.map((pm) => (
            <Row
              key={pm.id}
              sel={
                pm.type === "card"
                  ? { method: "saved", paymentMethodId: pm.id }
                  : { method: pm.type, paymentMethodId: pm.id }
              }
              icon={pm.type === "card" ? "💳" : pm.label.slice(0, 1)}
              label={pm.label}
              sub={pm.isDefault ? "기본 결제수단" : pm.type === "card" ? "자동결제" : undefined}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-bold">결제수단 선택</span>
        <Row sel={{ method: "card" }} icon="💳" label="신용/체크카드" sub="KSNET 안전결제" />
        {SIMPLE_PAYS.map((p) => {
          const disabled = p.method === "applepay" && !applePayAvailable;
          return (
            <button
              key={p.method}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ method: p.method })}
              className={classNames(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50",
                isSelected({ method: p.method })
                  ? "border-brand bg-brand-light ring-1 ring-brand"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                {p.icon}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold">{p.label}</span>
                {disabled && (
                  <span className="block text-xs text-ink-muted">
                    Safari·지원 기기에서 사용 가능
                  </span>
                )}
              </span>
              <span
                className={classNames(
                  "grid h-5 w-5 place-items-center rounded-full border",
                  isSelected({ method: p.method })
                    ? "border-brand bg-brand text-white"
                    : "border-slate-300",
                )}
              >
                {isSelected({ method: p.method }) && <span className="text-[11px]">✓</span>}
              </span>
            </button>
          );
        })}
      </div>

      <Link
        href="/account/payment-methods"
        className="block rounded-xl border border-dashed border-slate-300 p-3 text-center text-sm font-semibold text-ink-muted hover:border-brand hover:text-brand"
      >
        + 결제수단 등록·관리
      </Link>
    </div>
  );
}
