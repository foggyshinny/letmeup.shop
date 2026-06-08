"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function SignupPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "회원가입에 실패했습니다.");
      return;
    }
    await refresh();
    router.push("/account");
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-extrabold">회원가입</h1>
      <p className="mt-2 text-ink-muted">가입하고 더 빠르게 구매하고 내역을 관리하세요.</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <div>
          <label className="text-sm font-semibold">이름</label>
          <input
            className="field mt-1.5"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="홍길동"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold">이메일</label>
          <input
            className="field mt-1.5"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@email.com"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold">비밀번호</label>
          <input
            className="field mt-1.5"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="8자 이상"
            required
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "가입 중…" : "회원가입"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-brand">로그인</Link>
      </p>
    </div>
  );
}
