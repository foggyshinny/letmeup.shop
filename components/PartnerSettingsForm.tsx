"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initial {
  name: string;
  phone: string;
  intro: string;
  bank: string;
  account: string;
  holder: string;
}

export default function PartnerSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(k: keyof Initial, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setOk(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    const r = await fetch("/api/partner/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        intro: form.intro,
        settlement: { bank: form.bank, account: form.account, holder: form.holder },
      }),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">담당자명</label>
          <input className="field mt-1.5" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold">연락처</label>
          <input className="field mt-1.5" value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">소개</label>
        <textarea className="field mt-1.5 min-h-20" value={form.intro} onChange={(e) => set("intro", e.target.value)} />
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="font-bold">정산 계좌</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-semibold">은행</label>
            <input className="field mt-1.5" value={form.bank} onChange={(e) => set("bank", e.target.value)} placeholder="국민은행" />
          </div>
          <div>
            <label className="text-sm font-semibold">계좌번호</label>
            <input className="field mt-1.5" value={form.account} onChange={(e) => set("account", e.target.value)} placeholder="123456-78-901234" />
          </div>
          <div>
            <label className="text-sm font-semibold">예금주</label>
            <input className="field mt-1.5" value={form.holder} onChange={(e) => set("holder", e.target.value)} placeholder="홍길동" />
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {ok && <p className="rounded-lg bg-brand-light p-3 text-sm text-brand">저장되었습니다.</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
