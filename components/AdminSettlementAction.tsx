"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettlementAction({
  sellerId,
  net,
  disabled,
}: {
  sellerId: string;
  net: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!confirm(`${net.toLocaleString("ko-KR")}원을 정산(이체)할까요?`)) return;
    setBusy(true);
    const r = await fetch("/api/admin/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) {
      router.refresh();
    } else {
      alert(d.error ?? "정산에 실패했습니다.");
      router.refresh();
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy || disabled}
      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-40"
    >
      {busy ? "정산 중…" : "정산 실행"}
    </button>
  );
}
