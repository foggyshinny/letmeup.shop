"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PartnerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    phone: "",
    email: "",
    bizNo: "",
    password: "",
    intro: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/partner/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "신청에 실패했습니다.");
      return;
    }
    router.push("/partner");
    router.refresh();
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="chip w-fit bg-brand-light text-brand">파트너 센터</div>
      <h1 className="mt-3 text-3xl font-extrabold">입점 신청</h1>
      <p className="mt-2 text-ink-muted">
        브랜드·매장의 쿠폰을 letmeup.shop에서 판매해 보세요. 도입비·고정비 없이
        판매가 일어났을 때만 수수료가 발생합니다. 신청 후 관리자 승인이 완료되면
        바로 상품을 등록할 수 있습니다.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">상호 / 브랜드명 *</label>
            <input
              className="field mt-1.5"
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="예: 렛미업"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">담당자명 *</label>
            <input
              className="field mt-1.5"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">연락처 *</label>
            <input
              className="field mt-1.5"
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="010-1234-5678"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">사업자등록번호</label>
            <input
              className="field mt-1.5"
              value={form.bizNo}
              onChange={(e) => set("bizNo", e.target.value)}
              placeholder="123-45-67890"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">이메일(로그인 ID) *</label>
            <input
              className="field mt-1.5"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="partner@brand.com"
              inputMode="email"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">비밀번호 * (8자 이상)</label>
            <input
              className="field mt-1.5"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold">판매하려는 상품 소개</label>
          <textarea
            className="field mt-1.5 min-h-24"
            value={form.intro}
            onChange={(e) => set("intro", e.target.value)}
            placeholder="어떤 상품/쿠폰을 어떤 가격대로 판매하고 싶으신가요?"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "신청 중…" : "입점 신청하기"}
        </button>
        <p className="text-center text-xs text-ink-muted">
          제출 시 개인정보 수집·이용에 동의하는 것으로 간주됩니다.
        </p>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        이미 입점 파트너이신가요?{" "}
        <Link href="/partner/login" className="font-semibold text-brand">판매자 로그인</Link>
      </p>
    </div>
  );
}
